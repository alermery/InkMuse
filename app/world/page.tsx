"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Wand2 } from "lucide-react";
import { ModuleFormShell } from "@/components/features/module-form-shell";
import { OptionChips } from "@/components/features/option-chips";
import { SavedImportPanel } from "@/components/features/saved-import-panel";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { savedEntryFromText, settingEntryFromText, streamDeepSeek } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";
import { usePersistedState } from "@/lib/use-persisted-state";

const categories = ["地理环境", "势力阵营", "力量体系", "历史年表", "社会规则"];
const actions = ["自动补全关联设定", "一致性检查", "假如推演"];

export default function WorldPage() {
  const apiKey = useNovelStore((state) => state.apiKey);
  const saveEntry = useNovelStore((state) => state.saveEntry);
  const saveSetting = useNovelStore((state) => state.saveSetting);
  const addToast = useNovelStore((state) => state.addToast);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);
  const [category, setCategory] = usePersistedState("inkmuse:world:category", ["力量体系"]);
  const [action, setAction] = usePersistedState("inkmuse:world:action", ["自动补全关联设定"]);
  const [setting, setSetting] = usePersistedState("inkmuse:world:setting", "");
  const [output, setOutput] = usePersistedState("inkmuse:world:output", "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateWorld() {
    setOutput("");
    setError(null);
    setIsLoading(true);
    incrementAiCallCount();

    try {
      let next = "";
      await streamDeepSeek({
        apiKey,
        system: "你是世界观设计师。请围绕规则、势力、地理、历史与代价系统构建自洽设定，并明确潜在矛盾与后续剧情用途。",
        user: `分类：${category[0]}\n任务：${action[0]}\n基础设定：${setting}`,
        onToken: (token) => {
          next += token;
          setOutput(next);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "世界观生成失败");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ModuleFormShell
      title="世界观构建"
      description="按地理、势力、力量、历史和社会规则构建设定，并用 AI 做一致性检查与假如推演。"
      left={
        <section className="glass-panel rounded-lg border p-4">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">分类模板</p>
              <OptionChips options={categories} value={category} onChange={setCategory} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">AI 辅助功能</p>
              <OptionChips options={actions} value={action} onChange={setAction} />
            </div>
            <Textarea value={setting} onChange={(event) => setSetting(event.target.value)} className="min-h-40 border-white/10 bg-black/10" />
            <Button className="w-full" onClick={generateWorld} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              执行
            </Button>
            <SavedImportPanel
              onImport={(entry) => {
                setSetting(entry.content);
                setOutput(entry.content);
                addToast({ title: "已导入世界观收藏，可继续推演", type: "success" });
              }}
            />
          </div>
        </section>
      }
      right={
        <div className="space-y-5">
          <section className="glass-panel rounded-lg border p-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>暂无世界观条目。输入基础设定后可生成并保存到设定集。</span>
            </div>
          </section>
          <StreamResultPanel
            title="世界观输出"
            content={output}
            isLoading={isLoading}
            error={error}
            onSave={
              output
                ? () => {
                    saveEntry(savedEntryFromText("世界观", `${category[0]}：${action[0]}`, output, [category[0], action[0]]));
                    saveSetting(settingEntryFromText("世界观", `${category[0]}设定`, output, [category[0], action[0]]));
                  }
                : undefined
            }
            onCopy={output ? () => navigator.clipboard.writeText(output) : undefined}
          />
        </div>
      }
    />
  );
}
