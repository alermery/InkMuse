"use client";

import { useRouter } from "next/navigation";
import {
  BookOpenText,
  Compass,
  FileText,
  Home,
  MessageCircleMore,
  Search,
  Settings2,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useNovelStore } from "@/lib/store";

const pages = [
  { href: "/", label: "工作台", icon: Home },
  { href: "/inspiration", label: "灵感坊", icon: Sparkles },
  { href: "/outline", label: "大纲规划", icon: Compass },
  { href: "/character", label: "角色设计", icon: UserRound },
  { href: "/world", label: "世界观", icon: BookOpenText },
  { href: "/continuation", label: "智能续写", icon: FileText },
  { href: "/dialogue", label: "对话生成", icon: MessageCircleMore },
  { href: "/setting", label: "设定集", icon: Search },
] as const;

export function CommandPalette() {
  const router = useRouter();
  const open = useNovelStore((state) => state.commandOpen);
  const setOpen = useNovelStore((state) => state.setCommandOpen);
  const setShortcutOpen = useNovelStore((state) => state.setShortcutOpen);
  const toggleSidebar = useNovelStore((state) => state.toggleSidebar);

  function run(action: () => void) {
    action();
    setOpen(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="命令面板">
      <Command className="glass-card border-0">
        <CommandInput placeholder="搜索页面、操作或设定..." />
        <CommandList>
          <CommandEmpty>没有匹配的命令</CommandEmpty>
          <CommandGroup heading="页面跳转">
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <CommandItem key={page.href} onSelect={() => run(() => router.push(page.href))}>
                  <Icon className="h-4 w-4" />
                  {page.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="操作">
            <CommandItem onSelect={() => run(toggleSidebar)}>
              <Settings2 className="h-4 w-4" />
              切换侧边栏
              <CommandShortcut>Ctrl B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(() => setShortcutOpen(true))}>
              <Settings2 className="h-4 w-4" />
              显示快捷键
              <CommandShortcut>Ctrl /</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
