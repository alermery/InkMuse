"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, CalendarDays, Clock, Flame, Loader2, Save, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CountUp } from "@/components/features/count-up";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { WelcomeExperience } from "@/components/features/welcome-experience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { defaultChapters, defaultNovel } from "@/lib/mock-data";
import { savedEntryFromText, streamDeepSeek } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

const heatmap = Array.from({ length: 49 }, (_, index) => ({
  day: index,
  level: (index * 7 + 3) % 5,
}));

const chartData = [
  { day: "周一", words: 1800, minutes: 54 },
  { day: "周二", words: 2600, minutes: 72 },
  { day: "周三", words: 1200, minutes: 38 },
  { day: "周四", words: 3400, minutes: 96 },
  { day: "周五", words: 2900, minutes: 80 },
  { day: "周六", words: 4200, minutes: 114 },
  { day: "周日", words: 3100, minutes: 88 },
];

function subscribeToClientReady(callback: () => void) {
  const frame = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(frame);
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function WorkspacePage() {
  const apiKey = useNovelStore((state) => state.apiKey);
  const model = useNovelStore((state) => state.model);
  const currentNovel = useNovelStore((state) => state.currentNovel);
  const chapterDraft = useNovelStore((state) => state.chapterDraft);
  const savedEntries = useNovelStore((state) => state.savedEntries);
  const dailyGoal = useNovelStore((state) => state.dailyGoal);
  const weeklyGoal = useNovelStore((state) => state.weeklyGoal);
  const writingMinutes = useNovelStore((state) => state.writingMinutes);
  const setGoals = useNovelStore((state) => state.setGoals);
  const saveEntry = useNovelStore((state) => state.saveEntry);
  const addToast = useNovelStore((state) => state.addToast);
  const addTokenUsage = useNovelStore((state) => state.addTokenUsage);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);
  const [daily, setDaily] = useState(String(dailyGoal));
  const [weekly, setWeekly] = useState(String(weeklyGoal));
  const [recommendation, setRecommendation] = useState("");
  const [queueState, setQueueState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chartsReady = useSyncExternalStore(
    subscribeToClientReady,
    getClientSnapshot,
    getServerSnapshot,
  );
  const autoStarted = useRef(false);

  const wordCount = plainText(chapterDraft).length;
  const dailyProgress = Math.min(100, Math.round((wordCount / dailyGoal) * 100));
  const weeklyProgress = Math.min(100, Math.round(((wordCount * 4) / weeklyGoal) * 100));
  const completed = defaultChapters.filter((chapter) => chapter.status === "已完成").length;

  const words = useMemo(() => {
    const source = plainText(chapterDraft) || "记忆 港城 律师 真相 角色 冲突 设定 记忆 港城";
    const map = new Map<string, number>();
    source
      .replace(/[，。！？、,.!?]/g, " ")
      .split(/\s+/)
      .filter((item) => item.length >= 2)
      .forEach((item) => map.set(item, (map.get(item) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16);
  }, [chapterDraft]);

  const stats = useMemo(
    () => [
      { label: "今日字数", value: wordCount, suffix: "", icon: BookOpen },
      { label: "写作时长", value: writingMinutes, suffix: "m", icon: Clock },
      { label: "效率", value: Math.max(1, Math.round(wordCount / Math.max(1, writingMinutes))), suffix: " 字/分", icon: Flame },
      { label: "收藏素材", value: savedEntries.length, suffix: "", icon: Save },
    ],
    [savedEntries.length, wordCount, writingMinutes],
  );

  async function generateDailyIdea(force = false) {
    if (!force && (recommendation || isLoading)) {
      return;
    }
    setRecommendation("");
    setIsLoading(true);
    setError(null);
    incrementAiCallCount();

    try {
      let next = "";
      await streamDeepSeek({
        apiKey,
        model,
        temperature: 1.2,
        maxTokens: 1200,
        system: "你是小说编辑，请给作者生成一条今日可执行灵感，包含场景、冲突和一句钩子。",
        user: `当前项目：${currentNovel?.title ?? defaultNovel.title}\n类型：${currentNovel?.genre ?? defaultNovel.genre}\n简介：${currentNovel?.synopsis ?? defaultNovel.synopsis}`,
        onQueueState: setQueueState,
        onToken: (token) => {
          next += token;
          addTokenUsage(Math.ceil(token.length / 2));
          setRecommendation(next);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "每日灵感生成失败");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (autoStarted.current) {
      return;
    }

    autoStarted.current = true;
    const timer = window.setTimeout(() => {
      void generateDailyIdea();
    }, 0);

    return () => window.clearTimeout(timer);
  });

  return (
    <AppShell
      title="创作工作台"
      description="集中查看当前项目、今日写作统计、写作目标、最近章节和 AI 每日灵感。"
    >
      <WelcomeExperience onRandomIdea={() => generateDailyIdea(true)} />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="grid gap-3 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-panel hover-lift rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </p>
                </div>
              );
            })}
          </section>
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="glass-panel rounded-lg border p-4">
              <h2 className="text-sm font-semibold">每日字数</h2>
              <div className="mt-4 h-56 min-h-56 min-w-0">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis dataKey="day" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="words" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
            <div className="glass-panel rounded-lg border p-4">
              <h2 className="text-sm font-semibold">写作时长</h2>
              <div className="mt-4 h-56 min-h-56 min-w-0">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis dataKey="day" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="minutes" stroke="#06b6d4" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
          </section>
          <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="glass-panel rounded-lg border p-4">
              <h2 className="text-sm font-semibold">章节完成</h2>
              <div className="mt-4 h-56 min-h-56 min-w-0">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "已完成", value: completed },
                          { name: "未完成", value: defaultChapters.length - completed },
                        ]}
                        innerRadius={58}
                        outerRadius={82}
                        dataKey="value"
                      >
                        <Cell fill="#06b6d4" />
                        <Cell fill="rgba(148,163,184,0.22)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
            <div className="glass-panel rounded-lg border p-4">
              <h2 className="text-sm font-semibold">词频分析</h2>
              <div className="mt-4 flex min-h-56 flex-wrap content-start gap-3">
                {words.map(([word, count], index) => (
                  <span
                    key={word}
                    className="rounded-full border border-white/10 bg-white/8 px-3 py-1"
                    style={{ fontSize: `${12 + Math.min(18, count * 4 + index)}px` }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </section>
          <section className="glass-panel rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">写作日历</h2>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {heatmap.map((day) => (
                <div
                  key={day.day}
                  className="aspect-square rounded-sm border border-white/10"
                  style={{ backgroundColor: `rgba(6, 182, 212, ${0.08 + day.level * 0.16})` }}
                />
              ))}
            </div>
          </section>
          <section className="glass-panel rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">最近章节</h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {defaultChapters.map((chapter) => (
                <article key={chapter.id} className="hover-lift rounded-lg border border-white/10 bg-black/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{chapter.title}</p>
                    <Badge variant="secondary">{chapter.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{chapter.wordCount.toLocaleString()} 字</p>
                </article>
              ))}
            </div>
          </section>
        </div>
        <div className="space-y-5">
          <section className="glass-panel rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">写作目标</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Input value={daily} onChange={(event) => setDaily(event.target.value)} className="border-white/10 bg-black/10" />
              <Input value={weekly} onChange={(event) => setWeekly(event.target.value)} className="border-white/10 bg-black/10" />
            </div>
            <Button
              className="mt-3 w-full"
              variant="secondary"
              onClick={() => {
                setGoals(Number(daily), Number(weekly));
                addToast({ title: "写作目标已更新", type: "success" });
              }}
            >
              保存目标
            </Button>
            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>每日</span>
                  <span>{dailyProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${dailyProgress}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>每周</span>
                  <span>{weeklyProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-300" style={{ width: `${weeklyProgress}%` }} />
                </div>
              </div>
            </div>
          </section>
          <StreamResultPanel
            title="AI 每日灵感推荐"
            content={recommendation}
            isLoading={isLoading}
            error={error}
            queueState={queueState}
            onSave={
              recommendation
                ? () => {
                    saveEntry(savedEntryFromText("工作台", "每日灵感", recommendation, ["每日灵感"]));
                    addToast({ title: "每日灵感已保存", type: "success" });
                  }
                : undefined
            }
          />
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              正在准备今日推荐
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              当前项目：{currentNovel?.title ?? defaultNovel.title}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
