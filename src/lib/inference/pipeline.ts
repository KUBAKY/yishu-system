import { getBaziData, getQimenBasicInfo, getLiuyaoData, getMeihuaData, getMeihuaDataFromTrigrams, getZodiacData } from "@/lib/paradigm-engine";
import { InferencePayload } from "@/lib/inference/types";
import { callOpenRouter } from "@/lib/inference/llm-client";
import { buildPrompt, buildLunarContext } from "@/lib/inference/prompt-builder";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const FAST_MODEL = process.env.OPENROUTER_FAST_MODEL || "anthropic/claude-3-haiku";
const REASONING_MODEL = process.env.OPENROUTER_REASONING_MODEL || "deepseek/deepseek-r1";
const FORMATTING_MODEL = process.env.OPENROUTER_FORMATTING_MODEL || "anthropic/claude-3.5-sonnet";

export type InferencePipelineContext = {
  payload: InferencePayload;
  parsedTime: Date;
  currentTime: string;
  location: string;
  normalizedQuestion: string;
  analysisMode: string;
  paradigm: string;
  angles: string[];
  eventContext?: { background?: string; urgency?: string; horizon?: string; mood?: string; };
  attachments?: Array<{ name?: string; type?: string; dataUrl?: string; note?: string; category?: string; }>;
  spec?: unknown;
  foundationModules?: unknown[];
  lunarContext: string | null;
  engineContext?: string;
  engineData?: Record<string, unknown>;
  citations?: { title: string; chapter?: string; quote: string; source: string }[];
  namingContext?: InferencePayload["namingContext"];
};

function formatNamingContext(naming?: InferencePayload["namingContext"]) {
  if (!naming) return "无";
  const child = naming.child ?? {};
  const father = naming.father ?? {};
  const mother = naming.mother ?? {};
  return [
    `孩子：性别${child.gender || "未知"}，出生${child.birthDate || "未知"} ${child.birthTime || "未知"}，出生地${child.birthLocation || "未知"}`,
    `父亲：姓名${father.name || "未知"}，性别${father.gender || "未知"}，生辰${father.birthDate || "未知"} ${father.birthTime || "未知"}`,
    `母亲：姓名${mother.name || "未知"}，性别${mother.gender || "未知"}，生辰${mother.birthDate || "未知"} ${mother.birthTime || "未知"}`,
  ].join("\\n");
}

function namingHasMissingTime(naming?: InferencePayload["namingContext"]) {
  if (!naming) return false;
  const childMissing = !naming.child?.birthTime;
  const fatherMissing = !naming.father?.birthTime;
  const motherMissing = !naming.mother?.birthTime;
  return childMissing || fatherMissing || motherMissing;
}

// Node 1: Intent Extraction (Fast Model)
async function extractIntent(ctx: InferencePipelineContext, signal: AbortSignal): Promise<string> {
  const prompt = `分析以下用户的术数问题并提取焦点：
用户背景：${JSON.stringify(ctx.payload.profile || {})}
目标事件：${JSON.stringify(ctx.eventContext || {})}
问题：${ctx.normalizedQuestion}
${ctx.namingContext ? `\\n起名信息：\\n${formatNamingContext(ctx.namingContext)}` : ""}

请简明扼要地总结：
1. 用户最关心的核心实体是什么？
2. 矛盾或决策的焦点在哪里？
3. 需要预测的时间线长短？
只返回分析文本，无需多余格式。`;

  const { data, fallbackError } = await callOpenRouter(OPENROUTER_API_KEY, FAST_MODEL, [
    { type: "text", text: prompt }
  ], signal, "你是一个擅长提炼核心问题焦点的助手。");

  if (data?.choices?.[0]?.message?.content) {
    const text = data.choices[0].message.content;
    return typeof text === 'string' ? text : text.map(t => t.text).join("");
  }
  return fallbackError || "无法提取明确意图";
}

