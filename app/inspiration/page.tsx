"use client";

import { useMemo, useState } from "react";
import {
  Clipboard,
  Loader2,
  RefreshCw,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Input } from "@/components/ui/input";
import { OptionChips } from "@/components/features/option-chips";
import { ModuleFormShell } from "@/components/features/module-form-shell";
import { SavedImportPanel } from "@/components/features/saved-import-panel";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { parseJsonArray, savedEntryFromText, streamDeepSeek } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";
import { usePersistedState } from "@/lib/use-persisted-state";

type GeneratedIdea = {
  title: string;
  description: string;
  expansion_hooks: string[];
};

const genres = ["玄幻", "仙侠", "都市", "言情", "科幻", "悬疑", "历史", "末世", "游戏", "二次元"];
const directions = ["开篇设定", "情节转折", "人物冲突", "金手指设计", "高潮桥段", "虐心名场面", "爽点设计"];
const tones = ["热血", "温馨", "致郁", "搞笑", "暗黑", "轻松"];
const borderThemes = [
  "from-fuchsia-400 via-cyan-300 to-emerald-300",
  "from-amber-300 via-rose-300 to-sky-300",
  "from-lime-300 via-teal-300 to-blue-300",
  "from-red-300 via-orange-300 to-violet-300",
  "from-indigo-300 via-purple-300 to-pink-300",
];

