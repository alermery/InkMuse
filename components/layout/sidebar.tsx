"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  BookOpenText,
  Bot,
  Compass,
  FileText,
  Home,
  Menu,
  MessageCircleMore,
  ScrollText,
  Sparkles,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNovelStore } from "@/lib/store";

const navItems = [
  { href: "/", label: "工作台", icon: Home },
  { href: "/inspiration", label: "灵感坊", icon: Sparkles },
  { href: "/outline", label: "大纲", icon: Compass },
  { href: "/character", label: "角色", icon: UserRound },
  { href: "/world", label: "世界观", icon: ScrollText },
  { href: "/continuation", label: "续写", icon: FileText },
  { href: "/dialogue", label: "对话", icon: MessageCircleMore },
  { href: "/setting", label: "设定集", icon: BookOpenText },
  { href: "/saved", label: "收藏", icon: BookMarked },
] as const;

function SidebarContent() {
  const pathname = usePathname();
  const collapsed = useNovelStore((state) => state.sidebarCollapsed);

  return (
    <div className="glass-panel glow-ring flex h-full w-full flex-col rounded-2xl border p-3">
      <div className={cn("px-3 pb-3 pt-2", collapsed && "sr-only")}>
        <p className="text-xs uppercase tracking-[0.26em] text-foreground/40">
          Modules
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative overflow-hidden rounded-xl px-3 py-3 text-sm transition",
                isActive
                  ? "bg-primary/14 text-foreground"
                  : "text-foreground/72 hover:-translate-y-0.5 hover:bg-primary/10 hover:text-foreground",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-xl border border-primary/20 bg-linear-to-r from-primary/18 via-cyan-500/10 to-transparent"
                />
              ) : null}
              <span className="relative flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 text-primary transition group-hover:bg-primary/12 group-hover:shadow-[0_0_20px_rgba(109,93,252,0.2)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className={cn(collapsed && "sr-only")}>{item.label}</span>
              </span>
            </Link>
          );
        })}
      </nav>
      <div className={cn("rounded-xl border border-white/10 bg-black/15 p-4 text-foreground", collapsed && "hidden")}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bot className="h-4 w-4 text-primary" />
          AI 写作引擎
        </div>
        <p className="mt-2 text-xs leading-6 text-foreground/55">
          代理路由已预留，填入 DeepSeek API Key 后即可接入生成流。
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const collapsed = useNovelStore((state) => state.sidebarCollapsed);

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 82 : 260 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="hidden shrink-0 lg:block"
      >
        <SidebarContent />
      </motion.aside>
      <div className="fixed bottom-24 right-4 z-20 lg:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button className="rounded-full bg-primary/85 px-5 shadow-[0_0_24px_rgba(139,92,246,0.22)]" />
            }
          >
            <Menu className="mr-2 h-4 w-4" />
            菜单
          </SheetTrigger>
          <SheetContent
            side="left"
            className="border-border bg-popover p-3 text-popover-foreground backdrop-blur-xl"
          >
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
