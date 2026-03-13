import { getBaziData, getQimenBasicInfo, getLiuyaoData, getMeihuaData, getZodiacData } from "@/lib/paradigm-engine";
import { InferencePayload } from "@/lib/inference/types";
import { callOpenRouter } from "@/lib/inference/llm-client";

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
};

// Node 1: Intent Extraction (Fast Model)
async function extractIntent(ctx: InferencePipelineContext, signal: AbortSignal): Promise<string> {
  const prompt = `分析以下用户的术数问题并提取焦点：
用户背景：${JSON.stringify(ctx.payload.profile || {})}
目标事件：${JSON.stringify(ctx.eventContext || {})}
问题：${ctx.normalizedQuestion}

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
        const data = getMeihuaData(ctx.parsedTime);
        engineContext += `\\n[梅花排盘]\\n本卦：${data.ben}\\n互卦：${data.hu}\\n变卦：${data.bian}\\n动爻：${data.movingLine}\\n体卦：${data.ti.name}(${data.ti.wuxing})\\n用卦：${data.yong.name}(${data.yong.wuxing})\\n`;
        engineData.meihua = data;
      } catch (e) {
        console.error("Meihua engine error", e);
      }
    }
    if (ctx.paradigm === "zodiac" || (ctx.angles && ctx.angles.includes("占星")) || (ctx.angles && ctx.angles.includes("星座"))) {
      try {
        const data = getZodiacData(ctx.parsedTime);
        engineContext += `\\n[星盘排盘]\\n太阳星座：${data.sunSign}\\n月亮星座：${data.moonSign}\\n上升星座：${data.ascendant}\\n`;
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
  let prompt = `你是精通中国传统术数（${ctx.paradigm}）的命理专家。你的任务是对以下干支排盘和局象进行硬核逻辑推理。

# 排盘数据
历法上下文：${ctx.lunarContext || "无"}
计算输出：${ctx.engineContext || "无"}

# 用户背景与意图
背景：${JSON.stringify(ctx.payload.profile || {})}
原问题：${ctx.normalizedQuestion}
焦点解析：${intentResult}

请提供硬核的推导过程（如五行生克制化、格局喜忌、或者奇门克应等）。不需要排版给普通用户看，这只是你的草稿推演逻辑。`;

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
  const promptCitations = ctx.citations?.length ? ctx.citations.map(c => `[${c.title}] ${c.quote}`).join("\\n") : "";
  const finalPrompt = `你是易枢（YiShu）系统的高级术数咨询师。基于以下前置推理草稿以及用户背景，请结构化且清晰地输出四段式分析报告。

# 用户分析焦点
${intentResult}

# 古典易理参考
${promptCitations}

# 深度推理结论（草稿记录，仅供参考转译，不要直接粘贴原始格式）
${reasoningDraft}

必须包含以下四个段落标题（精确匹配字眼），并在内部使用 markdown 排版增加可读性：
1. 【总览结论】：给出定性的一句话核心判定。
2. 【证据链】：提供推导依据（如用表格对比或分类列出，包含“证据项”和“置信度”字段）。
3. 【行动建议】：给出具体的“90天”、“1年”、“3-10年”层次化行动路径。
4. 【风险提示】：将风险归类至“财务”、“关系”、“健康”、“决策偏差”四个维度。

要求语言客观、专业、有神秘感但清晰落地。`;

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
