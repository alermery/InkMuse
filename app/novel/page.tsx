"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  BrainCircuit,
  FileText,
  Layers3,
  LibraryBig,
  Loader2,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SavedImportPanel } from "@/components/features/saved-import-panel";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { streamLlm } from "@/lib/ai-stream";
import { buildProjectAnalysisPrompt, saveProjectMemory } from "@/lib/project-memory";
import { countChineseWords } from "@/lib/word-count";
import { useNovelStore } from "@/lib/store";
import { usePersistedState } from "@/lib/use-persisted-state";
import type { OutlineMemoryNode, ProjectChapterMemory, ProjectMemorySnapshot } from "@/types";

const chapterHeadingPattern =
  /^(#{1,3}\s*)?(第[一二三四五六七八九十百千万\d]+[章节卷回部篇][：:\s]?.*|Chapter\s+\d+.*)$/i;

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeTitle(value: string, fallback: string) {
  const title = value.replace(/^#{1,6}\s*/, "").trim();
  return title || fallback || "未命名章节";
}

function splitIntoChapters(content: string, fallbackTitle: string, source: string): ProjectChapterMemory[] {
  const text = plainText(content);
  if (!text) return [];

  const sections: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (chapterHeadingPattern.test(trimmed)) {
      if (current) sections.push(current);
      current = { title: normalizeTitle(trimmed, fallbackTitle), lines: [trimmed] };
      return;
    }
    if (current) current.lines.push(line);
  });

  if (current) sections.push(current);

  const now = new Date().toISOString();
  const rawChapters = sections.length
    ? sections.map((section) => ({ title: section.title, content: section.lines.join("\n").trim() })).filter((chapter) => chapter.content)
    : [{ title: fallbackTitle || "未命名章节", content: text }];

  return rawChapters.map((chapter, index) => ({
    id: createId("chapter"),
    title: chapter.title || `第${index + 1}章`,
    content: chapter.content,
    source,
    createdAt: now,
    wordCount: countChineseWords(chapter.content),
  }));
}

function countOutlineNodes(nodes: OutlineMemoryNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countOutlineNodes(node.children ?? []), 0);
}

function OutlinePreview({ nodes, level = 0 }: { nodes: OutlineMemoryNode[]; level?: number }) {
  if (!nodes.length && level === 0) {
    return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">暂无大纲树。可先在大纲页生成或导入大纲。</p>;
  }

  return (
    <div className={level === 0 ? "space-y-2" : "mt-2 space-y-2 border-l border-white/10 pl-3"}>
      {nodes.slice(0, level === 0 ? 10 : 6).map((node) => (
        <div key={node.id} className="rounded-lg border border-white/10 bg-black/10 p-3">
          <p className="truncate text-sm font-medium">{node.title}</p>
          {node.children?.length ? <OutlinePreview nodes={node.children} level={level + 1} /> : null}
        </div>
      ))}
      {nodes.length > (level === 0 ? 10 : 6) ? (
        <p className="text-xs text-muted-foreground">还有 {nodes.length - (level === 0 ? 10 : 6)} 个节点未展示</p>
      ) : null}
    </div>
  );
}

