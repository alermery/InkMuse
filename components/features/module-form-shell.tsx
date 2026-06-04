import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SavedDock } from "@/components/features/saved-dock";

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
      <div className="grid gap-5 xl:grid-cols-[360px_1fr_300px]">
        <div>{left}</div>
        <div>{right}</div>
        <SavedDock />
      </div>
    </AppShell>
  );
}
