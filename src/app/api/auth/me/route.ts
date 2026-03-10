import { NextRequest, NextResponse } from "next/server";
import { readProfileHistory, resolveSession, upsertUserProfile } from "@/lib/auth-store";
import { UserProfile } from "@/types/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("yishu_session")?.value ?? "";
  const user = await resolveSession(token);
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }
  const includeHistory = request.nextUrl.searchParams.get("history") === "1";
  if (includeHistory) {
    const profileHistory = await readProfileHistory(user.id);
    return NextResponse.json({ authenticated: true, user, profileHistory });
  }
  return NextResponse.json({ authenticated: true, user });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("yishu_session")?.value ?? "";
  const user = await resolveSession(token);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let payload: { profile?: UserProfile };
  try {
    payload = (await request.json()) as { profile?: UserProfile };
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  if (!payload.profile) {
    return NextResponse.json({ error: "个人档案不能为空" }, { status: 400 });
  }

  try {
    const nextUser = await upsertUserProfile(user.id, payload.profile);
    return NextResponse.json({ authenticated: true, user: nextUser });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "档案保存失败" },
      { status: 400 },
    );
  }
}