// Node 2: Data Assembly (Pure Code)
function assembleEngineData(ctx: InferencePipelineContext) {
  let engineContext = "";
  const engineData: Record<string, unknown> = {};
  const meihuaTagRegex = /MEIHUA::upper=([^;]+);lower=([^;]+);moving=(\d+)/;
  const baguaNameToNum: Record<string, number> = {
    乾: 1,
    兑: 2,
    离: 3,
    震: 4,
    巽: 5,
    坎: 6,
    艮: 7,
    坤: 8,
  };

  if (!Number.isNaN(ctx.parsedTime.getTime())) {
    if (ctx.paradigm === "bazi" || ctx.paradigm === "composite" || (ctx.angles && ctx.angles.includes("八字"))) {
      try {
        const data = getBaziData(ctx.parsedTime);
        engineContext += `\\n[八字排盘]\\n四柱：${data.ganzhi.year} ${data.ganzhi.month} ${data.ganzhi.day} ${data.ganzhi.time}\\n五行：${data.wuxing.year} ${data.wuxing.month} ${data.wuxing.day} ${data.wuxing.time}\\n日主：${data.dayMaster} (${data.naiveStrength})\\n节气：${data.seasons.jieqi}\\n`;
        engineData.bazi = data;
      } catch (e) {
        console.error("Bazi engine error", e);
      }
    }
    if (ctx.paradigm === "qimen" || (ctx.angles && ctx.angles.includes("奇门"))) {
      try {
        const data = getQimenBasicInfo(ctx.parsedTime);
        engineContext += `\\n[奇门排盘]\\n节气：${data.jieqi}\\n四柱：${data.ganzhi}\\n`;
        engineData.qimen = data;
      } catch (e) {
        console.error("Qimen engine error", e);
      }
    }
    if (ctx.paradigm === "liuyao" || (ctx.angles && ctx.angles.includes("六爻"))) {
      try {
        const background = ctx.eventContext?.background || "";
        const match = background.match(/六爻卦象（初至上）：(.*?)；/);
        if (match && match[1]) {
          const yao = match[1].split("、");
          const data = getLiuyaoData(ctx.parsedTime, yao);
          engineContext += `\\n[六爻排盘]\\n本卦：${data.ben.name} (世${data.ben.shi || "?"}/应${data.ben.ying || "?"})\\n变卦：${data.bian ? data.bian.name : "无"}\\n动爻：${data.movingLines.length > 0 ? data.movingLines.join(",") : "静卦"}\\n日期：${data.date.ganzhi} (空亡:${data.date.xunkong})\\n`;
          engineData.liuyao = data;
        }
      } catch (e) {
        console.error("Liuyao engine error", e);
      }
    }
    if (ctx.paradigm === "meihua" || (ctx.angles && ctx.angles.includes("梅花"))) {
      try {
        const background = ctx.eventContext?.background || "";
        const tagMatch = background.match(meihuaTagRegex);
        let data = null as ReturnType<typeof getMeihuaData> | null;
        let sourceLabel = "时间起卦";
        if (tagMatch) {
          const upperName = tagMatch[1];
          const lowerName = tagMatch[2];
          const movingNum = Number(tagMatch[3]);
          const upperNum = baguaNameToNum[upperName];
          const lowerNum = baguaNameToNum[lowerName];
          if (upperNum && lowerNum && Number.isFinite(movingNum) && movingNum >= 1 && movingNum <= 6) {
            data = getMeihuaDataFromTrigrams(upperNum, lowerNum, movingNum);
            sourceLabel = "UI起卦";
          }
        }
        if (!data) {
          data = getMeihuaData(ctx.parsedTime);
        }
        engineContext += `\\n[梅花排盘]\\n本卦：${data.ben}\\n互卦：${data.hu}\\n变卦：${data.bian}\\n动爻：${data.movingLine}\\n体卦：${data.ti.name}(${data.ti.wuxing})\\n用卦：${data.yong.name}(${data.yong.wuxing})\\n来源：${sourceLabel}\\n`;
        engineData.meihua = data;
      } catch (e) {
        console.error("Meihua engine error", e);
      }
    }
    if (ctx.paradigm === "zodiac" || (ctx.angles && ctx.angles.includes("占星")) || (ctx.angles && ctx.angles.includes("星座"))) {
      try {
        const birthDate = ctx.payload.profile?.birthDate;
        const birthTime = ctx.payload.profile?.birthTime;
        let zodiacDate = ctx.parsedTime;
        let sourceLabel = "起局时间回退";
        if (birthDate) {
          const timePart = /^\\d{2}:\\d{2}$/.test(birthTime || "") ? birthTime : "00:00";
          const parsedBirth = new Date(`${birthDate}T${timePart}:00`);
          if (!Number.isNaN(parsedBirth.getTime())) {
            zodiacDate = parsedBirth;
            sourceLabel = "出生时间";
          }
        }
        const data = getZodiacData(zodiacDate);
        engineContext += `\\n[星盘排盘]\\n太阳星座：${data.sunSign}\\n月亮星座：${data.moonSign}\\n上升星座：${data.ascendant}\\n来源：${sourceLabel}\\n`;
        engineData.zodiac = data;
      } catch (e) {
        console.error("Zodiac engine error", e);
      }
    }
  }

  ctx.engineContext = engineContext;
  ctx.engineData = engineData;
}

