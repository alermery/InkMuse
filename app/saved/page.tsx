"use client";

import { useMemo, useState } from "react";
import { BookMarked, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { streamDeepSeek } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";

function parseTags(value: string) {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function groupBySource(entries: ReturnType<typeof useNovelStore.getState>["savedEntries"]) {
  return entries.reduce<Record<string, typeof entries>>((groups, entry) => {
    groups[entry.source] ??= [];
    groups[entry.source].push(entry);
    return groups;
  }, {});
}

export default function SavedPage() {
  const apiKey = useNovelStore((state) => state.apiKey);
  const model = useNovelStore((state) => state.model);
  const savedEntries = useNovelStore((state) => state.savedEntries);
  const updateSavedEntry = useNovelStore((state) => state.updateSavedEntry);
  const removeSavedEntry = useNovelStore((state) => state.removeSavedEntry);
  const addToast = useNovelStore((state) => state.addToast);
  const addTokenUsage = useNovelStore((state) => state.addTokenUsage);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [review, setReview] = useState("");
  const [queueState, setQueueState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const groupedEntries = useMemo(() => groupBySource(savedEntries), [savedEntries]);
  const sourceNames = useMemo(() => Object.keys(groupedEntries), [groupedEntries]);

  const selectedEntry = useMemo(
    () => savedEntries.find((entry) => entry.id === selectedId) ?? savedEntries[0],
    [savedEntries, selectedId],
  );
  const activeTitle = title || selectedEntry?.title || "";
  const activeContent = content || selectedEntry?.content || "";
  const activeTags = tags || selectedEntry?.tags.join("，") || "";

  function saveChanges() {
    if (!selectedEntry) {
      return;
    }

    updateSavedEntry(selectedEntry.id, {
      title: activeTitle.trim() || "未命名收藏",
      content: activeContent,
      tags: parseTags(activeTags),
    });
    addToast({ title: "收藏已更新", type: "success" });
  }

  async function reviewCurrent() {
    if (!activeContent.trim()) {
      addToast({ title: "请先填写收藏内容", type: "info" });
      return;
    }

    setReview("");
    setError(null);
    setIsReviewing(true);
    incrementAiCallCount();

    try {
      let next = "";
      await streamDeepSeek({
        apiKey,
        model,
        temperature: 0.7,
        maxTokens: 2200,
        system:
          "你是小说编辑，请对作者修改后的素材进行评审，并给出可执行的润色建议。重点关注卖点、冲突、节奏、人物动机、语言质感和可落地修改方向。",
        user: `收藏标题：${activeTitle || "未命名"}\n标签：${activeTags || "无"}\n\n修改后的内容：\n${activeContent}\n\n请输出：\n1. 总体评审\n2. 主要优点\n3. 需要修改的问题\n4. 润色建议\n5. 可直接替换的一版精修示例`,
        onQueueState: setQueueState,
        onToken: (token) => {
          next += token;
          addTokenUsage(Math.ceil(token.length / 2));
          setReview(next);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 评审失败");
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <AppShell
      title="工作台收藏"
      description="集中查看、修改所有已保存素材，并对修改后的版本生成 AI 评审与润色建议。"
    >
      <div className="mt-5 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="glass-panel rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">收藏列表</h2>
            <Badge variant="secondary" className="ml-auto rounded-full">
              {savedEntries.length}
            </Badge>
          </div>
          <ScrollArea className="mt-4 h-[62vh]">
            <div className="space-y-2 pr-3">
              {savedEntries.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  暂无收藏。你可以在工作台每日灵感、灵感坊、大纲、角色、世界观、续写或对话页面保存生成结果。
                </p>
              ) : null}
              {sourceNames.map((source) => (
                <div key={source} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full">{source}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {groupedEntries[source].length} 条
                    </span>
                  </div>
                  {groupedEntries[source].map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(entry.id);
                        setTitle(entry.title);
                        setContent(entry.content);
                        setTags(entry.tags.join("，"));
                        setReview("");
                        setError(null);
                      }}
                      className={`w-full rounded-lg border p-3 text-left transition hover:border-primary/35 hover:bg-primary/8 ${
                        selectedEntry?.id === entry.id
                          ? "border-primary/45 bg-primary/10"
                          : "border-white/10 bg-black/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 truncate text-sm font-medium">{entry.title}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {entry.content}
                      </p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </section>

        <div className="min-w-0 space-y-5">
          <section className="glass-panel rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">编辑收藏</h2>
              {selectedEntry ? (
                <Badge variant="secondary" className="rounded-full">
                  {selectedEntry.source}
                </Badge>
              ) : null}
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={reviewCurrent} disabled={!selectedEntry || isReviewing}>
                  {isReviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI 评审
                </Button>
                <Button size="sm" onClick={saveChanges} disabled={!selectedEntry}>
                  <Save className="h-4 w-4" />
                  保存修改
                </Button>
                <TooltipButton
                  tooltip="删除收藏"
                  size="icon-sm"
                  variant="ghost"
                  disabled={!selectedEntry}
                  onClick={() => {
                    if (!selectedEntry) {
                      return;
                    }
                    removeSavedEntry(selectedEntry.id);
                    setReview("");
                    addToast({ title: "收藏已删除", type: "success" });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </TooltipButton>
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="mb-2 text-sm font-medium">标题</p>
                <Input value={activeTitle} onChange={(event) => setTitle(event.target.value)} disabled={!selectedEntry} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">标签</p>
                <Input
                  value={activeTags}
                  onChange={(event) => setTags(event.target.value)}
                  disabled={!selectedEntry}
                  placeholder="用逗号分隔，例如：每日灵感，冲突，角色"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">内容</p>
                <Textarea
                  value={activeContent}
                  onChange={(event) => setContent(event.target.value)}
                  disabled={!selectedEntry}
                  className="min-h-[320px]"
                />
              </div>
            </div>
          </section>

          <StreamResultPanel
            title="AI 评审与润色建议"
            content={review}
            isLoading={isReviewing}
            error={error}
            queueState={queueState}
            onCopy={review ? () => navigator.clipboard.writeText(review) : undefined}
          />
        </div>
      </div>
    </AppShell>
  );
}
