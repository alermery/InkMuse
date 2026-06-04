"use client";

import { AlertCircle, Clipboard, Loader2, Save, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { cn } from "@/lib/utils";
import { countChineseWords, getWordCountReview, parseTargetWordCount } from "@/lib/word-count";

export function StreamResultPanel({
  title,
  content,
  isLoading,
  error,
  onSave,
  onCopy,
  queueState,
  className,
  targetWords,
}: {
  title: string;
  content: string;
  isLoading: boolean;
  error: string | null;
  onSave?: () => void;
  onCopy?: () => void;
  queueState?: string;
  className?: string;
  targetWords?: string | number | null;
}) {
  const actualWords = countChineseWords(content);
  const review = getWordCountReview(actualWords, parseTargetWordCount(targetWords));

  return (
    <section className={cn("glass-panel rounded-lg border p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <h2 className="truncate text-sm font-semibold">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {content ? (
            <span
              className={cn(
                "rounded-full px-2 py-1 text-xs",
                review.status === "ok" && "bg-emerald-500/12 text-emerald-500",
                review.status === "low" && "bg-amber-500/12 text-amber-500",
                review.status === "high" && "bg-rose-500/12 text-rose-500",
                review.status === "neutral" && "bg-muted text-muted-foreground",
              )}
            >
              {review.label}
            </span>
          ) : null}
          {onCopy ? (
            <TooltipButton tooltip="复制结果" size="icon-sm" variant="ghost" onClick={onCopy}>
              <Clipboard className="h-4 w-4" />
            </TooltipButton>
          ) : null}
          {onSave ? (
            <Button size="sm" variant="secondary" onClick={onSave}>
              <Save className="h-4 w-4" />
              保存
            </Button>
          ) : null}
        </div>
      </div>
      <div className="loading-shimmer/0 mt-4 min-h-40 rounded-lg border border-white/10 bg-black/10 p-4">
        {error ? (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        {!error && !content && !isLoading ? (
          <p className="text-sm text-foreground/45">生成结果会实时显示在这里。</p>
        ) : null}
        {content ? (
          <div className={cn("serif-body text-sm leading-7 text-foreground/85", isLoading && "stream-cursor")}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : null}
        {isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-xs text-foreground/50">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {queueState ?? "DeepSeek 正在流式生成"}
          </div>
        ) : null}
      </div>
    </section>
  );
}
