import { NextRequest, NextResponse } from "next/server";
import { createSessionByPassword } from "@/lib/auth-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: { phone?: string; password?: string };
  try {
    payload = (await request.json()) as { phone?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  if (!payload.phone || typeof payload.phone !== "string") {
    return NextResponse.json({ error: "手机号不能为空" }, { status: 400 });
  }
  if (!payload.password || typeof payload.password !== "string") {
    return NextResponse.json({ error: "登录密码不能为空" }, { status: 400 });
  }

  try {
    const { token, user } = await createSessionByPassword(payload.phone, payload.password);
    const response = NextResponse.json({ authenticated: true, user });
    response.cookies.set({
      name: "yishu_session",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "登录失败" },
      { status: 400 },
    );
  }
}
