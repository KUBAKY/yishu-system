import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { retrieveClassicalCitations } from "@/lib/classical-references";
import { resolveSession } from "@/lib/auth-store";
import { appendCase } from "@/lib/cases-store";
import { getBaziData, getQimenBasicInfo, getLiuyaoData } from "@/lib/paradigm-engine";

import { InferencePayload } from "@/lib/inference/types";
import { getParadigmSpec, buildPrompt, buildFoundationModules, buildLunarContext } from "@/lib/inference/prompt-builder";
import { validateMode, validateProfile, validateForecastWindow, resolveAngles, validateAttachments, validateEventContext } from "@/lib/inference/validator";
import { callOpenRouter, normalizeResponseContent, hasInstitutionalStructure } from "@/lib/inference/llm-client";

export async function POST(request: NextRequest) {
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
  const location = (payload.location ?? "").trim();
  const analysisMode = validateMode(payload.analysisMode);

  const spec = getParadigmSpec(paradigm);
  if (!spec) {
    return NextResponse.json({ error: "术数范式不支持" }, { status: 400 });
  }

  let profile: ReturnType<typeof validateProfile>;
  let eventContext = { background: "", urgency: "", horizon: "", mood: "" };
  let forecastWindow: ReturnType<typeof validateForecastWindow>;
  let angles: ReturnType<typeof resolveAngles>;
  let attachments: ReturnType<typeof validateAttachments> = [];
  const normalizedQuestion =
    question || (analysisMode === "natal" ? "请给出我的整体命盘画像与长期指引" : "请给出阶段命盘推进建议");
  
  try {
    profile = validateProfile(payload.profile);
    forecastWindow = validateForecastWindow(payload.forecastWindow, analysisMode);
    angles = resolveAngles(paradigm, payload.angles);
    attachments = validateAttachments(payload.attachments);
    if (analysisMode === "event") {
      eventContext = validateEventContext(payload.eventContext, normalizedQuestion);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "输入参数错误" },
      { status: 400 },
    );
  }

  const lunarContext = buildLunarContext(currentTime);
  const parsedTime = new Date(currentTime);
  let engineContext = "";
  const engineData: Record<string, unknown> = {};

  if (!Number.isNaN(parsedTime.getTime())) {
    if (paradigm === "bazi" || paradigm === "composite" || (angles && angles.includes("八字"))) {
      try {
        const data = getBaziData(parsedTime);
        engineContext += `\n[八字排盘]\n四柱：${data.ganzhi.year} ${data.ganzhi.month} ${data.ganzhi.day} ${data.ganzhi.time}\n五行：${data.wuxing.year} ${data.wuxing.month} ${data.wuxing.day} ${data.wuxing.time}\n日主：${data.dayMaster} (${data.naiveStrength})\n节气：${data.seasons.jieqi}\n`;
        engineData.bazi = data;
      } catch (e) {
        console.error("Bazi engine error", e);
      }
    }
    if (paradigm === "qimen" || (angles && angles.includes("奇门"))) {
      try {
        const data = getQimenBasicInfo(parsedTime);
        engineContext += `\n[奇门排盘]\n节气：${data.jieqi}\n四柱：${data.ganzhi}\n`;
        engineData.qimen = data;
      } catch (e) {
        console.error("Qimen engine error", e);
      }
    }
    if (paradigm === "liuyao" || (angles && angles.includes("六爻"))) {
      try {
        const background = eventContext.background || "";
        const match = background.match(/六爻卦象（初至上）：(.*?)；/);
        if (match && match[1]) {
          const yao = match[1].split("、");
          const data = getLiuyaoData(parsedTime, yao);
          engineContext += `\n[六爻排盘]\n本卦：${data.ben.name} (世${data.ben.shi || "?"}/应${data.ben.ying || "?"})\n`;
          if (data.bian) {
            engineContext += `变卦：${data.bian.name}\n`;
          }
          engineContext += `动爻：${data.movingLines.length > 0 ? data.movingLines.join(",") : "静卦"}\n`;
          engineContext += `日期：${data.date.ganzhi} (空亡:${data.date.xunkong})\n`;
          engineData.liuyao = data;
        }
      } catch (e) {
        console.error("Liuyao engine error", e);
      }
    }
  }

  const foundationModules = buildFoundationModules(paradigm, angles);
  const model = process.env.OPENROUTER_MODEL ?? "openrouter/auto";

  const promptCitations = await retrieveClassicalCitations({
    paradigm: paradigm === "composite" ? "bazi" : paradigm,
    question: normalizedQuestion,
    limit: 2,
  });

  const prompt = buildPrompt({
    paradigm,
    analysisMode,
    forecastWindow,
    angles,
    question: normalizedQuestion,
    currentTime,
    location,
    profile,
    eventContext: {
        background: eventContext?.background ?? "",
        urgency: eventContext?.urgency ?? "",
        horizon: eventContext?.horizon ?? "",
        mood: eventContext?.mood ?? ""
    },
    lunarContext,
    spec,
    foundationModules,
    imageContext: attachments.map((item) => ({
      name: item.name,
      note: item.note,
      category: item.category,
    })),
    engineContext,
    citations: promptCitations,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 45000);

  const userMessageContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: prompt },
    ...attachments.map((item) => ({ type: "image_url" as const, image_url: { url: item.dataUrl } })),
  ];

  const { data, fallbackError, response } = await callOpenRouter(key, model, userMessageContent, controller.signal);
  clearTimeout(timeoutId);

  if (!response || !response.ok) {
    return NextResponse.json(
      { error: data?.error?.message ?? (fallbackError || "模型调用失败") },
      { status: response ? (response.status >= 400 && response.status < 500 ? 400 : 502) : 502 },
    );
  }

  let rawContent = "";
  if (data && data.choices && data.choices.length > 0) {
    rawContent = normalizeResponseContent(data.choices[0].message?.content);
  } else {
    rawContent = "模型未返回有效内容";
  }

  let finalResult = rawContent;
  let finalModel = data?.model ?? model;

  if (!hasInstitutionalStructure(finalResult)) {
    const backupModel = "anthropic/claude-3-haiku";
    try {
      const backupResponse = await callOpenRouter(key, backupModel, userMessageContent, controller.signal);
      if (backupResponse.data?.choices && backupResponse.data.choices.length > 0) {
        finalResult = normalizeResponseContent(backupResponse.data.choices[0].message?.content);
        finalModel = backupResponse.data.model ?? backupModel;
      }
    } catch {
      // 降级失败则仍返回原文
    }
  }

  let mappedConfidence = 85;
  if (!hasInstitutionalStructure(finalResult)) {
    mappedConfidence = 60;
  }

  const citations = promptCitations.map((c) => ({
    title: c.title,
    chapter: c.chapter,
    quote: c.quote,
    source: "classical-references",
  }));

  try {
    await appendCase({
      title: `${modeLabel}: ${normalizedQuestion.slice(0, 20)}`,
      user_id: user ? user.id : "guest",
      mode: analysisMode,
      paradigm,
      confidence: mappedConfidence,
      prompt: prompt,
      result: finalResult,
      model: finalModel,
      reference: spec.reference,
      lunarContext: lunarContext ?? undefined,
      foundations: foundationModules,
      engineData,
      aiEnhancements: [
        "多范式交叉校验",
        "证据链机构化重排",
        "分阶段行动建议生成",
      ],
      citations,
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
      forecastWindow: forecastWindow ?? undefined,
      angles,
      model: finalModel,
      reference: spec.reference,
      citations,
      lunarContext: lunarContext ?? undefined,
      foundations: foundationModules,
      engineData,
      aiEnhancements: [
        "多范式交叉校验",
        "证据链机构化重排",
        "分阶段行动建议生成",
      ],
    },
  });
}
