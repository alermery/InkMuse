import type { ReactNode } from "react";
import { AIPanel } from "@/components/ai/ai-panel";
import { AppShell } from "@/components/layout/app-shell";

export function FeaturePage({
  title,
  description,
  children,
  aiTitle,
  aiPromptLabel,
}: {
  title: string;
  description: string;
  children: ReactNode;
  aiTitle: string;
  aiPromptLabel: string;
}) {
  return (
    <AppShell title={title} description={description}>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>{children}</div>
        <AIPanel title={aiTitle} promptLabel={aiPromptLabel} />
      </div>
    </AppShell>
  );
}
