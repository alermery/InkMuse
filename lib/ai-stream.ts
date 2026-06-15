"use client";

import type { EncyclopediaEntry, LlmModel, LlmProvider, SavedEntry } from "@/types";
import { enrichUserPromptWithProjectMemory, loadProjectMemory } from "@/lib/project-memory";

type StreamRequest = {
  system: string;
  user: string;
  provider?: LlmProvider;
  apiBaseUrl?: string;
  apiKey?: string;
  model?: LlmModel;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retries?: number;
  useProjectMemory?: boolean;
  onToken: (token: string) => void;
  onQueueState?: (state: "排队中" | "生成中" | "重试中" | "完成") => void;
};

let lastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForDebounce() {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < 500) {
    await sleep(500 - elapsed);
  }
  lastRequestAt = Date.now();
}

async function runStream({
  system,
  user,
  provider,
  apiBaseUrl,
  apiKey,
  model,
  temperature,
  maxTokens,
  timeoutMs,
  useProjectMemory,
  onToken,
  onQueueState,
}: Omit<StreamRequest, "retries">) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs ?? 60_000);
  const projectMemory = useProjectMemory ? loadProjectMemory() : null;
  const finalUser = enrichUserPromptWithProjectMemory(user, projectMemory);

  try {
    onQueueState?.("生成中");
    const response = await fetch("/api/llm", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(apiKey ? { "x-llm-api-key": apiKey } : {}),
      },
      body: JSON.stringify({
        provider,
        apiBaseUrl,
        model,
        temperature,
        maxTokens,
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: finalUser },
        ],
      }),
    });

    if (!response.body) {
      throw new Error("当前环境不支持流式响应。");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let errorMessage = "";

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
        if (!line) continue;

        const data = line.slice(5).trim();
        if (data === "[DONE]") {
          if (!response.ok || errorMessage) {
            throw new Error(errorMessage || `请求失败：${response.status}`);
          }
          onQueueState?.("完成");
          return;
        }

        const parsed = JSON.parse(data) as { content?: string; error?: string };
        if (parsed.error) errorMessage += parsed.error;
        if (parsed.content) onToken(parsed.content);
      }
    }

    if (!response.ok || errorMessage) {
      throw new Error(errorMessage || `请求失败：${response.status}`);
    }
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function streamLlm(request: StreamRequest) {
  const retries = request.retries ?? 2;
  await waitForDebounce();
  request.onQueueState?.("排队中");

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await runStream(request);
      return;
    } catch (error) {
      if (attempt >= retries) throw error;
      request.onQueueState?.("重试中");
      await sleep(600 * 2 ** attempt);
    }
  }
}

export const streamDeepSeek = streamLlm;

export function stripMarkdown(value: string) {
  return value.replace(/```json|```/g, "").replace(/^#+\s*/gm, "").trim();
}

export function parseJsonArray<T>(value: string): T[] {
  const cleaned = stripMarkdown(value);
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start === -1 || end === -1 || end <= start) {
    return [];
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T[];
  } catch {
    return [];
  }
}

export function savedEntryFromText(
  source: SavedEntry["source"],
  title: string,
  content: string,
  tags: string[],
): Omit<SavedEntry, "id" | "createdAt"> {
  return { source, title, content, tags };
}

export function settingEntryFromText(
  category: EncyclopediaEntry["category"],
  title: string,
  content: string,
  tags: string[],
): Omit<EncyclopediaEntry, "id" | "createdAt"> {
  return { category, title, content, tags, relatedChapterIds: [] };
}
