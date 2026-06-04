type Env = {
  ASSETS: Fetcher;
  DEEPSEEK_API_KEY?: string;
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekBalanceInfo = {
  currency?: string;
  total_balance?: string;
};

type DeepSeekBalanceResponse = {
  is_available?: boolean;
  balance_infos?: DeepSeekBalanceInfo[];
};

const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 20;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function sse(payload: { content?: string; error?: string } | "[DONE]") {
  return payload === "[DONE]" ? "data: [DONE]\n\n" : `data: ${JSON.stringify(payload)}\n\n`;
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

function getClientKey(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
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

function normalizeModel(model?: string) {
  return model === "deepseek-v4-pro" ? "deepseek-v4-pro" : "deepseek-v4-flash";
}

function formatBalanceDisplay(balanceInfos: DeepSeekBalanceInfo[] = []) {
  if (!balanceInfos.length) {
    return "0";
  }

  return balanceInfos
    .map((item) => `${item.total_balance ?? "0"} ${item.currency ?? "CNY"}`)
    .join(" / ");
}

async function handleDeepSeek(request: Request, env: Env) {
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
      return streamText("messages 不能为空。", 400);
    }

    const apiKey = request.headers.get("x-deepseek-api-key") ?? env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return streamText("未检测到 DeepSeek API Key，请先配置。", 401);
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
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const events = buffer.split("\n\n");
              buffer = events.pop() ?? "";

              for (const event of events) {
                const line = event.split("\n").find((item) => item.startsWith("data:"));
                if (!line) continue;

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

                if (message) controller.enqueue(encoder.encode(sse({ error: message })));
                if (token) controller.enqueue(encoder.encode(sse({ content: token })));
              }
            }

            controller.enqueue(encoder.encode(sse("[DONE]")));
            controller.close();
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                sse({ error: error instanceof Error ? error.message : "DeepSeek 流式响应解析失败。" }),
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
        },
      },
    );
  } catch (error) {
    return streamText(error instanceof Error ? error.message : "DeepSeek 请求失败。", 500);
  }
}

async function handleBalance(request: Request, env: Env) {
  const apiKey = request.headers.get("x-deepseek-api-key") ?? env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "未检测到 DeepSeek API Key。" }, { status: 401 });
  }

  try {
    const response = await fetch("https://api.deepseek.com/user/balance", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const text = await response.text();
    const payload = text
      ? (JSON.parse(text) as DeepSeekBalanceResponse & { error?: { message?: string } })
      : null;

    if (!response.ok) {
      const message = payload?.error?.message ?? `DeepSeek 余额查询失败：${response.status}`;
      return Response.json({ error: message }, { status: response.status });
    }

    const balanceInfos = payload?.balance_infos ?? [];

    return Response.json({
      isAvailable: payload?.is_available ?? false,
      balanceInfos,
      display: formatBalanceDisplay(balanceInfos),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `DeepSeek 余额查询失败：${error.message}`
            : "DeepSeek 余额查询失败。",
      },
      { status: 500 },
    );
  }
}

const worker = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/deepseek" && request.method === "POST") {
      return handleDeepSeek(request, env);
    }

    if (url.pathname === "/api/deepseek/balance" && request.method === "GET") {
      return handleBalance(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
