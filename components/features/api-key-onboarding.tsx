"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNovelStore } from "@/lib/store";

export function ApiKeyOnboarding() {
  const apiKey = useNovelStore((state) => state.apiKey);
  const setApiKey = useNovelStore((state) => state.setApiKey);
  const addToast = useNovelStore((state) => state.addToast);
  const [draft, setDraft] = useState(apiKey);
  const [dismissed, setDismissed] = useState(false);
  const open = !apiKey && !dismissed;

  function save() {
    setApiKey(draft);
    addToast({ title: "API Key 已保存", type: "success" });
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && setDismissed(true)}>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            设置 DeepSeek API Key
          </DialogTitle>
          <DialogDescription>
            Key 会加密后保存在当前浏览器 LocalStorage，用于本地代理调用。
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="sk-..."
          className="border-white/10 bg-black/10"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDismissed(true)}>
            稍后
          </Button>
          <Button onClick={save} disabled={!draft.trim()}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
