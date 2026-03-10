import { NextRequest, NextResponse } from "next/server";
import { removeSession } from "@/lib/auth-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("yishu_session")?.value ?? "";
  await removeSession(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "yishu_session",
    value: "",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
