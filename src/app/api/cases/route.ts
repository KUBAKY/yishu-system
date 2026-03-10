import { NextRequest, NextResponse } from "next/server";
import { appendCase, readCasesByUser } from "@/lib/cases-store";
import { resolveSession } from "@/lib/auth-store";
import { YishuCase } from "@/types/case";

export const runtime = "nodejs";

type SaveCasePayload = Omit<YishuCase, "id" | "createdAt" | "userId">;

function isValidPayload(payload: SaveCasePayload) {
  return (
    typeof payload.paradigm === "string" &&
    typeof payload.paradigmLabel === "string" &&
    typeof payload.question === "string" &&
    payload.question.trim().length >= 6 &&
    typeof payload.currentTime === "string" &&
    typeof payload.location === "string" &&
    typeof payload.result === "string" &&
    payload.result.trim().length > 0 &&
    typeof payload.model === "string" &&
    typeof payload.reference === "string" &&
    Array.isArray(payload.citations)
  );
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("yishu_session")?.value ?? "";
  const user = await resolveSession(token);
  if (!user) {
    return NextResponse.json({ cases: [] });
  }
  const list = await readCasesByUser(user.id);
  return NextResponse.json({ cases: list });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("yishu_session")?.value ?? "";
  const user = await resolveSession(token);
  if (!user) {
    return NextResponse.json({ error: "请先登录后保存推演记录" }, { status: 401 });
  }
  if (user.membership === "expired") {
    return NextResponse.json({ error: "试用已结束，续费后可新增推演记录" }, { status: 403 });
  }

  let payload: SaveCasePayload;
  try {
    payload = (await request.json()) as SaveCasePayload;
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: "推演记录参数不完整" }, { status: 400 });
  }

  const item: YishuCase = {
    ...payload,
    userId: user.id,
    paradigm: payload.paradigm.trim(),
    paradigmLabel: payload.paradigmLabel.trim(),
    question: payload.question.trim(),
    location: payload.location.trim(),
    model: payload.model.trim(),
    reference: payload.reference.trim(),
    citations: payload.citations,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  const saved = await appendCase(item);
  return NextResponse.json({ case: saved });
}
