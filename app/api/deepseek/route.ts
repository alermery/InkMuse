import { NextResponse } from "next/server";

export const runtime = "edge";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekModel = "deepseek-v4-flash" | "deepseek-v4-pro";

const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 20;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-deepseek-api-key") ??
    "anonymous"
  );
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return null;
  }

  if (bucket.count >= maxRequestsPerWindow) {
    return Math.ceil((bucket.resetAt - now) / 1000);
  }

  bucket.count += 1;
  return null;
}

function normalizeModel(model?: string): DeepSeekModel {
  return model === "deepseek-v4-pro" ? "deepseek-v4-pro" : "deepseek-v4-flash";
}

function sse(payload: { content?: string; error?: string } | "[DONE]") {
  if (payload === "[DONE]") {
    return "data: [DONE]\n\n";
  }

  return `data: ${JSON.stringify(payload)}\n\n`;
}

function streamText(content: string, status = 200) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sse(status >= 400 ? { error: content } : { content })));
        controller.enqueue(encoder.encode(sse("[DONE]")));
        controller.close();
      },
    }),
    {
      status,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

function resolveApiKey(request: Request) {
  return request.headers.get("x-deepseek-api-key") ?? process.env.DEEPSEEK_API_KEY;
}

export async function POST(request: Request) {
  const retryAfter = checkRateLimit(getClientKey(request));

  if (retryAfter) {
    return streamText(`请求过于频繁，请 ${retryAfter} 秒后再试。`, 429);
  }

  try {
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };

    const messages = body.messages ?? [];

    if (!messages.length) {
      return NextResponse.json({ error: "messages 不能为空。" }, { status: 400 });
    }

    const apiKey = resolveApiKey(request);

    if (!apiKey) {
      return streamText("未检测到 DeepSeek API Key，请先在环境变量或 API Key 设置中配置。", 401);
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: normalizeModel(body.model),
        messages,
        temperature: body.temperature ?? 0.85,
        max_tokens: body.maxTokens ?? 2000,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      return streamText(text || `DeepSeek 请求失败：${response.status}`, response.status);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();

          if (!reader) {
            controller.enqueue(encoder.encode(sse({ error: "DeepSeek 未返回流式响应。" })));
            controller.enqueue(encoder.encode(sse("[DONE]")));
            controller.close();
            return;
          }

          let buffer = "";

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                break;
              }

              buffer += decoder.decode(value, { stream: true });
              const events = buffer.split("\n\n");
              buffer = events.pop() ?? "";

              for (const event of events) {
                const line = event.split("\n").find((item) => item.startsWith("data:"));

                if (!line) {
                  continue;
                }

                const data = line.slice(5).trim();
                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode(sse("[DONE]")));
                  controller.close();
                  return;
                }

                const parsed = JSON.parse(data) as {
                  choices?: { delta?: { content?: string } }[];
                  error?: { message?: string };
                };
                const token = parsed.choices?.[0]?.delta?.content ?? "";
                const message = parsed.error?.message;

                if (message) {
                  controller.enqueue(encoder.encode(sse({ error: message })));
                }
                if (token) {
                  controller.enqueue(encoder.encode(sse({ content: token })));
                }
              }
            }

            controller.enqueue(encoder.encode(sse("[DONE]")));
            controller.close();
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                sse({
                  error: error instanceof Error ? error.message : "DeepSeek 流式响应解析失败。",
                }),
              ),
            );
            controller.enqueue(encoder.encode(sse("[DONE]")));
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Accel-Buffering": "no",
        },
      },
    );
  } catch (error) {
    return streamText(
      error instanceof Error ? `DeepSeek 请求失败：${error.message}` : "DeepSeek 请求失败，请检查配置。",
      500,
    );
  }
}
