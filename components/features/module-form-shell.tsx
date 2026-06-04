import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export function ModuleFormShell({
  title,
  description,
  left,
  right,
}: {
  title: string;
  description: string;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <AppShell title={title} description={description}>
      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div>{left}</div>
        <div className="min-w-0">{right}</div>
      </div>
    </AppShell>
  );
}
