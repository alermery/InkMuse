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
import { Switch } from "@/components/ui/switch";
import { useNovelStore } from "@/lib/store";

export function ApiKeyOnboarding() {
  const apiKey = useNovelStore((state) => state.apiKey);
  const setApiKey = useNovelStore((state) => state.setApiKey);
  const addToast = useNovelStore((state) => state.addToast);
  const [draft, setDraft] = useState(apiKey);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = !apiKey && !dismissed;

  function save() {
    setApiKey(draft, rememberDevice);
    addToast({
      title: rememberDevice ? "API Key 已保存到此设备" : "API Key 已用于当前会话",
      type: "success",
    });
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
            默认仅在当前页面会话中保存，用于调用 DeepSeek 代理接口。
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="sk-..."
          className="border-white/10 bg-black/10"
        />
        <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
          <div>
            <p className="text-sm font-medium">记住此设备</p>
            <p className="mt-1 text-xs text-muted-foreground">
              开启后会写入当前浏览器 LocalStorage；公共设备不建议开启。
            </p>
          </div>
          <Switch
            checked={rememberDevice}
            onCheckedChange={setRememberDevice}
            aria-label="记住此设备"
          />
        </div>
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
