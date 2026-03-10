import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  void _request;
  return NextResponse.json(
    { error: "验证码登录已停用，请使用手机号+密码登录；注册时验证码仅用于校验手机号" },
    { status: 410 },
  );
}