export default function InspirationPage() {
  const apiKey = useNovelStore((state) => state.apiKey);
  const model = useNovelStore((state) => state.model);
  const saveEntry = useNovelStore((state) => state.saveEntry);
  const savedEntries = useNovelStore((state) => state.savedEntries);
  const removeSavedEntry = useNovelStore((state) => state.removeSavedEntry);
  const addToast = useNovelStore((state) => state.addToast);
  const addTokenUsage = useNovelStore((state) => state.addTokenUsage);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);
  const [selectedGenres, setSelectedGenres] = usePersistedState("inkmuse:inspiration:genres", ["悬疑"]);
  const [selectedDirection, setSelectedDirection] = usePersistedState("inkmuse:inspiration:direction", ["人物冲突"]);
  const [selectedTone, setSelectedTone] = usePersistedState("inkmuse:inspiration:tone", ["暗黑"]);
  const [count, setCount] = usePersistedState("inkmuse:inspiration:count", 3);
  const [raw, setRaw] = usePersistedState("inkmuse:inspiration:raw", "");
  const [ideas, setIdeas] = usePersistedState<GeneratedIdea[]>("inkmuse:inspiration:ideas", []);
  const [expanded, setExpanded] = usePersistedState("inkmuse:inspiration:expanded", "");
  const [isLoading, setIsLoading] = useState(false);
  const [expandingTitle, setExpandingTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [queueState, setQueueState] = useState("");
  const favoriteIds = useMemo(() => {
    const map = new Map<string, string>();
    savedEntries
      .filter((entry) => entry.source === "灵感坊")
      .forEach((entry) => map.set(entry.title, entry.id));
    return map;
  }, [savedEntries]);

  const system = useMemo(
    () =>
      "你是一位资深网文编辑和创意大师，精通各类网络小说的创作技巧。请根据用户指定的类型和方向，生成富有创意和吸引力的小说灵感。灵感要新颖独特，避免老套设定；要有明确故事张力和冲突点；适合扩展成长篇小说；语言生动，画面感强。必须只返回 JSON 数组，每个元素包含 title, description, expansion_hooks。",
    [],
  );

  async function generateIdeas() {
    setRaw("");
    setIdeas([]);
    setExpanded("");
    setError(null);
    setIsLoading(true);
    incrementAiCallCount();

    try {
      let output = "";
      await streamDeepSeek({
        apiKey,
        model,
        system,
        temperature: 1.2,
        maxTokens: 2000,
        user: `类型：${selectedGenres.join("、")}。方向：${selectedDirection[0]}。情感基调：${selectedTone[0]}。生成数量：${count}。每条 description 约 200 字，expansion_hooks 给 3 条。`,
        onQueueState: setQueueState,
        onToken: (token) => {
          output += token;
          addTokenUsage(Math.ceil(token.length / 2));
          setRaw(output);
          const parsed = parseJsonArray<GeneratedIdea>(output);
          if (parsed.length) {
            setIdeas(parsed);
          }
        },
      });
      const parsed = parseJsonArray<GeneratedIdea>(output);
      setIdeas(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function expandIdea(idea: GeneratedIdea) {
    setExpanded("");
    setError(null);
    setExpandingTitle(idea.title);
    incrementAiCallCount();

    try {
      let output = "";
      await streamDeepSeek({
        apiKey,
        model,
        system: "你是资深网文编辑，请把给定灵感扩展为可执行的长篇小说方案。",
        temperature: 1.0,
        maxTokens: 2000,
        user: `请扩展这个灵感：${idea.title}\n${idea.description}\n扩展方向：${idea.expansion_hooks.join("；")}。请输出核心卖点、主要冲突、前三章钩子和长篇展开路线。`,
        onQueueState: setQueueState,
        onToken: (token) => {
          output += token;
          addTokenUsage(Math.ceil(token.length / 2));
          setExpanded(output);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "扩展失败");
    } finally {
      setExpandingTitle("");
    }
  }

  function saveIdea(idea: GeneratedIdea) {
    saveEntry(
      savedEntryFromText(
        "灵感坊",
        idea.title,
        `${idea.description}\n\n扩展方向：${idea.expansion_hooks.join("；")}`,
        [...selectedGenres, selectedDirection[0], selectedTone[0]],
      ),
    );
    addToast({ title: "灵感已保存", type: "success" });
  }

  function toggleFavorite(idea: GeneratedIdea) {
    const existingId = favoriteIds.get(idea.title);

    if (existingId) {
      removeSavedEntry(existingId);
      addToast({ title: "已取消收藏", type: "info" });
      return;
    }

    saveIdea(idea);
  }

  return (
    <ModuleFormShell
      title="灵感坊"
      description="按类型、方向和情感基调生成灵感卡片，支持收藏、扩展、复制和保存到工作台。"
      left={
        <section className="glass-panel rounded-lg border p-4">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">小说类型</p>
              <OptionChips options={genres} value={selectedGenres} onChange={setSelectedGenres} multi />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">灵感方向</p>
              <OptionChips options={directions} value={selectedDirection} onChange={setSelectedDirection} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">情感基调</p>
              <OptionChips options={tones} value={selectedTone} onChange={setSelectedTone} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">生成数量</p>
              <Input
                type="number"
                min={1}
                max={5}
                value={count}
                onChange={(event) => setCount(Math.min(5, Math.max(1, Number(event.target.value))))}
                className="border-white/10 bg-black/10"
              />
            </div>
            <Button className="w-full" onClick={generateIdeas} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              生成灵感
            </Button>
            <SavedImportPanel
              sourceFilter={["灵感坊", "鐏垫劅鍧?", "工作台", "宸ヤ綔鍙?", "本地导入"]}
              onImport={(entry) => {
                setExpanded(entry.content);
                addToast({ title: "已导入收藏，可在扩展区继续修改", type: "success" });
              }}
            />
          </div>
        </section>
      }
      right={
        <div className="space-y-5">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="columns-1 gap-4 md:columns-2 2xl:columns-3">
            {ideas.map((idea, index) => (
              <article
                key={`${idea.title}-${index}`}
                className={`mb-4 break-inside-avoid rounded-lg bg-gradient-to-br ${borderThemes[index % borderThemes.length]} p-px`}
              >
                <div className="rounded-lg border border-white/10 bg-card/88 p-4 text-card-foreground shadow-sm backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold leading-6">{idea.title}</h2>
                    <Badge variant="secondary" className="rounded-full">
                      {selectedDirection[0]}
                    </Badge>
                  </div>
                  <p className="serif-body mt-3 text-sm leading-7 text-foreground/78">
                    {idea.description}
                  </p>
                  <div className="mt-4 space-y-2">
                    {idea.expansion_hooks?.map((hook) => (
                      <p key={hook} className="rounded-md bg-white/7 px-3 py-2 text-xs text-foreground/65">
                        {hook}
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <TooltipButton
                      tooltip={favoriteIds.has(idea.title) ? "取消收藏" : "收藏灵感"}
                      size="icon-sm"
                      variant={favoriteIds.has(idea.title) ? "default" : "ghost"}
                      onClick={() => toggleFavorite(idea)}
                    >
                      <Star className="h-4 w-4" />
                    </TooltipButton>
                    <TooltipButton tooltip="扩展灵感" size="icon-sm" variant="ghost" onClick={() => expandIdea(idea)}>
                      {expandingTitle === idea.title ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </TooltipButton>
                    <TooltipButton tooltip="复制描述" size="icon-sm" variant="ghost" onClick={() => navigator.clipboard.writeText(idea.description)}>
                      <Clipboard className="h-4 w-4" />
                    </TooltipButton>
                    <TooltipButton tooltip="保存到收藏" size="icon-sm" variant="ghost" onClick={() => saveIdea(idea)}>
                      <Save className="h-4 w-4" />
                    </TooltipButton>
                    <TooltipButton
                      tooltip="删除卡片"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setIdeas((value) => value.filter((item) => item.title !== idea.title))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </TooltipButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!ideas.length ? (
            <StreamResultPanel
              title="流式 JSON 输出"
              content={raw}
              isLoading={isLoading}
              error={error}
              queueState={queueState}
            />
          ) : null}
          <StreamResultPanel
            title="灵感扩展"
            content={expanded}
            isLoading={Boolean(expandingTitle)}
            error={null}
            queueState={queueState}
            onSave={
              expanded
                ? () =>
                    {
                      saveEntry(
                      savedEntryFromText("灵感坊", "灵感扩展", expanded, [
                        selectedDirection[0],
                      ]),
                    );
                      addToast({ title: "扩展内容已保存", type: "success" });
                    }
                : undefined
            }
          />
        </div>
      }
    />
  );
}
