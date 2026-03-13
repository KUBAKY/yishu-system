import { OpenRouterResponse, OpenRouterChoice } from "./types";

export function hasInstitutionalStructure(text: string): boolean {
  const requiredHeadings = ["【总览结论】", "【证据链】", "【行动建议】", "【风险提示】"];
  const hasHeadings = requiredHeadings.every((item) => text.includes(item));
  const hasTable = /\|?\s*证据项\s*\|/.test(text) && /\|?\s*置信度/.test(text);
  const hasActionLayers = text.includes("90天") && text.includes("1年") && text.includes("3-10年");
  const hasRiskGroups = text.includes("财务") && text.includes("关系") && text.includes("健康") && text.includes("决策偏差");
  return hasHeadings && hasTable && hasActionLayers && hasRiskGroups;
}

export type OpenRouterMessageContent =
  | string
  | Array<{ type?: string; text?: string; image_url?: { url: string } }>
  | undefined;

export function normalizeResponseContent(content: OpenRouterMessageContent): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

export async function callOpenRouter(
  key: string,
  model: string,
  userMessageContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>,
  signal: AbortSignal,
  systemPrompt?: string
): Promise<{ data?: OpenRouterResponse; fallbackError?: string; response?: Response; text?: string }> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 3200,
        messages: [
          {
            role: "system",
            content: systemPrompt || "你是易枢术数分析助手。你的职责是给出可解释的结构化判断，强调行动建议与风险边界。",
          },
          { role: "user", content: userMessageContent },
        ],
      }),
      signal,
    });
    
    let data: OpenRouterResponse = {};
    let fallbackError = "";
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        data = (await response.json()) as OpenRouterResponse;
      } catch {
        fallbackError = "模型返回JSON解析失败";
      }
    } else {
      try {
        const text = await response.text();
        fallbackError = text.slice(0, 160) || "模型返回非JSON响应";
      } catch {
        fallbackError = "模型响应读取失败";
      }
    }
    
    return { data, fallbackError, response };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("[llm-client] Request aborted (timeout or user cancellation)");
      return { fallbackError: "模型请求超时，请重试" };
    }
    console.error("[llm-client] Network/Fetch error:", error);
    return { fallbackError: `模型服务不可达: ${error instanceof Error ? error.message : "网络错误"}` };
  }
}
