import { smsCodeLimit } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";
import { createSmsCode } from "@/lib/auth-store";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

// @ts-expect-error - Global type definition for Prisma in development
if (globalThis.prisma) {
  // @ts-expect-error - Global type definition for Prisma in development
  prisma = globalThis.prisma;
} else {
  prisma = new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    // @ts-expect-error - Global type definition for Prisma in development
    globalThis.prisma = prisma;
  }
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = smsCodeLimit.check(ip, { windowMs: 60000, maxRequests: 3 });
  if (!allowed) return NextResponse.json({ error: "验证码发送过于频繁，请稍后再试" }, { status: 429 });

  let payload: { phone?: string };
  try {
    payload = (await request.json()) as { phone?: string };
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  if (!payload.phone || typeof payload.phone !== "string") {
    return NextResponse.json({ error: "手机号不能为空" }, { status: 400 });
  }

  try {
    const { code, phone } = createSmsCode(payload.phone);
    return NextResponse.json({
      ok: true,
      phone,
      devCode: process.env.NODE_ENV === "production" ? undefined : code,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "验证码发送失败" },
      { status: 400 },
    );
  }
}
