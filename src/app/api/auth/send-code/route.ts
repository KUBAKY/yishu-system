import { NextRequest, NextResponse } from "next/server";
import { createSmsCode } from "@/lib/auth-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
