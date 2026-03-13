import { inferenceLimit } from "@/lib/rate-limiter";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { resolveSession } from "@/lib/auth-store";
import { appendCase } from "@/lib/cases-store";
import { retrieveClassicalCitations } from "@/lib/classical-references";
import { InferencePayload } from "@/lib/inference/types";
import { getParadigmSpec, buildFoundationModules, buildLunarContext } from "@/lib/inference/prompt-builder";
import { validateMode, resolveAngles, validateAttachments } from "@/lib/inference/validator";
import { YishuCase } from "@/types/case";
import { runInferencePipeline, InferencePipelineContext } from "@/lib/inference/pipeline";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = inferenceLimit.check(ip, { windowMs: 60000, maxRequests: 10 });
  
  if (!allowed) {
    return new Response(JSON.stringify({ error: "请求频率过高，请稍后再试" }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("yishu_session")?.value;
  let user: { id: string; phone: string } | null = null;
  if (token) {
    user = await resolveSession(token);
  }

  try {
    const payload = (await request.json()) as InferencePayload;

    const paradigm = payload.paradigm || "bazi";
    const analysisMode = validateMode(payload.analysisMode);
    const angles = resolveAngles(paradigm, payload.angles);
    const attachments = validateAttachments(payload.attachments);

    const question = (payload.question ?? "").trim() || 
      (analysisMode === "natal" ? "请给出我的整体命盘画像与长期发展建议" : "请给出最近阶段的命盘推进建议");

    // Validate event context only for event mode
    const eventContext = {
      background: payload.eventContext?.background || "基础推演",
      urgency: payload.eventContext?.urgency || "一般",
      horizon: payload.eventContext?.horizon || "30天内",
      mood: payload.eventContext?.mood || "平稳",
    };

    const spec = getParadigmSpec(paradigm);
    if (!spec) {
      return new Response(JSON.stringify({ error: `不支持的范式：${paradigm}` }), { status: 400 });
    }

    const currentTime = payload.currentTime || new Date().toISOString();
    const lunarContext = buildLunarContext(currentTime);
    const foundationModules = buildFoundationModules(paradigm, angles);

    const promptCitations = await retrieveClassicalCitations({
      paradigm: paradigm === "composite" ? "bazi" : paradigm,
      question: question,
      limit: 2,
    });

    const contextData: InferencePipelineContext = {
      payload,
      parsedTime: new Date(currentTime),
      currentTime,
      location: payload.location || "",
      normalizedQuestion: question,
      analysisMode,
      paradigm,
      angles,
      eventContext,
      attachments,
      spec,
      foundationModules,
      citations: promptCitations.map(c => ({
        title: c.title,
        chapter: c.chapter,
        quote: c.quote,
        source: "classical-references"
      })),
      lunarContext: lunarContext ? `${lunarContext.solarDate} ${lunarContext.lunarDate} ${lunarContext.ganzhi}` : null
    };

    const abortController = new AbortController();

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";
        let finalModel = "openrouter/auto";

        const onProgress = (msg: string) => {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "status", content: msg })}\n\n`));
        };

        try {
          const pipelineResult = await runInferencePipeline(contextData, abortController.signal, true, onProgress);

          if (!pipelineResult.streamResponse || !pipelineResult.streamResponse.ok) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: "推演引擎响应失败" })}\n\n`));
            controller.close();
            return;
          }

          finalModel = pipelineResult.finalModel;
          const reader = pipelineResult.streamResponse.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          
          if (!reader) {
            controller.close();
            return;
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              if (buffer) {
                const lines = buffer.split("\n").filter(line => line.trim() !== "");
                for (const line of lines) {
                  if (line === "data: [DONE]") continue;
                  if (line.startsWith("data: ")) {
                    try {
                      const data = JSON.parse(line.slice(6));
                      if (data.choices?.[0]?.delta?.content) {
                        const text = data.choices[0].delta.content;
                        fullContent += text;
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: text })}\n\n`));
                      }
                    } catch {}
                  }
                }
              }
              break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || trimmedLine === "data: [DONE]") continue;
              if (trimmedLine.startsWith("data: ")) {
                try {
                  const data = JSON.parse(trimmedLine.slice(6));
                  if (data.choices?.[0]?.delta?.content) {
                    const text = data.choices[0].delta.content;
                    fullContent += text;
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: text })}\n\n`));
                  }
                } catch {}
              }
            }
          }
          
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: "", done: true })}\n\n`));

          if (user) {
            const caseItem: YishuCase = {
              id: "",
              userId: user.id,
              paradigm,
              paradigmLabel: spec.label,
              question,
              location: payload.location || "",
              currentTime,
              result: fullContent,
              model: finalModel,
              reference: "",
              citations: promptCitations.map(c => ({
                title: c.title,
                chapter: c.chapter,
                quote: c.quote,
                source: "classical-references"
              })),
              foundations: [],
              aiEnhancements: ["深度逻辑推理", "结构化提取"],
              createdAt: new Date().toISOString(),
            };
            
            try {
              await appendCase(caseItem);
            } catch {
              // Silently fail on case save
            }
          }

          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("无权使用")) return new Response(JSON.stringify({ error: error.message }), { status: 403 });
      if (error.message.includes("验证")) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
    console.error("[inference/stream] Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
