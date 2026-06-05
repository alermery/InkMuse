"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, GripVertical, Loader2, Plus, Wand2 } from "lucide-react";
import { ModuleFormShell } from "@/components/features/module-form-shell";
import { SavedImportPanel } from "@/components/features/saved-import-panel";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { Button } from "@/components/ui/button";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { savedEntryFromText, streamDeepSeek } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";
import { usePersistedState } from "@/lib/use-persisted-state";

type OutlineNode = {
  id: string;
  title: string;
  children?: OutlineNode[];
};

const initialNodes: OutlineNode[] = [
  {
    id: "core",
    title: "核心设定",
    children: [
      { id: "world", title: "世界观" },
      { id: "power", title: "力量体系" },
      { id: "conflict", title: "核心冲突" },
    ],
  },
  {
    id: "arc",
    title: "角色线",
    children: [
      { id: "hero", title: "主角成长线" },
      { id: "love", title: "感情线" },
      { id: "rival", title: "宿敌线" },
    ],
  },
  {
    id: "volumes",
    title: "卷大纲",
    children: [
      {
        id: "volume-1",
        title: "第一卷：待命名",
        children: [
          { id: "chapter-1", title: "第1章：待规划" },
          { id: "chapter-2", title: "第2章：待规划" },
        ],
      },
    ],
  },
];

function renderPlain(nodes: OutlineNode[], depth = 0): string {
  return nodes
    .map((node) => `${"  ".repeat(depth)}- ${node.title}${node.children ? `\n${renderPlain(node.children, depth + 1)}` : ""}`)
    .join("\n");
}

function renameNode(nodes: OutlineNode[], id: string, title: string): OutlineNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, title };
    }

    if (node.children) {
      return { ...node, children: renameNode(node.children, id, title) };
    }

    return node;
  });
}

function collectNodeIds(nodes: OutlineNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...(node.children ? collectNodeIds(node.children) : [])]);
}

