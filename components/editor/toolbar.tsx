"use client";

import type { Editor } from "@tiptap/react";
import { Bold, Italic, List, Quote, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const toolbarItems = [
  {
    key: "bold",
    icon: Bold,
    action: (editor: Editor) => editor.chain().focus().toggleBold().run(),
    active: (editor: Editor) => editor.isActive("bold"),
  },
  {
    key: "italic",
    icon: Italic,
    action: (editor: Editor) => editor.chain().focus().toggleItalic().run(),
    active: (editor: Editor) => editor.isActive("italic"),
  },
  {
    key: "bulletList",
    icon: List,
    action: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
    active: (editor: Editor) => editor.isActive("bulletList"),
  },
  {
    key: "blockquote",
    icon: Quote,
    action: (editor: Editor) => editor.chain().focus().toggleBlockquote().run(),
    active: (editor: Editor) => editor.isActive("blockquote"),
  },
  {
    key: "undo",
    icon: Undo2,
    action: (editor: Editor) => editor.chain().focus().undo().run(),
    active: () => false,
  },
  {
    key: "redo",
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
          <Button
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
          </Button>
        );
      })}
    </div>
  );
}
