"use client";

import { BookMarked, Import } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNovelStore } from "@/lib/store";
import type { SavedEntry } from "@/types";

type SavedImportPanelProps = {
  title?: string;
  description?: string;
  sourceFilter?: string[];
  onImport: (entry: SavedEntry) => void;
};

function groupBySource(entries: SavedEntry[]) {
  return entries.reduce<Record<string, SavedEntry[]>>((groups, entry) => {
    groups[entry.source] ??= [];
    groups[entry.source].push(entry);
    return groups;
  }, {});
}

export function SavedImportPanel({
  title = "导入收藏",
  description = "从收藏集中选择素材，导入当前功能继续修改。",
  sourceFilter,
  onImport,
}: SavedImportPanelProps) {
  const savedEntries = useNovelStore((state) => state.savedEntries);
  const entries = sourceFilter?.length
    ? savedEntries.filter((entry) => sourceFilter.includes(entry.source))
    : savedEntries;
  const groups = groupBySource(entries);
  const sources = Object.keys(groups);

  return (
    <section className="glass-panel flex max-h-[560px] flex-col rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <BookMarked className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge variant="secondary" className="ml-auto rounded-full">
          {entries.length}
        </Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
      <div className="relative mt-3 min-h-0 flex-1">
        <ScrollArea className="h-[360px] max-h-[45vh] min-h-0">
          <div className="space-y-3 pr-3 pb-8">
          {entries.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              当前没有可导入的收藏。
            </p>
          ) : null}
          {sources.map((source) => (
            <div key={source} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="rounded-full">{source}</Badge>
                <span className="text-xs text-muted-foreground">{groups[source].length} 条</span>
              </div>
              {groups[source].map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/10 bg-black/10 p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {entry.content}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => onImport(entry)}>
                      <Import className="h-3.5 w-3.5" />
                      导入
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          </div>
        </ScrollArea>
        {entries.length > 2 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/90 to-transparent" />
        ) : null}
      </div>
    </section>
  );
}