function cleanOutlineTitle(value: string) {
  return value
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)、]\s*/, "")
    .replace(/^第[一二三四五六七八九十百千万\d]+[章节卷部][：:、\s]*/, (match) => match.trim())
    .replace(/\*\*|__|`/g, "")
    .trim();
}

function lineDepth(line: string) {
  const leading = line.match(/^\s*/)?.[0] ?? "";
  const heading = line.match(/^#{1,6}\s+/);

  if (heading) {
    return heading[0].trim().length - 1;
  }

  return Math.floor(leading.replace(/\t/g, "  ").length / 2);
}

function parseOutlineContent(content: string): OutlineNode[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/g, ""))
    .filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed &&
        !trimmed.startsWith(">") &&
        !trimmed.startsWith("```") &&
        (/^#{1,6}\s+/.test(trimmed) ||
          /^[-*+]\s+/.test(trimmed) ||
          /^\d+[.)、]\s+/.test(trimmed) ||
          /^第[一二三四五六七八九十百千万\d]+[章节卷部]/.test(trimmed))
      );
    });

  const roots: OutlineNode[] = [];
  const stack: { depth: number; node: OutlineNode }[] = [];

  lines.forEach((line, index) => {
    const title = cleanOutlineTitle(line.trim());
    if (!title || title.length > 80) {
      return;
    }

    const depth = lineDepth(line);
    const node: OutlineNode = {
      id: `imported-${Date.now()}-${index}`,
      title,
      children: [],
    };

    while (stack.length && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.node;
    if (parent) {
      parent.children ??= [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    stack.push({ depth, node });
  });

  function prune(nodes: OutlineNode[]): OutlineNode[] {
    return nodes.map((node) => {
      const children = node.children ? prune(node.children) : [];
      return children.length ? { ...node, children } : { id: node.id, title: node.title };
    });
  }

  return prune(roots);
}

function OutlineBranch({
  node,
  expanded,
  onToggle,
  onAction,
  onRename,
}: {
  node: OutlineNode;
  expanded: string[];
  onToggle: (id: string) => void;
  onAction: (node: OutlineNode, action: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const isExpanded = expanded.includes(node.id);
  const hasChildren = Boolean(node.children?.length);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(node.title);

  function commitRename() {
    const nextTitle = draftTitle.trim();
    if (nextTitle && nextTitle !== node.title) {
      onRename(node.id, nextTitle);
    } else {
      setDraftTitle(node.title);
    }
    setIsEditing(false);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/10 p-2">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-foreground/35" />
        <TooltipButton tooltip={isExpanded ? "收起节点" : "展开节点"} size="icon-xs" variant="ghost" onClick={() => onToggle(node.id)}>
          {hasChildren && isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TooltipButton>
        {isEditing ? (
          <Input
            value={draftTitle}
            autoFocus
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitRename();
              }
              if (event.key === "Escape") {
                setDraftTitle(node.title);
                setIsEditing(false);
              }
            }}
            className="h-7 min-w-0 flex-1 border-primary/30 bg-background/70"
          />
        ) : (
          <button
            type="button"
            className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-sm font-medium transition hover:bg-primary/8 hover:text-primary"
            title="双击或点击可重命名"
            onClick={() => setIsEditing(true)}
          >
            {node.title}
          </button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onAction(node, "扩展此章节")}>
          扩展
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction(node, "重写此段落")}>
          重写
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction(node, "添加转折")}>
          转折
        </Button>
      </div>
      {hasChildren && isExpanded ? (
        <div className="mt-2 space-y-2 pl-6">
          {node.children?.map((child) => (
            <OutlineBranch
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onAction={onAction}
              onRename={onRename}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function OutlinePage() {
  const apiKey = useNovelStore((state) => state.apiKey);
  const model = useNovelStore((state) => state.model);
  const saveEntry = useNovelStore((state) => state.saveEntry);
  const addToast = useNovelStore((state) => state.addToast);
  const addTokenUsage = useNovelStore((state) => state.addTokenUsage);
  const appendToDraft = useNovelStore((state) => state.appendToDraft);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);
  const [concept, setConcept] = usePersistedState("inkmuse:outline:concept", "");
  const [genre, setGenre] = usePersistedState("inkmuse:outline:genre", "");
  const [targetWords, setTargetWords] = usePersistedState("inkmuse:outline:targetWords", "");
  const [nodes, setNodes] = usePersistedState("inkmuse:outline:nodes", initialNodes);
  const [expanded, setExpanded] = usePersistedState("inkmuse:outline:expanded", ["core", "arc", "volumes", "volume-1"]);
  const [output, setOutput] = usePersistedState("inkmuse:outline:output", "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queueState, setQueueState] = useState("");

  function toggle(id: string) {
    setExpanded((value) => (value.includes(id) ? value.filter((item) => item !== id) : [...value, id]));
  }

  function handleRenameNode(id: string, title: string) {
    setNodes((value) => renameNode(value, id, title));
    addToast({ title: "章节名已更新", type: "success" });
  }

  async function generateOutline() {
    setOutput("");
    setError(null);
    setIsLoading(true);
    incrementAiCallCount();

    try {
      let next = "";
      await streamDeepSeek({
        apiKey,
        model,
        temperature: 0.8,
        maxTokens: 4000,
        system: "你是长篇小说结构编辑。请根据概念生成完整大纲，包含核心设定、世界观、力量体系、核心冲突、角色线、卷大纲与章节推进。使用清晰 Markdown 层级。",
        user: `一句话概念：${concept}\n类型：${genre}\n预计正文总字数：${targetWords}\n请生成可直接执行的长篇大纲，并让卷数、章节数和单章字数规划能匹配预计总字数。`,
        onQueueState: setQueueState,
        onToken: (token) => {
          next += token;
          addTokenUsage(Math.ceil(token.length / 2));
          setOutput(next);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function nodeAction(node: OutlineNode, action: string) {
    setOutput("");
    setError(null);
    setIsLoading(true);
    incrementAiCallCount();

    try {
      let next = "";
      await streamDeepSeek({
        apiKey,
        model,
        temperature: 0.8,
        maxTokens: 2500,
        system: "你是小说大纲编辑，擅长局部扩写、重写和添加转折。",
        user: `当前大纲：\n${renderPlain(nodes)}\n\n请对节点「${node.title}」执行：${action}。输出可替换到大纲中的内容。`,
        onQueueState: setQueueState,
        onToken: (token) => {
          next += token;
          addTokenUsage(Math.ceil(token.length / 2));
          setOutput(next);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function generateChapterContent() {
    setOutput("");
    setError(null);
    setIsLoading(true);
    incrementAiCallCount();

    try {
      let next = "";
      await streamDeepSeek({
        apiKey,
        model,
        temperature: 0.9,
        maxTokens: 3500,
        system:
          "你是长篇小说正文写作助手。请根据大纲生成可直接放入章节草稿的正文，要求有场景、行动、冲突、人物心理和结尾钩子，不要只写概要。",
        user: `小说类型：${genre || "未设置"}\n一句话概念：${concept || "未设置"}\n目标总字数：${targetWords || "未设置"}\n\n当前大纲树：\n${renderPlain(nodes)}\n\n请选择当前大纲中最适合展开的第一个待写章节，生成一章正文草稿。正文建议 1800-2500 字，开头要有明确场景，结尾留下下一章悬念。`,
        onQueueState: setQueueState,
        onToken: (token) => {
          next += token;
          addTokenUsage(Math.ceil(token.length / 2));
          setOutput(next);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "章节正文生成失败");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ModuleFormShell
      title="大纲规划"
      description="从一句话概念生成完整小说大纲，并支持对任意节点进行 AI 扩展、重写、添加转折和章节生成。"
      left={
        <section className="glass-panel rounded-lg border p-4">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">一句话概念</p>
              <Textarea value={concept} onChange={(event) => setConcept(event.target.value)} className="min-h-24 border-white/10 bg-black/10" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">类型</p>
              <Input value={genre} onChange={(event) => setGenre(event.target.value)} className="border-white/10 bg-black/10" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">预计字数</p>
              <Input value={targetWords} onChange={(event) => setTargetWords(event.target.value)} className="border-white/10 bg-black/10" />
            </div>
            <Button className="w-full" onClick={generateOutline} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              生成完整大纲
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() =>
                setNodes((value) => [
                  ...value,
                  { id: `custom-${Date.now()}`, title: "新卷：待规划", children: [] },
                ])
              }
            >
              <Plus className="h-4 w-4" />
              添加节点
            </Button>
            <SavedImportPanel
              onImport={(entry) => {
                const parsedNodes = parseOutlineContent(entry.content);
                setOutput(entry.content);
                if (parsedNodes.length) {
                  setNodes(parsedNodes);
                  setExpanded(collectNodeIds(parsedNodes));
                  addToast({ title: `已解析 ${parsedNodes.length} 个大纲节点`, type: "success" });
                  return;
                }
                addToast({ title: "已导入收藏，但未识别到可解析的大纲层级", type: "info" });
              }}
            />
          </div>
        </section>
      }
      right={
        <div className="space-y-5">
          <section className="glass-panel rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">大纲树</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={generateChapterContent}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                生成章节内容
              </Button>
            </div>
            <div className="space-y-2">
              {nodes.map((node) => (
                <OutlineBranch
                  key={node.id}
                  node={node}
                  expanded={expanded}
                  onToggle={toggle}
                  onAction={nodeAction}
                  onRename={handleRenameNode}
                />
              ))}
            </div>
          </section>
          <StreamResultPanel
            title="AI 大纲编辑"
            content={output}
            isLoading={isLoading}
            error={error}
            queueState={queueState}
            targetWords={targetWords}
            onSave={
              output
                ? () =>
                    {
                      saveEntry(
                      savedEntryFromText("大纲", "大纲规划结果", output, [
                        genre,
                        targetWords,
                      ]),
                    );
                      addToast({ title: "大纲已保存", type: "success" });
                    }
                : undefined
            }
            onCopy={output ? () => navigator.clipboard.writeText(output) : undefined}
          />
          <Button variant="secondary" disabled={!output} onClick={() => appendToDraft(output)}>
            <Plus className="h-4 w-4" />
            插入当前章节草稿
          </Button>
        </div>
      }
    />
  );
}
