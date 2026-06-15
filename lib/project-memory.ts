import type {
  EncyclopediaEntry,
  OutlineMemoryNode,
  ProjectChapterMemory,
  ProjectMemorySnapshot,
  SavedEntry,
} from "@/types";

const PROJECT_MEMORY_STORAGE = "inkmuse-project-memory";

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function outlineToLines(nodes: OutlineMemoryNode[], level = 0): string[] {
  return nodes.flatMap((node) => [
    `${"  ".repeat(level)}- ${node.title}`,
    ...outlineToLines(node.children ?? [], level + 1),
  ]);
}

function summarizeEntries(entries: SavedEntry[], limit = 8) {
  return entries
    .slice(0, limit)
    .map((entry) => `- [${entry.source}] ${entry.title}: ${stripHtml(entry.content).slice(0, 160)}`)
    .join("\n");
}

function summarizeSettings(entries: EncyclopediaEntry[], limit = 12) {
  return entries
    .slice(0, limit)
    .map((entry) => `- [${entry.category}] ${entry.title}: ${stripHtml(entry.content).slice(0, 140)}`)
    .join("\n");
}

function summarizeChapters(chapters: ProjectChapterMemory[], limit = 6) {
  const recent = [...chapters].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-limit);
  return recent
    .map((chapter, index) => `- 第${index + 1}章《${chapter.title}》：${stripHtml(chapter.content).slice(0, 220)}`)
    .join("\n");
}

export function buildProjectMemory(snapshot: ProjectMemorySnapshot) {
  const outline = outlineToLines(snapshot.outlineNodes).join("\n");
  const chapters = summarizeChapters(snapshot.chapters);
  const settings = summarizeSettings(snapshot.encyclopediaEntries);
  const saved = summarizeEntries(snapshot.savedEntries);

  return [
    `项目名：${snapshot.title || "未命名项目"}`,
    `类型：${snapshot.genre || "未设置"}`,
    `简介：${snapshot.synopsis || "未设置"}`,
    "",
    "大纲结构：",
    outline || "- 暂无大纲",
    "",
    "最近章节：",
    chapters || "- 暂无章节",
    "",
    "设定集：",
    settings || "- 暂无设定",
    "",
    "收藏素材：",
    saved || "- 暂无收藏",
    "",
    "当前草稿：",
    stripHtml(snapshot.chapterDraft).slice(-2500) || "暂无草稿",
  ].join("\n");
}

export function buildProjectAnalysisPrompt(snapshot: ProjectMemorySnapshot) {
  return [
    "请基于整本小说上下文做结构化分析，输出 Markdown。",
    "至少覆盖以下部分：",
    "1. 小说整体概况",
    "2. 当前主线与支线推进情况",
    "3. 人物与设定一致性风险",
    "4. 已有大纲与正文的脱节点",
    "5. 后续 3 章最值得推进的方向",
    "",
    buildProjectMemory(snapshot),
  ].join("\n");
}

export function enrichUserPromptWithProjectMemory(userPrompt: string, snapshot: ProjectMemorySnapshot | null) {
  if (!snapshot) {
    return userPrompt;
  }

  return [
    "以下是整本小说的长期记忆，请优先保持一致性，不要只依据当前局部输入生成。",
    "",
    buildProjectMemory(snapshot),
    "",
    "当前任务：",
    userPrompt,
  ].join("\n");
}

export function saveProjectMemory(snapshot: ProjectMemorySnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECT_MEMORY_STORAGE, JSON.stringify(snapshot));
}

export function loadProjectMemory() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROJECT_MEMORY_STORAGE);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ProjectMemorySnapshot;
  } catch {
    return null;
  }
}
