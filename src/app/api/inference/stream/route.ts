import { inferenceLimit } from "@/lib/rate-limiter";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { resolveSession } from "@/lib/auth-store";
import { appendCase } from "@/lib/cases-store";
import { getBaziData, getQimenBasicInfo, getLiuyaoData } from "@/lib/paradigm-engine";
import { InferencePayload } from "@/lib/inference/types";
import { getParadigmSpec, buildPrompt, buildFoundationModules, buildLunarContext } from "@/lib/inference/prompt-builder";
import { validateMode, validateProfile, validateForecastWindow, resolveAngles, validateAttachments, validateEventContext } from "@/lib/inference/validator";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

export const runtime = "edge";

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
  let user = null;
  if (token) {
    user = await resolveSession(token);
  }

  try {
    const payload = (await request.json()) as InferencePayload;

    validateMode(payload.mode);
    if (!user) validateProfile(payload.profile);
    const forecastWindow = validateForecastWindow(payload.forecastWindow);
    const angles = resolveAngles(payload.angles);
    validateAttachments(payload.attachments);
    validateEventContext(payload.eventContext);

    const paradigmSpec = getParadigmSpec(payload.mode);
    const lunarContext = buildLunarContext();

    const foundationModules = buildFoundationModules(
      payload.mode,
      payload.profile,
      {
        getBaziData,
        getQimenBasicInfo,
        getLiuyaoData,
      }
    );

    const systemPrompt = buildPrompt({
      paradigmSpec,
      profile: payload.profile,
      eventContext: payload.eventContext,
      lunarContext,
      foundationModules,
      forecastWindow,
      angles,
    });

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: "请根据上述信息开始推演。" }
    ];

    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenRouter API Key not configured" }), { status: 500 });
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
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!openRouterRequest.ok) {
      const errText = await openRouterRequest.text();
      return new Response(JSON.stringify({ error: `推演引擎响应失败: ${openRouterRequest.statusText}`, details: errText }), { status: 500 });
    }
    
    // Transform OpenRouter stream to SSE standard
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openRouterRequest.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(line => line.trim() !== "");
            
            for (const line of lines) {
              if (line === "data: [DONE]") continue;
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.choices[0].delta.content) {
                    const text = data.choices[0].delta.content;
                    fullContent += text;
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: text })}\n\n`));
                  }
                } catch (e) {
                  // parse error on half chunk
                }
              }
            }
          }
          
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: "", done: true })}\n\n`));

          if (token) {
            const modeLabel = payload.mode === "bazi" ? "八字命理" : payload.mode === "qimen" ? "奇门遁甲" : "六爻占卜";
            const caseData: Partial<import("@/types/case").YishuCase> = {
              paradigm: payload.mode,
              paradigmLabel: modeLabel,
              question: payload.eventContext?.description || "",
              location: payload.profile?.birthPlace || "Default Location",
              currentTime: Date.now().toString(),
              result: fullContent,
              model: OPENROUTER_MODEL,
              reference: "",
              citations: []
            };
            
            // Cannot await here easily on the edge unless we use waitUntil or background worker
            // Appendcase runs in edge if no heavy node modules.
            await appendCase(token, caseData as any);
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
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
