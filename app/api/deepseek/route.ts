import { NextResponse } from "next/server";
import { deepseekClient } from "@/lib/deepseek";

export const runtime = "nodejs";

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
      stream?: boolean;
    };

    const messages = body.messages ?? [];

    if (!messages.length) {
      return NextResponse.json({ error: "messages 不能为空。" }, { status: 400 });
    }

    const headerApiKey = request.headers.get("x-deepseek-api-key") ?? undefined;
    const client = deepseekClient(headerApiKey);

    if (!client) {
      return streamText(
        "未检测到 DEEPSEEK_API_KEY。请在环境变量或 API Key 设置中配置后再生成。",
        401,
      );
    }

    const completion = await client.chat.completions.create({
      model: normalizeModel(body.model),
      messages,
      temperature: body.temperature ?? 0.85,
      max_tokens: body.maxTokens ?? 2000,
      stream: true,
    });

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const token = chunk.choices[0]?.delta?.content ?? "";
              if (token) {
                controller.enqueue(encoder.encode(sse({ content: token })));
              }
            }
            controller.enqueue(encoder.encode(sse("[DONE]")));
            controller.close();
          } catch (error) {
            controller.error(error);
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
      error instanceof Error
        ? `DeepSeek 请求失败：${error.message}`
        : "DeepSeek 请求失败，请检查配置。",
      500,
    );
  }
}
