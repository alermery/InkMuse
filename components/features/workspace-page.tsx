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
import { BookOpen, CalendarDays, Clock, Flame, Loader2, RefreshCw, Save, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CountUp } from "@/components/features/count-up";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { WelcomeExperience } from "@/components/features/welcome-experience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultNovel } from "@/lib/mock-data";
import { savedEntryFromText, streamDeepSeek } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const weeklyChartMargin = { top: 10, right: 30, bottom: 20, left: -28 };
const weeklyXAxisProps = {
  dataKey: "day",
  stroke: "#94a3b8",
  interval: 0,
  tickMargin: 8,
  minTickGap: 0,
  tick: { fontSize: 12 },
} as const;
const weeklyYAxisProps = {
  stroke: "#94a3b8",
  width: 30,
  tickMargin: 4,
  tick: { fontSize: 12 },
} as const;

const DAILY_IDEA_SESSION_KEY = "inkmuse:workspace:daily-idea";

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

function weekKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildWeeklyChartData(dailyStats: { date: string; words: number; minutes: number }[]) {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);

  return weekDays.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const stat = dailyStats.find((item) => item.date === weekKey(date));

    return {
      day,
      words: stat?.words ?? 0,
      minutes: stat?.minutes ?? 0,
    };
  });
}

function buildWritingCalendarData(
  dailyStats: { date: string; words: number; minutes: number }[],
  dailyGoal: number,
) {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);
  start.setDate(today.getDate() - 34);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = weekKey(date);
    const stat = dailyStats.find((item) => item.date === key);
    const words = stat?.words ?? 0;
    const minutes = stat?.minutes ?? 0;
    const progress = dailyGoal > 0 ? Math.min(100, Math.round((words / dailyGoal) * 100)) : 0;
    const isToday = key === weekKey(end);

    return {
      key,
      date,
      day: date.getDate(),
      month: date.getMonth() + 1,
      words,
      minutes,
      progress,
      isToday,
    };
  });
}

export function WorkspacePage() {
  const provider = useNovelStore((state) => state.provider);
  const apiBaseUrl = useNovelStore((state) => state.apiBaseUrl);
  const apiKey = useNovelStore((state) => state.apiKey);
  const model = useNovelStore((state) => state.model);
  const currentNovel = useNovelStore((state) => state.currentNovel);
  const chapterDraft = useNovelStore((state) => state.chapterDraft);
  const savedEntries = useNovelStore((state) => state.savedEntries);
  const dailyStats = useNovelStore((state) => state.dailyStats);
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
  const [recommendation, setRecommendation] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.sessionStorage.getItem(DAILY_IDEA_SESSION_KEY) ?? "",
  );
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
  const hasWritingData = wordCount > 0 || writingMinutes > 0;
  const chartData = useMemo(() => buildWeeklyChartData(dailyStats), [dailyStats]);
  const calendarData = useMemo(
    () => buildWritingCalendarData(dailyStats, dailyGoal),
    [dailyGoal, dailyStats],
  );

  const words = useMemo(() => {
    const source = plainText(chapterDraft);
    if (!source) {
      return [];
    }
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
      { label: "效率", value: writingMinutes > 0 ? Math.round(wordCount / writingMinutes) : 0, suffix: " 字/分", icon: Flame },
      { label: "收藏素材", value: savedEntries.length, suffix: "", icon: Save },
    ],
    [savedEntries.length, wordCount, writingMinutes],
  );

  async function generateDailyIdea(force = false) {
    if (!force && (recommendation || isLoading)) {
      return;
    }
    if (force) {
      window.sessionStorage.removeItem(DAILY_IDEA_SESSION_KEY);
    }
    setRecommendation("");
    setIsLoading(true);
    setError(null);
    incrementAiCallCount();

    try {
      let next = "";
      await streamDeepSeek({
        provider,
        apiBaseUrl,
        apiKey,
        model,
        useProjectMemory: true,
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
      if (next) {
        window.sessionStorage.setItem(DAILY_IDEA_SESSION_KEY, next);
      }
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
    if (window.sessionStorage.getItem(DAILY_IDEA_SESSION_KEY)) {
      return;
    }

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
                {chartsReady && hasWritingData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={weeklyChartMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis {...weeklyXAxisProps} />
                      <YAxis {...weeklyYAxisProps} />
                      <Tooltip />
                      <Bar dataKey="words" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    暂无写作统计
                  </div>
                )}
              </div>
            </div>
            <div className="glass-panel rounded-lg border p-4">
              <h2 className="text-sm font-semibold">写作时长</h2>
              <div className="mt-4 h-56 min-h-56 min-w-0">
                {chartsReady && hasWritingData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={weeklyChartMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis {...weeklyXAxisProps} />
                      <YAxis {...weeklyYAxisProps} />
                      <Tooltip />
                        <Line type="monotone" dataKey="minutes" stroke="#06b6d4" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    暂无时长记录
                  </div>
                )}
              </div>
            </div>
          </section>
          <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="glass-panel rounded-lg border p-4">
              <h2 className="text-sm font-semibold">章节完成</h2>
              <div className="mt-4 h-56 min-h-56 min-w-0">
                {chartsReady && wordCount > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "已写", value: wordCount },
                          { name: "目标差额", value: Math.max(1, dailyGoal - wordCount) },
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
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    开始写作后显示进度
                  </div>
                )}
              </div>
            </div>
            <div className="glass-panel rounded-lg border p-4">
              <h2 className="text-sm font-semibold">词频分析</h2>
              <div className="mt-4 flex min-h-56 flex-wrap content-start gap-3">
                {words.length ? words.map(([word, count], index) => (
                  <span
                    key={word}
                    className="rounded-full border border-white/10 bg-white/8 px-3 py-1"
                    style={{ fontSize: `${12 + Math.min(18, count * 4 + index)}px` }}
                  >
                    {word}
                  </span>
                )) : (
                  <div className="flex min-h-40 flex-1 items-center justify-center text-sm text-muted-foreground">
                    暂无可分析文本
                  </div>
                )}
              </div>
            </div>
          </section>
          <section className="glass-panel rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">写作日历</h2>
              </div>
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                <span>近 5 周</span>
                <span>今日 {wordCount.toLocaleString()} 字</span>
                <span>目标 {dailyGoal.toLocaleString()} 字/日</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
              {weekDays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarData.map((day) => (
                <div
                  key={day.key}
                  title={`${day.month}/${day.day} · ${day.words} 字 · ${day.minutes} 分钟 · ${day.progress}%`}
                  className={[
                    "min-h-24 rounded-xl border p-2 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
                    day.isToday ? "border-primary/45 ring-2 ring-primary/15" : "border-white/10",
                    day.words ? "bg-primary/10" : "bg-muted/30",
                  ].join(" ")}
                  style={{
                    backgroundColor: day.words
                      ? `rgba(6, 182, 212, ${0.12 + Math.min(0.5, day.progress / 160)})`
                      : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{day.day}</span>
                    {day.isToday ? (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                        今日
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-1 text-left text-[11px] text-muted-foreground">
                    <p>{day.words ? `${day.words.toLocaleString()} 字` : "未记录"}</p>
                    <p>{day.minutes ? `${day.minutes} 分钟` : "暂无时长"}</p>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-background/60">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${day.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="glass-panel rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">最近章节</h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/10 p-4 text-sm text-muted-foreground">
                暂无章节。保存或导入章节后会在这里显示快捷入口。
              </div>
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
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => generateDailyIdea(true)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            换一条每日灵感
          </Button>
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
