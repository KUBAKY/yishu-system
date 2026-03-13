import { inferenceLimit } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { retrieveClassicalCitations } from "@/lib/classical-references";
import { resolveSession } from "@/lib/auth-store";
import { appendCase } from "@/lib/cases-store";

import { InferencePayload } from "@/lib/inference/types";
import { getParadigmSpec, buildFoundationModules, buildLunarContext } from "@/lib/inference/prompt-builder";
import { validateMode, resolveAngles, validateAttachments, validateEventContext, validateNamingContext } from "@/lib/inference/validator";
import { runInferencePipeline, InferencePipelineContext } from "@/lib/inference/pipeline";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = inferenceLimit.check(ip, { windowMs: 60000, maxRequests: 10 });
  if (!allowed) return NextResponse.json({ error: "请求频率过高，请稍后再试" }, { status: 429 });
  const cookieStore = await cookies();
  const token = cookieStore.get("yishu_session")?.value;
  const user = token ? await resolveSession(token) : null;

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY 未配置" }, { status: 500 });
  }

  let payload: InferencePayload;
  try {
    payload = (await request.json()) as InferencePayload;
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const paradigm = (payload.paradigm ?? "").trim().toLowerCase();
  const question = (payload.question ?? "").trim();
  const currentTime = (payload.currentTime ?? new Date().toISOString()).trim();
  const analysisMode = validateMode(payload.analysisMode);

  const spec = getParadigmSpec(paradigm);
  if (!spec) {
    return NextResponse.json({ error: "术数范式不支持" }, { status: 400 });
  }

  let eventContext = { background: "", urgency: "", horizon: "", mood: "" };
  let namingContext: ReturnType<typeof validateNamingContext> | undefined;
  let angles: ReturnType<typeof resolveAngles>;
  let attachments: ReturnType<typeof validateAttachments> = [];
  const isNaming = analysisMode === "naming" || paradigm === "naming";
  const normalizedQuestion =
    question ||
    (isNaming
      ? "请依据五行取名并推荐姓氏"
      : analysisMode === "natal"
        ? "请给出我的整体命盘画像与长期指引"
        : "请给出阶段命盘推进建议");
  
  try {
    angles = resolveAngles(paradigm, payload.angles);
    attachments = validateAttachments(payload.attachments);
    const requiresImage = paradigm === "fengshui" || paradigm === "palmistry" || paradigm === "physiognomy";
    if (requiresImage && attachments.length === 0) {
      throw new Error("该专项至少上传1张图片");
    }
    if (analysisMode === "event") {
      eventContext = validateEventContext(payload.eventContext, normalizedQuestion);
    }
    if (isNaming) {
      namingContext = validateNamingContext(payload.namingContext);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "输入参数错误" },
      { status: 400 },
    );
  }

  const lunarContext = buildLunarContext(currentTime);
  const foundationModules = buildFoundationModules(paradigm, angles);

  const promptCitations = await retrieveClassicalCitations({
    paradigm: paradigm === "composite" || paradigm === "naming" ? "bazi" : paradigm,
    question: normalizedQuestion,
    limit: 2,
  });

  const citationsForContext = promptCitations.map((c) => ({
    title: c.title,
    chapter: c.chapter,
    quote: c.quote,
    source: "classical-references",
  }));

  const contextData: InferencePipelineContext = {
    payload,
    parsedTime: new Date(currentTime),
    currentTime,
    location: payload.location || "",
    normalizedQuestion,
    analysisMode,
    paradigm,
    angles,
    eventContext,
    attachments,
    spec,
    foundationModules,
    citations: citationsForContext,
    lunarContext: lunarContext ? `${lunarContext.solarDate} ${lunarContext.lunarDate} ${lunarContext.ganzhi}` : null,
    namingContext,
  };

  let finalResult = "";
  let finalModel = "openrouter/auto";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 90000); // give 90s for non-stream since pipeline takes longer

  try {
    const res = await runInferencePipeline(contextData, controller.signal, false);
    finalResult = res.finalResult || "";
    finalModel = res.finalModel || finalModel;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[inference/route] Error:", error);
    return NextResponse.json({ error: "推演管道执行异常" }, { status: 500 });
  }

  clearTimeout(timeoutId);

  if (!finalResult) {
    return NextResponse.json({ error: "推演引擎响应为空" }, { status: 502 });
  }

  const outputCitations = promptCitations.map((c) => ({
    title: c.title,
    chapter: c.chapter,
    quote: c.quote,
    source: "classical-references",
  }));

  try {
    await appendCase({
      id: crypto.randomUUID(),
      userId: user ? user.id : "guest",
      paradigm,
      paradigmLabel: spec.label,
      question: normalizedQuestion,
      location: payload.location || "",
      currentTime,
      result: finalResult,
      model: finalModel,
      reference: spec.reference,
      lunarContext: lunarContext ? {
        solarDate: lunarContext.solarDate,
        lunarDate: lunarContext.lunarDate,
        ganzhi: lunarContext.ganzhi
      } : undefined,
      foundations: foundationModules,
      engineData: {},
      aiEnhancements: [
        "多范式交叉校验",
        "证据链机构化重排",
        "分阶段行动建议生成",
      ],
      citations: outputCitations,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to save case:", error);
  }

  return NextResponse.json({
    result: finalResult,
    meta: {
      paradigm,
      paradigmLabel: spec.label,
      analysisMode,
      angles,
      model: finalModel,
      reference: spec.reference,
      citations: outputCitations,
      lunarContext: lunarContext ?? undefined,
      foundations: foundationModules,
      engineData: {},
      aiEnhancements: [
        "多范式交叉校验",
        "证据链机构化重排",
        "分阶段行动建议生成",
      ],
    },
  });
}
