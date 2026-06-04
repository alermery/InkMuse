"use client";

import { useState } from "react";
import {
  Command,
  Download,
  Menu,
  MoonStar,
  PenTool,
  ShieldCheck,
  Settings2,
  SunMedium,
} from "lucide-react";
import { ExportMenu } from "@/components/features/export-menu";
import { useInkMuseTheme } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { OptionChips } from "@/components/features/option-chips";
import { useNovelStore } from "@/lib/store";
import type { DeepSeekModel } from "@/types";

const models: DeepSeekModel[] = ["deepseek-v4-flash", "deepseek-v4-pro"];

export function Navbar() {
  const { theme, mounted, toggleTheme } = useInkMuseTheme();
  const apiKey = useNovelStore((state) => state.apiKey);
  const apiKeyPersisted = useNovelStore((state) => state.apiKeyPersisted);
  const model = useNovelStore((state) => state.model);
  const apiBalance = useNovelStore((state) => state.apiBalance);
  const tokenUsage = useNovelStore((state) => state.tokenUsage);
  const setModel = useNovelStore((state) => state.setModel);
  const setApiKey = useNovelStore((state) => state.setApiKey);
  const setApiKeyPersisted = useNovelStore((state) => state.setApiKeyPersisted);
  const clearApiKey = useNovelStore((state) => state.clearApiKey);
  const setApiBalance = useNovelStore((state) => state.setApiBalance);
  const toggleSidebar = useNovelStore((state) => state.toggleSidebar);
  const setCommandOpen = useNovelStore((state) => state.setCommandOpen);
  const addToast = useNovelStore((state) => state.addToast);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  async function handleBalanceQuery() {
    if (isCheckingBalance) {
      return;
    }

    setIsCheckingBalance(true);
    setApiBalance("查询中...");

    try {
      const response = await fetch("/api/deepseek/balance", {
        method: "GET",
        headers: apiKey
          ? {
              "x-deepseek-api-key": apiKey,
            }
          : undefined,
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        display?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "余额查询失败");
      }

      setApiBalance(payload.display ?? "未知");
      addToast({ title: "余额已更新", type: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "余额查询失败";
      setApiBalance(message);
      addToast({ title: "余额查询失败", description: message, type: "error" });
    } finally {
      setIsCheckingBalance(false);
    }
  }

  return (
    <header className="px-4 pt-4 lg:px-5">
      <div className="glass-panel glow-ring mx-auto flex h-16 items-center justify-between rounded-2xl border px-4">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="hidden rounded-xl lg:inline-flex"
            onClick={toggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/18 text-primary shadow-[0_0_24px_rgba(124,58,237,0.2)]">
            <PenTool className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-foreground/90">
              InkMuse
            </p>
            <p className="text-xs text-foreground/50">
              灵感、结构、写作与设定协同工作台
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl border border-white/10 bg-white/5"
            onClick={() => setCommandOpen(true)}
          >
            <Command className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl border border-white/10 bg-white/5 transition hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(6,182,212,0.16)]"
            onClick={toggleTheme}
          >
            {!mounted ? (
              <MoonStar className="h-4 w-4" />
            ) : theme === "dark" ? (
              <SunMedium className="h-4 w-4" />
            ) : (
              <MoonStar className="h-4 w-4" />
            )}
          </Button>
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="secondary"
                  className="hidden rounded-xl md:inline-flex"
                />
              }
            >
              <Download className="mr-2 h-4 w-4" />
              导出
            </DialogTrigger>
            <DialogContent className="glass-card sm:max-w-sm">
              <ExportMenu />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger
              render={
                <Button className="rounded-xl bg-primary/85 text-primary-foreground hover:bg-primary hover:shadow-[0_0_24px_rgba(124,58,237,0.28)]" />
              }
            >
              <Settings2 className="mr-2 h-4 w-4" />
              API Key 设置
            </DialogTrigger>
            <DialogContent className="border-border bg-popover text-popover-foreground backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>DeepSeek API Key</DialogTitle>
                <DialogDescription>
                  默认仅在当前页面会话中保存。开启“记住此设备”后，才会写入当前浏览器 LocalStorage。
                </DialogDescription>
              </DialogHeader>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value, apiKeyPersisted)}
              />
              <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
                <div className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <div>
                    <p className="text-sm font-medium">记住此设备</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      关闭时，刷新或关闭页面后需要重新输入 Key。
                    </p>
                  </div>
                </div>
                <Switch
                  checked={apiKeyPersisted}
                  onCheckedChange={setApiKeyPersisted}
                  aria-label="记住此设备"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">模型</p>
                <OptionChips
                  options={models}
                  value={[model]}
                  onChange={(value) => setModel(value[0] as DeepSeekModel)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/10 p-3 text-sm">
                <div>
                  <p className="text-muted-foreground">API 余额</p>
                  <p className="mt-1 font-medium">{apiBalance}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">消耗统计</p>
                  <p className="mt-1 font-medium">{tokenUsage.toLocaleString()} tokens</p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={handleBalanceQuery}
                disabled={isCheckingBalance}
              >
                {isCheckingBalance ? "查询中..." : "查询余额"}
              </Button>
              {apiKey ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    clearApiKey();
                    addToast({ title: "API Key 已清除", type: "success" });
                  }}
                >
                  清除本机 Key
                </Button>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
