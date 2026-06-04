"use client";

import { BookMarked, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useNovelStore } from "@/lib/store";

export function SavedDock() {
  const savedEntries = useNovelStore((state) => state.savedEntries);
  const removeSavedEntry = useNovelStore((state) => state.removeSavedEntry);

  return (
    <section className="glass-panel rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <BookMarked className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">工作台收藏</h2>
        <Badge variant="secondary" className="ml-auto rounded-full">
          {savedEntries.length}
        </Badge>
      </div>
      <ScrollArea className="mt-3 h-56">
        <div className="space-y-2 pr-3">
          {savedEntries.length === 0 ? (
            <p className="text-sm text-foreground/45">保存的生成结果会出现在这里。</p>
          ) : null}
          {savedEntries.slice(0, 8).map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-white/10 bg-black/10 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant="secondary" className="shrink-0 rounded-full">
                      {entry.source}
                    </Badge>
                    <p className="truncate text-sm font-medium">{entry.title}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-foreground/55">
                    {entry.content}
                  </p>
                </div>
                <TooltipButton
                  tooltip="删除收藏"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => removeSavedEntry(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </TooltipButton>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}
