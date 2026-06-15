"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { LoadingShimmer } from "@/components/ai/loading-shimmer";
import { StreamingText } from "@/components/ai/streaming-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { streamLlm } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";

const fallbackResponse =
  "### AI 助手待命\n\n- 已支持 DeepSeek、OpenAI 和 OpenAI 兼容接入。\n- 你可以在这里输入一段剧情意图、角色冲突或世界观设定。";

export function AIPanel({
  title = "AI 助手",
  promptLabel = "写下你现在的创作目标",
}: {
  title?: string;
  promptLabel?: string;
}) {
  const provider = useNovelStore((state) => state.provider);
  const apiBaseUrl = useNovelStore((state) => state.apiBaseUrl);
  const apiKey = useNovelStore((state) => state.apiKey);
  const model = useNovelStore((state) => state.model);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState(fallbackResponse);
  const [isLoading, setIsLoading] = useState(false);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);

  async function handleGenerate() {
    setIsLoading(true);
    incrementAiCallCount();

    try {
      let output = "";
      await streamLlm({
        provider,
        apiBaseUrl,
        apiKey,
        model,
        system: "你是小说创作助手，帮助作者生成灵感、结构和文本。",
        user: prompt || "请为一个新小说项目生成开篇灵感。",
        onToken: (token) => {
          output += token;
          setResponse(output);
        },
      });
      setResponse(output || fallbackResponse);
    } catch {
      setResponse(fallbackResponse);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="glass-panel rounded-[28px] border p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-foreground/60">{promptLabel}</p>
      <Textarea
        className="mt-4 min-h-28 border-white/10 bg-black/10"
        placeholder="例如：我想写一个高压都市背景下，拥有时间回溯能力的底层律师。"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <Button className="mt-4 rounded-full bg-primary/85 hover:bg-primary hover:shadow-[0_0_24px_rgba(139,92,246,0.28)]" onClick={handleGenerate}>
        生成建议
      </Button>
      <div className="mt-5">{isLoading ? <LoadingShimmer /> : <StreamingText content={response} />}</div>
    </section>
  );
}
