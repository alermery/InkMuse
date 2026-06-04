"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, FolderOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNovelStore } from "@/lib/store";

export function WelcomeExperience({
  onRandomIdea,
}: {
  onRandomIdea: () => void;
}) {
  const dismissed = useNovelStore((state) => state.welcomeDismissed);
  const dismissWelcome = useNovelStore((state) => state.dismissWelcome);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const text = "InkMuse";
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
        <div className="text-xs text-slate-300">本地优先保存，无需登录。</div>
      </div>
    </motion.section>
  );
}