// Node 3: Deep Reasoning (Reasoning Model)
async function performDeepReasoning(ctx: InferencePipelineContext, intentResult: string, signal: AbortSignal): Promise<string> {
  const isNaming = ctx.paradigm === "naming" || ctx.analysisMode === "naming";
  let prompt = `你是精通中国传统术数（${ctx.paradigm}）的命理专家。你的任务是对以下干支排盘和局象进行硬核逻辑推理。

# 排盘数据
历法上下文：${ctx.lunarContext || "无"}
计算输出：${ctx.engineContext || "无"}

# 起名关键信息
${isNaming ? formatNamingContext(ctx.namingContext) : "无"}

# 用户背景与意图
背景：${JSON.stringify(ctx.payload.profile || {})}
原问题：${ctx.normalizedQuestion}
焦点解析：${intentResult}

请提供硬核的推导过程（如五行生克制化、格局喜忌、或者奇门克应等）。不需要排版给普通用户看，这只是你的草稿推演逻辑。`;

  if (isNaming) {
    const timeNote = namingHasMissingTime(ctx.namingContext)
      ? "提示：存在出生时间缺失，请降低置信度并说明影响。"
      : "提示：出生时间信息齐全，可进行更精确的五行判断。";
    const lengthPref = ctx.namingContext?.preferences?.nameLengths?.length
      ? ctx.namingContext.preferences.nameLengths.map((n) => `${n}字名`).join(" / ")
      : "不限";
    const stylePref = ctx.namingContext?.preferences?.styles?.length
      ? ctx.namingContext.preferences.styles.join(" / ")
      : "不限";
    const mustChars = ctx.namingContext?.preferences?.mustIncludeChars || "无";
    const avoidChars = ctx.namingContext?.preferences?.avoidChars || "无";
    prompt += `\\n\\n# 起名专项要求\\n` +
      `1. 必须分析孩子八字五行强弱与需补足元素。\\n` +
      `2. 必须分析父母五行结构与互补关系，说明对取名的影响。\\n` +
      `3. 必须推荐姓氏（父姓或母姓）并给出逻辑理由。\\n` +
      `4. 强制避开生僻字、多音字、谐音不雅、读音拗口。\\n` +
      `5. 名字长度偏好：${lengthPref}；风格偏好：${stylePref}；必用字：${mustChars}；禁用字：${avoidChars}。\\n` +
      `6. 若父母或孩子出生时间缺失，需降低置信度并说明影响。\\n` +
      `${timeNote}`;
  }

  if (ctx.attachments && ctx.attachments.length > 0) {
    const imagesInfo = ctx.attachments.map(a => `[${a.category}] ${a.name}: ${a.note || ''}`).join('; ');
    prompt += '\\n\\n# 附带视觉特征信息（用于辅助推理，如面相/手相）：\\n' + imagesInfo;
  }

  // Note: O1/O3 or Deepseek-R1 might fail with system prompts, adjusting via custom logic in llm-client later if needed
  const { data, fallbackError } = await callOpenRouter(OPENROUTER_API_KEY, REASONING_MODEL, [
    { type: "text", text: prompt }
  ], signal, `你是精通中国传统术数（${ctx.paradigm}）的高级推理大模型。`);

  if (data?.choices?.[0]?.message?.content) {
    const content = data.choices[0].message.content;
    const text = typeof content === 'string' ? content : content.map(t => t.text).join("");
    return text || fallbackError || "推理中未得出有效结论";
  }
  
  return fallbackError || "推理中未得出有效结论";
}

