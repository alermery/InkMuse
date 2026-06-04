"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNovelStore } from "@/lib/store";

const shortcuts = [
  ["Ctrl/Cmd + S", "保存当前章节"],
  ["Ctrl/Cmd + Enter", "AI 续写"],
  ["Ctrl/Cmd + Shift + P", "打开命令面板"],
  ["Ctrl/Cmd + /", "显示快捷键"],
  ["Ctrl/Cmd + K", "快速搜索"],
  ["Ctrl/Cmd + B", "切换侧边栏"],
] as const;

export function ShortcutLayer() {
  const setCommandOpen = useNovelStore((state) => state.setCommandOpen);
  const shortcutOpen = useNovelStore((state) => state.shortcutOpen);
  const setShortcutOpen = useNovelStore((state) => state.setShortcutOpen);
  const toggleSidebar = useNovelStore((state) => state.toggleSidebar);
  const addToast = useNovelStore((state) => state.addToast);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) {
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        addToast({ title: "章节已保存", description: "内容已写入本地存储", type: "success" });
      }
      if (event.key === "Enter") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("novelmuse:continue"));
      }
      if (event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "/") {
        event.preventDefault();
        setShortcutOpen(true);
      }
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleSidebar();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addToast, setCommandOpen, setShortcutOpen, toggleSidebar]);

  return (
    <Dialog open={shortcutOpen} onOpenChange={setShortcutOpen}>
      <DialogContent className="glass-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>快捷键</DialogTitle>
          <DialogDescription>常用写作与导航操作</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {shortcuts.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/10 px-3 py-2">
              <span className="text-sm text-muted-foreground">{label}</span>
              <kbd className="rounded-md bg-white/10 px-2 py-1 text-xs">{key}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
