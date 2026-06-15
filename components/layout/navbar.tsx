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
import { TooltipButton } from "@/components/ui/tooltip-button";
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
import { getDefaultBaseUrl, isBaseUrlEditable, providerLabels, providerModelOptions } from "@/lib/llm";
import type { LlmProvider } from "@/types";

const providers: LlmProvider[] = [
  "deepseek",
  "openai",
  "openrouter",
  "groq",
  "siliconflow",
  "together",
  "fireworks",
  "aliyun-bailian",
  "volcengine-ark",
  "xai",
  "openai-compatible",
];

const providerOptionLabels = providers.map((item) => providerLabels[item]);
const providerByLabel = Object.fromEntries(
  providers.map((item) => [providerLabels[item], item]),
) as Record<string, LlmProvider>;

export function Navbar() {
  const { theme, mounted, toggleTheme } = useInkMuseTheme();
  const provider = useNovelStore((state) => state.provider);
  const apiBaseUrl = useNovelStore((state) => state.apiBaseUrl);
  const apiKey = useNovelStore((state) => state.apiKey);
  const apiKeyPersisted = useNovelStore((state) => state.apiKeyPersisted);
  const model = useNovelStore((state) => state.model);
  const apiBalance = useNovelStore((state) => state.apiBalance);
  const tokenUsage = useNovelStore((state) => state.tokenUsage);
  const setProvider = useNovelStore((state) => state.setProvider);
  const setApiBaseUrl = useNovelStore((state) => state.setApiBaseUrl);
  const setApiKey = useNovelStore((state) => state.setApiKey);
  const setApiKeyPersisted = useNovelStore((state) => state.setApiKeyPersisted);
  const clearApiKey = useNovelStore((state) => state.clearApiKey);
  const setApiBalance = useNovelStore((state) => state.setApiBalance);
  const toggleSidebar = useNovelStore((state) => state.toggleSidebar);
  const setCommandOpen = useNovelStore((state) => state.setCommandOpen);
  const addToast = useNovelStore((state) => state.addToast);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [modelDraft, setModelDraft] = useState(model);

  async function handleBalanceQuery() {
    if (isCheckingBalance || provider !== "deepseek") {
      return;
    }

    setIsCheckingBalance(true);
    setApiBalance("查询中...");

    try {
      const response = await fetch("/api/llm/balance?provider=deepseek", {
        method: "GET",
        headers: apiKey ? { "x-llm-api-key": apiKey } : undefined,
        cache: "no-store",
      });

      const payload = (await response.json()) as { display?: string; error?: string };

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

  const modelOptions = providerModelOptions[provider];
  const editableBaseUrl = isBaseUrlEditable(provider);
  const selectedProviderLabel = providerLabels[provider];

  return (
    <header className="px-4 pt-4 lg:px-5">
      <div className="glass-panel glow-ring mx-auto flex h-16 items-center justify-between rounded-2xl border px-4">
        <div className="flex items-center gap-3">
          <TooltipButton tooltip="折叠侧边栏" size="icon" variant="ghost" className="hidden rounded-xl lg:inline-flex" onClick={toggleSidebar}>
            <Menu className="h-4 w-4" />
          </TooltipButton>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/18 text-primary shadow-[0_0_24px_rgba(124,58,237,0.2)]">
            <PenTool className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-foreground/90">InkMuse</p>
            <p className="text-xs text-foreground/50">灵感、结构、写作与设定协同工作台</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipButton tooltip="打开快捷命令" variant="ghost" size="icon" className="rounded-xl border border-white/10 bg-white/5" onClick={() => setCommandOpen(true)}>
            <Command className="h-4 w-4" />
          </TooltipButton>
          <TooltipButton tooltip="切换明暗主题" variant="ghost" size="icon" className="rounded-xl border border-white/10 bg-white/5 transition hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(6,182,212,0.16)]" onClick={toggleTheme}>
            {!mounted ? <MoonStar className="h-4 w-4" /> : theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </TooltipButton>
          <Dialog>
            <DialogTrigger render={<Button variant="secondary" className="hidden rounded-xl md:inline-flex" />}>
              <Download className="mr-2 h-4 w-4" />
              导出
            </DialogTrigger>
            <DialogContent className="glass-card sm:max-w-sm">
              <ExportMenu />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger render={<Button className="rounded-xl bg-primary/85 text-primary-foreground hover:bg-primary hover:shadow-[0_0_24px_rgba(124,58,237,0.28)]" />}>
              <Settings2 className="mr-2 h-4 w-4" />
              API 设置
            </DialogTrigger>
            <DialogContent className="border-border bg-popover text-popover-foreground backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>LLM 接入</DialogTitle>
                <DialogDescription>支持多种模型平台，模型名可自由填写。</DialogDescription>
              </DialogHeader>
              <div>
                <p className="mb-2 text-sm font-medium">提供商</p>
                <OptionChips
                  options={providerOptionLabels}
                  value={[selectedProviderLabel]}
                  onChange={(value) => {
                    const next = providerByLabel[value[0]] ?? provider;
                    setProvider(next);
                    setModelDraft(providerModelOptions[next][0] ?? modelDraft);
                  }}
                />
              </div>
              {editableBaseUrl ? (
                <Input
                  value={apiBaseUrl}
                  onChange={(event) => setApiBaseUrl(event.target.value)}
                  placeholder={getDefaultBaseUrl(provider) || "https://api.example.com/v1"}
                />
              ) : null}
              <Input type="password" placeholder="sk-..." value={apiKey} onChange={(event) => setApiKey(event.target.value, apiKeyPersisted)} />
              <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
                <div className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <div>
                    <p className="text-sm font-medium">记住此设备</p>
                    <p className="mt-1 text-xs text-muted-foreground">关闭后需重新输入 Key。</p>
                  </div>
                </div>
                <Switch checked={apiKeyPersisted} onCheckedChange={setApiKeyPersisted} aria-label="记住此设备" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">模型</p>
                <div className="space-y-3">
                  <OptionChips
                    options={modelOptions}
                    value={modelOptions.includes(model) ? [model] : []}
                    onChange={(value) => {
                      const next = value[0];
                      setModelDraft(next);
                    useNovelStore.getState().setModel(next || modelDraft);
                  }}
                />
                  <Input
                    value={modelDraft}
                    onChange={(event) => {
                      const next = event.target.value;
                      setModelDraft(next);
                    }}
                    onBlur={() => useNovelStore.getState().setModel(modelDraft)}
                    placeholder="手动输入模型名，例如 deepseek-v3 / claude-3.5-sonnet / gpt-4.1-mini"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/10 p-3 text-sm">
                <div>
                  <p className="text-muted-foreground">API 余额</p>
                  <p className="mt-1 font-medium">{apiBalance}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">消费统计</p>
                  <p className="mt-1 font-medium">{tokenUsage.toLocaleString()} tokens</p>
                </div>
              </div>
              <Button variant="secondary" onClick={handleBalanceQuery} disabled={isCheckingBalance || provider !== "deepseek"}>
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
