"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ApiKeyOnboarding } from "@/components/features/api-key-onboarding";
import { CommandPalette } from "@/components/features/command-palette";
import { ShortcutLayer } from "@/components/features/shortcut-layer";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { StatusBar } from "@/components/layout/status-bar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNovelStore } from "@/lib/store";

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const currentProject = useNovelStore((state) => state.currentNovel);
  const sidebarCollapsed = useNovelStore((state) => state.sidebarCollapsed);
  const projectGenre = currentProject?.genre?.trim();

  return (
    <div className="app-shell">
      <ApiKeyOnboarding />
      <CommandPalette />
      <ShortcutLayer />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 gap-4 px-4 pb-4 pt-2 lg:px-5">
          <Sidebar />
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="glass-panel glow-ring flex min-h-[calc(100vh-10.5rem)] flex-1 flex-col overflow-hidden rounded-2xl border"
              style={{ marginLeft: sidebarCollapsed ? 0 : undefined }}
            >
              <div className="border-b border-white/10 px-6 py-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {projectGenre || "创作工作流"}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                  {title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6">{children}</div>
              </ScrollArea>
            </motion.main>
          </AnimatePresence>
        </div>
        <StatusBar />
      </div>
    </div>
  );
}