// Node 4: Formatting (Formatting Model) returns Response directly if streaming
export async function runInferencePipeline(
  ctx: InferencePipelineContext, 
  signal: AbortSignal, 
  isStream: boolean,
  onProgress?: (msg: string) => void
): Promise<{
    finalResult?: string;
    streamResponse?: Response;
    finalModel: string;
}> {
  
  if (!OPENROUTER_API_KEY) throw new Error("缺少 OPENROUTER_API_KEY 配置");

  // Step 1
  if (onProgress) onProgress("正在解析用户意图与问题焦点...");
  const intentResult = await extractIntent(ctx, signal);

  // Step 2
  assembleEngineData(ctx);

  // Step 3
  if (onProgress) onProgress("正在进行易理深度推演...");
  const reasoningDraft = await performDeepReasoning(ctx, intentResult, signal);

  // Step 4
  if (onProgress) onProgress("正在生成深度分析报告...");
  const isNaming = ctx.paradigm === "naming" || ctx.analysisMode === "naming";
  const lunarContext = buildLunarContext(ctx.currentTime);
  const imageContext = (ctx.attachments ?? []).map((item) => ({
    name: item.name || "image",
    note: item.note || "",
    category: item.category || "未分类",
  }));
  const citations = (ctx.citations ?? []).map((item) => ({
    title: item.title,
    chapter: item.chapter || "未注明",
    quote: item.quote,
    source: item.source,
  }));
  const baseProfile = isNaming
    ? {
        name: "孩子",
        gender: ctx.namingContext?.child?.gender || "男",
        birthDate: ctx.namingContext?.child?.birthDate || "",
        birthTime: ctx.namingContext?.child?.birthTime || "",
        birthLocation: ctx.namingContext?.child?.birthLocation || "",
      }
    : {
        name: ctx.payload.profile?.name || "未提供",
        gender: ctx.payload.profile?.gender || "男",
        birthDate: ctx.payload.profile?.birthDate || "",
        birthTime: ctx.payload.profile?.birthTime || "",
        birthLocation: ctx.payload.profile?.birthLocation || "",
        currentResidence: ctx.payload.profile?.currentResidence,
        pastResidences: ctx.payload.profile?.pastResidences,
        experienceNarrative: ctx.payload.profile?.experienceNarrative,
        currentStatus: ctx.payload.profile?.currentStatus,
        futureVision: ctx.payload.profile?.futureVision,
      };
  const eventContext = ctx.eventContext ?? {
    background: "基础推演",
    urgency: "一般",
    horizon: "30天内",
    mood: "平稳",
  };
  const spec = (ctx.spec ?? { label: ctx.paradigm, reasoningFrame: "默认推演框架", reference: "unknown" }) as Parameters<typeof buildPrompt>[0]["spec"];
  const foundationModules = (ctx.foundationModules ?? []) as Parameters<typeof buildPrompt>[0]["foundationModules"];
  const basePrompt = buildPrompt({
    paradigm: ctx.paradigm,
    analysisMode: ctx.analysisMode,
    forecastWindow: ctx.payload.forecastWindow ?? null,
    angles: ctx.angles,
    question: ctx.normalizedQuestion,
    currentTime: ctx.currentTime,
    location: ctx.location,
    namingContext: ctx.namingContext,
    profile: baseProfile,
    eventContext,
    lunarContext,
    spec,
    foundationModules,
    imageContext,
    citations,
    engineContext: ctx.engineContext,
  });
  const finalPrompt = `${basePrompt}\n\n补充参考（仅用于判断，不要复写原文）：\n【用户分析焦点】\n${intentResult}\n\n【深度推理草稿】\n${reasoningDraft}`;

  const messages: Array<{ role: string; content: unknown }> = [{ role: "user", content: finalPrompt }];
  if (ctx.attachments && ctx.attachments.length > 0) {
      const imagesInfo = ctx.attachments.map(a => `附件 [${a.category}] ${a.name}: ${a.note || ''}`).join('; ');
      messages[0].content += '\\n\\n附带图片信息：' + imagesInfo;
      ctx.attachments.forEach(item => {
          if (messages.length === 1 && typeof messages[0].content === "string") {
              messages[0].content = [{ type: "text", text: messages[0].content }];
          }
          if (Array.isArray(messages[0].content)) {
            messages[0].content.push({ type: "image_url", image_url: { url: item.dataUrl } });
          }
      });
  }

  const openRouterRequest = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://yishu.ai",
      "X-Title": "YiShu System",
    },
    body: JSON.stringify({
      model: FORMATTING_MODEL,
      messages: messages,
      temperature: 0.7,
      stream: isStream,
    }),
    signal,
  });

  if (!openRouterRequest.ok) {
    const errText = await openRouterRequest.text();
    throw new Error(`排版引擎响应失败: ${openRouterRequest.statusText} - ${errText}`);
  }

  if (isStream) {
    return { streamResponse: openRouterRequest, finalModel: FORMATTING_MODEL };
  } else {
    const data = await openRouterRequest.json();
    let text = "";
    if (data?.choices?.[0]?.message?.content) {
      const respContent = data.choices[0].message.content;
      if (typeof respContent === 'string') {
        text = respContent;
      } else if (Array.isArray(respContent)) {
        text = respContent.map((t: {text?: string}) => t.text || "").join("");
      }
    }
    return { finalResult: text, finalModel: data.model || FORMATTING_MODEL };
  }
}
