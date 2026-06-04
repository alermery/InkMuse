"use client";

import JSZip from "jszip";
import type { EncyclopediaEntry, SavedEntry } from "@/types";

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/p>/g, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function exportMarkdown(filename: string, title: string, content: string) {
  const markdown = `# ${title}\n\n${stripHtml(content)}`;
  downloadBlob(`${filename}.md`, new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
}

export function exportTxt(filename: string, content: string) {
  downloadBlob(`${filename}.txt`, new Blob([stripHtml(content)], { type: "text/plain;charset=utf-8" }));
}

export async function exportNovelZip({
  title,
  chapterDraft,
  savedEntries,
  encyclopediaEntries,
}: {
  title: string;
  chapterDraft: string;
  savedEntries: SavedEntry[];
  encyclopediaEntries: EncyclopediaEntry[];
}) {
  const zip = new JSZip();
  zip.file("manuscript.md", `# ${title}\n\n${stripHtml(chapterDraft)}`);
  zip.file(
    "workspace-saved.json",
    JSON.stringify(savedEntries, null, 2),
  );
  zip.file(
    "encyclopedia.json",
    JSON.stringify(encyclopediaEntries, null, 2),
  );

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(`${title || "NovelMuse"}.zip`, blob);
}
