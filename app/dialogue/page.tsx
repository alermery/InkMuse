"use client";

import { useState } from "react";
import { Loader2, MessagesSquare, Plus } from "lucide-react";
import { ModuleFormShell } from "@/components/features/module-form-shell";
import { OptionChips } from "@/components/features/option-chips";
import { SavedImportPanel } from "@/components/features/saved-import-panel";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { savedEntryFromText, streamDeepSeek } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";
import { usePersistedState } from "@/lib/use-persisted-state";

const emotions = ["紧张", "温馨", "搞笑", "对峙"];
const purposes = ["推动剧情", "展示性格", "制造冲突", "表白"];

export default function DialoguePage() {
  const apiKey = useNovelStore((state) => state.apiKey);
  const saveEntry = useNovelStore((state) => state.saveEntry);
  const appendToDraft = useNovelStore((state) => state.appendToDraft);
  const addToast = useNovelStore((state) => state.addToast);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);
  const [characters, setCharacters] = usePersistedState<string[]>("inkmuse:dialogue:characters", []);
  const [scene, setScene] = usePersistedState("inkmuse:dialogue:scene", "");
  const [emotion, setEmotion] = usePersistedState("inkmuse:dialogue:emotion", ["对峙"]);
  const [purpose, setPurpose] = usePersistedState("inkmuse:dialogue:purpose", ["制造冲突"]);
  const [output, setOutput] = usePersistedState("inkmuse:dialogue:output", "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateDialogue() {
    setOutput("");
    setError(null);
    setIsLoading(true);
    incrementAiCallCount();

    try {
      let next = "";
      await streamDeepSeek({
        apiKey,
        system: "你是对白润色专家。请生成符合角色性格的剧本格式对白，包含动作描写和表情描写，用括号标注，但不要堆砌说明。",
        user: `参与角色：${characters.join("、")}\n场景：${scene}\n情绪：${emotion[0]}\n目的：${purpose[0]}\n请输出剧本格式对白。`,
        temperature: 0.9,
        onToken: (token) => {
          next += token;
          setOutput(next);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "对话生成失败");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ModuleFormShell
      title="对话生成"
      description="选择角色、场景、情绪和对话目的，生成带动作与表情标注的剧本格式对白。"
      left={
        <section className="glass-panel rounded-lg border p-4">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">参与角色</p>
              <OptionChips options={["角色A", "角色B", "角色C"]} value={characters} onChange={setCharacters} multi />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">场景描述</p>
              <Textarea value={scene} onChange={(event) => setScene(event.target.value)} className="min-h-28 border-white/10 bg-black/10" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">对话情绪</p>
              <OptionChips options={emotions} value={emotion} onChange={setEmotion} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">对话目的</p>
              <OptionChips options={purposes} value={purpose} onChange={setPurpose} />
            </div>
            <Button className="w-full" onClick={generateDialogue} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessagesSquare className="h-4 w-4" />}
              生成对白
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => output && appendToDraft(output)} disabled={!output}>
              <Plus className="h-4 w-4" />
              插入当前章节
            </Button>
            <SavedImportPanel
              sourceFilter={["对话", "瀵硅瘽"]}
              onImport={(entry) => {
                setScene(entry.content);
                setOutput(entry.content);
                addToast({ title: "已导入对话收藏，可继续调整", type: "success" });
              }}
            />
          </div>
        </section>
      }
      right={
        <StreamResultPanel
          title="剧本格式对白"
          content={output}
          isLoading={isLoading}
          error={error}
          onSave={output ? () => saveEntry(savedEntryFromText("对话", "生成对白", output, [...characters, emotion[0], purpose[0]])) : undefined}
          onCopy={output ? () => navigator.clipboard.writeText(output) : undefined}
        />
      }
    />
  );
}