export default function NovelPage() {
  const provider = useNovelStore((state) => state.provider);
  const apiBaseUrl = useNovelStore((state) => state.apiBaseUrl);
  const apiKey = useNovelStore((state) => state.apiKey);
  const model = useNovelStore((state) => state.model);
  const currentNovel = useNovelStore((state) => state.currentNovel);
  const chapterDraft = useNovelStore((state) => state.chapterDraft);
  const savedEntries = useNovelStore((state) => state.savedEntries);
  const settings = useNovelStore((state) => state.encyclopediaEntries);
  const addToast = useNovelStore((state) => state.addToast);
  const addTokenUsage = useNovelStore((state) => state.addTokenUsage);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);
  const [chapters, setChapters] = usePersistedState<ProjectChapterMemory[]>("inkmuse:novel:chapters", []);
  const [selectedId, setSelectedId] = usePersistedState("inkmuse:novel:selectedId", "");
  const [manualTitle, setManualTitle] = usePersistedState("inkmuse:novel:manualTitle", "");
  const [manualContent, setManualContent] = usePersistedState("inkmuse:novel:manualContent", "");
  const [outlineNodes] = usePersistedState<OutlineMemoryNode[]>("inkmuse:outline:nodes", []);
  const [analysis, setAnalysis] = usePersistedState("inkmuse:novel:analysis", "");
  const [queueState, setQueueState] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const selectedChapter = chapters.find((chapter) => chapter.id === selectedId) ?? chapters[0];
  const totalWords = chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
  const averageWords = chapters.length ? Math.round(totalWords / chapters.length) : 0;
  const outlineCount = countOutlineNodes(outlineNodes);
  const settingGroups = useMemo(
    () =>
      settings.reduce<Record<string, number>>((groups, item) => {
        groups[item.category] = (groups[item.category] ?? 0) + 1;
        return groups;
      }, {}),
    [settings],
  );

  const snapshot: ProjectMemorySnapshot = {
    id: "default-memory",
    novelId: currentNovel?.id ?? "novel-1",
    title: currentNovel?.title ?? "未命名项目",
    genre: currentNovel?.genre ?? "",
    synopsis: currentNovel?.synopsis ?? "",
    chapterDraft,
    chapters,
    outlineNodes,
    savedEntries,
    encyclopediaEntries: settings,
    updatedAt: new Date().toISOString(),
  };

  function syncProjectMemory() {
    saveProjectMemory(snapshot);
    addToast({ title: "项目长期记忆已同步", type: "success" });
  }

  function addImportedChapters(content: string, title: string, source: string) {
    const nextChapters = splitIntoChapters(content, title, source);

    if (!nextChapters.length) {
      addToast({ title: "没有识别到可导入内容", type: "info" });
      return;
    }

    setChapters((value) => [...value, ...nextChapters]);
    setSelectedId(nextChapters[0].id);
    addToast({ title: `已导入 ${nextChapters.length} 个章节`, type: "success" });
  }

  function removeChapter(id: string) {
    setChapters((value) => value.filter((chapter) => chapter.id !== id));
    if (selectedId === id) setSelectedId("");
  }

  async function analyzeWholeNovel() {
    setAnalysis("");
    setAnalysisError(null);
    setIsAnalyzing(true);
    incrementAiCallCount();
    syncProjectMemory();

    try {
      let output = "";
      await streamLlm({
        provider,
        apiBaseUrl,
        apiKey,
        model,
        temperature: 0.4,
        maxTokens: 3200,
        system: "你是长篇小说编辑与结构分析顾问，需要结合整本小说记忆做诊断，而不是只看单次输入。",
        user: buildProjectAnalysisPrompt(snapshot),
        onQueueState: setQueueState,
        onToken: (token) => {
          output += token;
          addTokenUsage(Math.ceil(token.length / 2));
          setAnalysis(output);
        },
      });
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "全书分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <AppShell
      title="小说总览"
      description="把章节、大纲、设定和收藏汇总为全书记忆，并基于整本小说上下文做分析。"
    >
      <div className="mt-5 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className="glass-panel rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <LibraryBig className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">导入章节</h2>
            </div>
            <div className="mt-4 space-y-3">
              <Input value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} placeholder="章节标题或书名" className="border-white/10 bg-black/10" />
              <Textarea
                value={manualContent}
                onChange={(event) => setManualContent(event.target.value)}
                placeholder="粘贴正文，支持按“第1章 / 第一章 / Chapter 1”自动拆分"
                className="min-h-32 border-white/10 bg-black/10"
              />
              <Button className="w-full" onClick={() => addImportedChapters(manualContent, manualTitle || "手动导入", "手动导入")} disabled={!manualContent.trim()}>
                <Plus className="h-4 w-4" />
                导入为章节
              </Button>
              <Button className="w-full" variant="secondary" onClick={() => addImportedChapters(chapterDraft, "当前草稿", "章节编辑器")} disabled={!plainText(chapterDraft)}>
                <FileText className="h-4 w-4" />
                导入当前编辑器草稿
              </Button>
              <Button className="w-full" variant="secondary" onClick={syncProjectMemory}>
                <BrainCircuit className="h-4 w-4" />
                同步长期记忆
              </Button>
              <Button className="w-full" onClick={analyzeWholeNovel} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                全书分析
              </Button>
            </div>
          </section>

          <SavedImportPanel
            title="从收藏导入章节"
            description="可导入续写、大纲、灵感、本地导入等任意收藏内容，并自动尝试拆分章节。"
            onImport={(entry) => addImportedChapters(entry.content, entry.title, entry.source)}
          />
        </div>

        <div className="min-w-0 space-y-5">
          <section className="grid gap-3 md:grid-cols-4">
            {[
              { label: "章节数", value: chapters.length.toLocaleString(), icon: BookOpen },
              { label: "总字数", value: totalWords.toLocaleString(), icon: FileText },
              { label: "平均章字数", value: averageWords.toLocaleString(), icon: FileText },
              { label: "设定条目", value: settings.length.toLocaleString(), icon: Settings2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="glass-panel rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                </div>
              );
            })}
          </section>

          <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="glass-panel rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">章节列表</h2>
                <Badge variant="secondary" className="ml-auto rounded-full">
                  {chapters.length}
                </Badge>
              </div>
              <ScrollArea className="mt-4 h-[520px]">
                <div className="space-y-2 pr-3">
                  {chapters.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">暂无章节。请从左侧导入正文或收藏。</p>
                  ) : null}
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => setSelectedId(chapter.id)}
                      className={[
                        "w-full rounded-lg border p-3 text-left transition hover:border-primary/35 hover:bg-primary/8",
                        selectedChapter?.id === chapter.id ? "border-primary/45 bg-primary/10" : "border-white/10 bg-black/10",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-0.5 shrink-0 rounded-full">
                          {index + 1}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{chapter.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {chapter.wordCount.toLocaleString()} 字 · {chapter.source}
                          </p>
                        </div>
                        <TooltipButton
                          tooltip="删除章节"
                          size="icon-xs"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeChapter(chapter.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </TooltipButton>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="glass-panel rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">正文预览</h2>
                {selectedChapter ? (
                  <>
                    <Badge variant="secondary">{selectedChapter.source}</Badge>
                    <span className="text-xs text-muted-foreground">{selectedChapter.wordCount.toLocaleString()} 字</span>
                  </>
                ) : null}
              </div>
              <ScrollArea className="mt-4 h-[520px]">
                {selectedChapter ? (
                  <article className="serif-body whitespace-pre-wrap pr-4 text-sm leading-8 text-foreground/85">
                    <h3 className="mb-4 text-xl font-semibold text-foreground">{selectedChapter.title}</h3>
                    {selectedChapter.content}
                  </article>
                ) : (
                  <p className="text-sm text-muted-foreground">选择一个章节后查看正文。</p>
                )}
              </ScrollArea>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="glass-panel rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">大纲树概览</h2>
                <Badge variant="secondary" className="ml-auto rounded-full">
                  {outlineCount}
                </Badge>
              </div>
              <div className="mt-4">
                <OutlinePreview nodes={outlineNodes} />
              </div>
            </div>

            <div className="glass-panel rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">设定情况</h2>
                <Badge variant="secondary" className="ml-auto rounded-full">
                  {settings.length}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.keys(settingGroups).length ? (
                  Object.entries(settingGroups).map(([category, count]) => (
                    <Badge key={category} variant="secondary" className="rounded-full">
                      {category} · {count}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">暂无设定条目。可在设定集页面提取或保存。</p>
                )}
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs text-muted-foreground">最近收藏来源</p>
                <div className="flex flex-wrap gap-2">
                  {savedEntries.length ? (
                    Array.from(new Set(savedEntries.map((entry) => entry.source))).map((source) => (
                      <Badge key={source} variant="outline" className="rounded-full">
                        {source}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无收藏内容。</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <StreamResultPanel
            title="全书分析"
            content={analysis}
            isLoading={isAnalyzing}
            error={analysisError}
            queueState={queueState}
          />
        </div>
      </div>
    </AppShell>
  );
}
