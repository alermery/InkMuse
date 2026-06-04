"use client";

import { useMemo, useState } from "react";
import { BookMarked, Loader2, Search, Trash2, Wand2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { OptionChips } from "@/components/features/option-chips";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { settingEntryFromText, streamDeepSeek } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";
import type { EncyclopediaEntry } from "@/types";

const categories: EncyclopediaEntry["category"][] = ["角色", "世界观", "道具", "术语", "章节", "其他"];

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim();
}

export default function SettingPage() {
  const apiKey = useNovelStore((state) => state.apiKey);
  const chapterDraft = useNovelStore((state) => state.chapterDraft);
  const entries = useNovelStore((state) => state.encyclopediaEntries);
  const saveSetting = useNovelStore((state) => state.saveSetting);
  const removeSetting = useNovelStore((state) => state.removeSetting);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string[]>(["世界观"]);
  const [tags, setTags] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return entries;
    }

    return entries.filter((entry) =>
      `${entry.title} ${entry.content} ${entry.tags.join(" ")}`.toLowerCase().includes(keyword),
    );
  }, [entries, query]);

  async function extractSettings() {
    setOutput("");
    setError(null);
    setIsLoading(true);
    incrementAiCallCount();

    try {
      let next = "";
      await streamDeepSeek({
        apiKey,
        system: "你是小说设定集管理员。请从文本中提取角色、世界观、道具、术语、地点、规则等设定，整理为条目卡片。输出 Markdown，每条包含标题、分类、标签、正文、关联章节建议。",
        user: `分类偏好：${category[0]}\n标签：${tags}\n文本：\n${sourceText || plainText(chapterDraft)}`,
        onToken: (token) => {
          next += token;
          setOutput(next);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "自动提取失败");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell
      title="设定集"
      description="统一管理角色、世界观、道具和术语，支持搜索、标签、AI 自动提取和关联章节。"
    >
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <section className="glass-panel rounded-lg border p-4">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">分类</p>
              <OptionChips options={categories} value={category} onChange={setCategory} />
            </div>
            <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="标签，逗号分隔" className="border-white/10 bg-black/10" />
            <Textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="可贴入章节文本；留空则从当前章节草稿提取" className="min-h-40 border-white/10 bg-black/10" />
            <Button className="w-full" onClick={extractSettings} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              AI 自动提取
            </Button>
          </div>
        </section>
        <div className="space-y-5">
          <div className="glass-panel rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="全文搜索设定、标签、正文" className="border-white/10 bg-black/10" />
            </div>
          </div>
          <StreamResultPanel
            title="AI 提取结果"
            content={output}
            isLoading={isLoading}
            error={error}
            onSave={
              output
                ? () =>
                    saveSetting(
                      settingEntryFromText(
                        category[0] as EncyclopediaEntry["category"],
                        "AI 提取设定",
                        output,
                        tags.split(",").map((item) => item.trim()).filter(Boolean),
                      ),
                    )
                : undefined
            }
          />
          <section className="grid gap-3 md:grid-cols-2">
            {filtered.length === 0 ? (
              <div className="glass-panel rounded-lg border p-5 text-sm text-foreground/50">
                暂无设定条目。
              </div>
            ) : null}
            {filtered.map((entry) => (
              <article key={entry.id} className="glass-panel rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <BookMarked className="h-4 w-4 text-primary" />
                      <h2 className="truncate text-sm font-semibold">{entry.title}</h2>
                    </div>
                    <p className="serif-body mt-3 line-clamp-5 text-sm leading-7 text-foreground/75">{entry.content}</p>
                  </div>
                  <Button size="icon-sm" variant="ghost" onClick={() => removeSetting(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{entry.category}</Badge>
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
