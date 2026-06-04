"use client";

import { Archive, Clipboard, FileText, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportMarkdown, exportNovelZip, exportTxt, stripHtml } from "@/lib/export";
import { useNovelStore } from "@/lib/store";

export function ExportMenu() {
  const currentNovel = useNovelStore((state) => state.currentNovel);
  const chapterDraft = useNovelStore((state) => state.chapterDraft);
  const savedEntries = useNovelStore((state) => state.savedEntries);
  const encyclopediaEntries = useNovelStore((state) => state.encyclopediaEntries);
  const addToast = useNovelStore((state) => state.addToast);
  const title = currentNovel?.title ?? "InkMuse";

  async function copyText() {
    await navigator.clipboard.writeText(stripHtml(chapterDraft));
    addToast({ title: "已复制到剪贴板", type: "success" });
  }

  return (
    <div className="glass-card grid gap-2 p-3">
      <Button variant="ghost" className="justify-start" onClick={() => exportMarkdown(title, title, chapterDraft)}>
        <FileText className="h-4 w-4" />
        导出 Markdown
      </Button>
      <Button variant="ghost" className="justify-start" onClick={() => exportTxt(title, chapterDraft)}>
        <StickyNote className="h-4 w-4" />
        导出 TXT
      </Button>
      <Button
        variant="ghost"
        className="justify-start"
        onClick={() => exportNovelZip({ title, chapterDraft, savedEntries, encyclopediaEntries })}
      >
        <Archive className="h-4 w-4" />
        整本打包 ZIP
      </Button>
      <Button variant="ghost" className="justify-start" onClick={copyText}>
        <Clipboard className="h-4 w-4" />
        复制纯文本
      </Button>
    </div>
  );
}
