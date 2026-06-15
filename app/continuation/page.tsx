"use client";

import { useState } from "react";
import { EyeOff, Loader2, Plus, Wand2 } from "lucide-react";
import { NovelEditor } from "@/components/editor/novel-editor";
import { ModuleFormShell } from "@/components/features/module-form-shell";
import { OptionChips } from "@/components/features/option-chips";
import { SavedImportPanel } from "@/components/features/saved-import-panel";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { savedEntryFromText, streamDeepSeek } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";
import { usePersistedState } from "@/lib/use-persisted-state";

const modes = ["续写模式", "润色模式", "改写模式", "扩写模式", "缩写模式", "情感注入"];
const lengths = ["200字", "500字", "1000字"];

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim();
}

export default function ContinuationPage() {
  const provider = useNovelStore((state) => state.provider);
  const apiBaseUrl = useNovelStore((state) => state.apiBaseUrl);
  const apiKey = useNovelStore((state) => state.apiKey);
  const model = useNovelStore((state) => state.model);
  const chapterDraft = useNovelStore((state) => state.chapterDraft);
  const appendToDraft = useNovelStore((state) => state.appendToDraft);
  const saveEntry = useNovelStore((state) => state.saveEntry);
  const addToast = useNovelStore((state) => state.addToast);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);
  const [mode, setMode] = usePersistedState("inkmuse:continuation:mode", ["续写模式"]);
  const [length, setLength] = usePersistedState("inkmuse:continuation:length", ["500字"]);
  const [customLength, setCustomLength] = usePersistedState("inkmuse:continuation:customLength", "");
  const [temperature, setTemperature] = usePersistedState("inkmuse:continuation:temperature", 0.85);
  const [styleRef, setStyleRef] = usePersistedState("inkmuse:continuation:styleRef", "");
  const [banWords, setBanWords] = usePersistedState("inkmuse:continuation:banWords", "命运的齿轮  他不知道的事");
  const [focusMode, setFocusMode] = useState(false);
  const [output, setOutput] = usePersistedState("inkmuse:continuation:output", "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const normalizedCustomLength = customLength.trim().replace(/[^\d]/g, "");
  const effectiveLength = normalizedCustomLength ? `${normalizedCustomLength}字` : length[0];

  async function generateContinuation() {
    setOutput("");
    setError(null);
    setIsLoading(true);
    incrementAiCallCount();

    try {
      let next = "";
      await streamDeepSeek({
        provider,
        apiBaseUrl,
        apiKey,
        model,
        useProjectMemory: true,
        temperature,
        system:
          "你是小说续写助手。请保持既有文风、人称、剧情逻辑与角色说话方式，推进情节但不偷换设定。支持续写、润色、改写、扩写、缩写和情感注入。",
        user: `模式：${mode[0]}\n目标长度：${effectiveLength}，请严格控制在目标字数上下 10% 以内。创造度：${temperature}\n禁止出现：${banWords}\n风格参考：${styleRef || "无"}\n\n前文：${plainText(chapterDraft).slice(-3000)}`,
        onToken: (token) => {
          next += token;
          setOutput(next);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "续写失败");
    } finally {
      setIsLoading(false);
    }
  }

  const editor = (
    <section className="glass-panel rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">章节编辑器</h2>
        <p className="text-xs text-foreground/50">{plainText(chapterDraft).length} 字</p>
      </div>
      <NovelEditor />
    </section>
  );

  if (focusMode) {
    return (
      <div className="min-h-screen bg-background p-5">
        <Button className="mb-4" variant="secondary" onClick={() => setFocusMode(false)}>
          退出专注
        </Button>
        {editor}
      </div>
    );
  }

  return (
    <ModuleFormShell
      title="智能续写"
      description="基于 TipTap 编辑器和当前上下文进行续写、润色、改写、扩写、缩写和情感增强。"
      left={
        <section className="glass-panel rounded-lg border p-4">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">AI 模式</p>
              <OptionChips options={modes} value={mode} onChange={setMode} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">续写长度</p>
              <OptionChips options={lengths} value={length} onChange={setLength} />
              <div className="mt-3">
                <p className="mb-2 text-xs text-muted-foreground">自定义字数（填写后优先生效）</p>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="例如：500"
                  value={customLength}
                  onChange={(event) => setCustomLength(event.target.value.replace(/[^\d]/g, ""))}
                  className="border-white/10 bg-black/10"
                />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">创造度 {temperature.toFixed(1)}</p>
              <Input
                type="range"
                min={0.1}
                max={1.5}
                step={0.1}
                value={temperature}
                onChange={(event) => setTemperature(Number(event.target.value))}
              />
            </div>
            <Textarea
              value={styleRef}
              onChange={(event) => setStyleRef(event.target.value)}
              placeholder="风格参考文本"
              className="min-h-24 border-white/10 bg-black/10"
            />
            <Textarea
              value={banWords}
              onChange={(event) => setBanWords(event.target.value)}
              placeholder="禁止出现词汇"
              className="min-h-20 border-white/10 bg-black/10"
            />
            <Button className="w-full" onClick={generateContinuation} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              执行
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => setFocusMode(true)}>
              <EyeOff className="h-4 w-4" />
              专注模式
            </Button>
            <SavedImportPanel
              onImport={(entry) => {
                setStyleRef(entry.content);
                setOutput(entry.content);
                addToast({ title: "已导入收藏，可继续修改", type: "success" });
              }}
            />
          </div>
        </section>
      }
      right={
        <div className="space-y-5">
          {editor}
          <StreamResultPanel
            title="AI 续写结果"
            content={output}
            isLoading={isLoading}
            error={error}
            targetWords={effectiveLength}
            onSave={output ? () => saveEntry(savedEntryFromText("续写", mode[0], output, [mode[0], effectiveLength])) : undefined}
            onCopy={output ? () => navigator.clipboard.writeText(output) : undefined}
          />
          <Button variant="secondary" disabled={!output} onClick={() => appendToDraft(output)}>
            <Plus className="h-4 w-4" />
            插入编辑器
          </Button>
        </div>
      }
    />
  );
}
