"use client";

import type { Editor } from "@tiptap/react";
import { Bold, Italic, List, Quote, Redo2, Undo2 } from "lucide-react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { cn } from "@/lib/utils";

const toolbarItems = [
  {
    key: "bold",
    label: "加粗",
    icon: Bold,
    action: (editor: Editor) => editor.chain().focus().toggleBold().run(),
    active: (editor: Editor) => editor.isActive("bold"),
  },
  {
    key: "italic",
    label: "斜体",
    icon: Italic,
    action: (editor: Editor) => editor.chain().focus().toggleItalic().run(),
    active: (editor: Editor) => editor.isActive("italic"),
  },
  {
    key: "bulletList",
    label: "项目列表",
    icon: List,
    action: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
    active: (editor: Editor) => editor.isActive("bulletList"),
  },
  {
    key: "blockquote",
    label: "引用",
    icon: Quote,
    action: (editor: Editor) => editor.chain().focus().toggleBlockquote().run(),
    active: (editor: Editor) => editor.isActive("blockquote"),
  },
  {
    key: "undo",
    label: "撤销",
    icon: Undo2,
    action: (editor: Editor) => editor.chain().focus().undo().run(),
    active: () => false,
  },
  {
    key: "redo",
    label: "重做",
    icon: Redo2,
    action: (editor: Editor) => editor.chain().focus().redo().run(),
    active: () => false,
  },
] as const;

export function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="mb-3 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/10 p-2">
      {toolbarItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.active(editor);

        return (
          <TooltipButton
            tooltip={item.label}
            key={item.key}
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "rounded-xl border border-transparent bg-transparent text-foreground transition hover:-translate-y-0.5 hover:bg-muted hover:text-foreground hover:shadow-[0_0_18px_rgba(96,165,250,0.14)]",
              isActive && "border-primary/20 bg-primary/10 text-primary hover:text-primary",
            )}
            onClick={() => item.action(editor)}
          >
            <Icon className="h-4 w-4" />
          </TooltipButton>
        );
      })}
    </div>
  );
}
