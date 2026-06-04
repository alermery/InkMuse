"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, FolderOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNovelStore } from "@/lib/store";

const features = ["流式 AI 写作", "角色面试", "设定集提取", "ZIP 导出", "命令面板"];

export function WelcomeExperience({
  onRandomIdea,
}: {
  onRandomIdea: () => void;
}) {
  const dismissed = useNovelStore((state) => state.welcomeDismissed);
  const dismissWelcome = useNovelStore((state) => state.dismissWelcome);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const text = "NovelMuse";
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, 95);

    return () => window.clearInterval(timer);
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="gradient-flow relative min-h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#0a0a1a,#1a1a2e,#16213e,#0a0a1a)] p-8"
    >
      <div className="relative z-10 flex min-h-[460px] flex-col justify-between">
        <div>
          <p className="text-sm text-cyan-200/80">AI 小说灵感与辅助写作助手</p>
          <h1 className="mt-4 text-5xl font-semibold text-white md:text-7xl">
            {typed}
            <span className="stream-cursor" />
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
            从一个灵感到完整长篇，把大纲、角色、世界观、续写和设定管理放在同一个创作空间里。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Button
            className="h-24 justify-start rounded-xl bg-white/10 p-5 text-left text-white hover:bg-white/15"
            onClick={() => {
              dismissWelcome();
              onRandomIdea();
            }}
          >
            <Sparkles className="mr-3 h-5 w-5 text-cyan-200" />
            给我一个灵感
          </Button>
          <Button
            className="h-24 justify-start rounded-xl bg-white/10 p-5 text-left text-white hover:bg-white/15"
            onClick={dismissWelcome}
          >
            <BookOpen className="mr-3 h-5 w-5 text-cyan-200" />
            开始新故事
          </Button>
          <Button
            className="h-24 justify-start rounded-xl bg-white/10 p-5 text-left text-white hover:bg-white/15"
            onClick={dismissWelcome}
          >
            <FolderOpen className="mr-3 h-5 w-5 text-cyan-200" />
            继续创作
          </Button>
        </div>
        <div className="flex gap-3 overflow-hidden text-xs text-slate-300">
          {features.map((feature) => (
            <motion.span
              key={feature}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1"
            >
              {feature}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
