"use client";

import { Activity, BookOpen, Languages } from "lucide-react";
import { useNovelStore } from "@/lib/store";

function getPlainTextLength(input: string) {
  return input.replace(/<[^>]*>/g, "").trim().length;
}

export function StatusBar() {
  const currentNovel = useNovelStore((state) => state.currentNovel);
  const aiCallCount = useNovelStore((state) => state.aiCallCount);
  const chapterDraft = useNovelStore((state) => state.chapterDraft);

  return (
    <footer className="px-4 pb-4 lg:px-5">
      <div className="glass-panel mx-auto flex min-h-14 flex-col justify-center gap-2 rounded-[22px] border px-4 py-3 text-xs text-foreground/60 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>当前项目：{currentNovel?.title ?? "未命名长篇"}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Languages className="h-4 w-4 text-primary" />
            字数统计：{getPlainTextLength(chapterDraft).toLocaleString()} 字
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-primary" />
            AI 调用次数：{aiCallCount}
          </span>
        </div>
      </div>
    </footer>
  );
}
