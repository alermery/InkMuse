"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "@/components/editor/toolbar";
import { useNovelStore } from "@/lib/store";

export function NovelEditor({ className }: { className?: string }) {
  const chapterDraft = useNovelStore((state) => state.chapterDraft);
  const setChapterDraft = useNovelStore((state) => state.setChapterDraft);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          "从这里开始落笔。可以先写一个场景、一句对白，或一个章节标题。",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: chapterDraft,
    editorProps: {
      attributes: {
        class: "serif-body",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setChapterDraft(currentEditor.getHTML());
    },
  });

  return (
    <div className={className ? `prose-editor ${className}` : "prose-editor"}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
