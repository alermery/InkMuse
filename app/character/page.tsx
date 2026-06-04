"use client";

import { useState } from "react";
import { Loader2, MessageCircle, UserRound, Wand2 } from "lucide-react";
import { ModuleFormShell } from "@/components/features/module-form-shell";
import { OptionChips } from "@/components/features/option-chips";
import { StreamResultPanel } from "@/components/features/stream-result-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { savedEntryFromText, settingEntryFromText, streamDeepSeek } from "@/lib/ai-stream";
import { useNovelStore } from "@/lib/store";

const roles = ["主角", "配角", "反派", "路人"];
const traitSeeds = ["克制", "偏执", "温柔", "毒舌", "高傲", "敏锐", "迟钝", "危险", "理想主义"];

export default function CharacterPage() {
  const apiKey = useNovelStore((state) => state.apiKey);
  const saveEntry = useNovelStore((state) => state.saveEntry);
  const saveSetting = useNovelStore((state) => state.saveSetting);
  const incrementAiCallCount = useNovelStore((state) => state.incrementAiCallCount);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [identity, setIdentity] = useState("");
  const [role, setRole] = useState(["主角"]);
  const [traits, setTraits] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [profile, setProfile] = useState("");
  const [interview, setInterview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [interviewing, setInterviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateProfile() {
    setProfile("");
    setError(null);
    setIsLoading(true);
    incrementAiCallCount();

    try {
      let output = "";
      await streamDeepSeek({
        apiKey,
        system: "你是角色设计顾问。请创建丰满立体的角色档案，包含基础信息、性格标签、小传、核心动机、内心恐惧、说话风格示例和关系图谱建议。",
        user: `姓名：${name}\n年龄：${age}\n性别：${gender}\n身份：${identity}\n角色定位：${role[0]}\n性格标签：${traits.join("、")}`,
        onToken: (token) => {
          output += token;
          setProfile(output);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "角色生成失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function askCharacter() {
    setInterview("");
    setError(null);
    setInterviewing(true);
    incrementAiCallCount();

    try {
      let output = "";
      await streamDeepSeek({
        apiKey,
        system: `你正在扮演小说角色「${name}」。必须保持角色身份、性格和说话风格，用第一人称回答，不要跳出角色。`,
        user: `角色档案：${profile || `${identity}，${role[0]}，性格：${traits.join("、")}`}\n问题：${question}`,
        temperature: 0.95,
        onToken: (token) => {
          output += token;
          setInterview(output);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "角色面试失败");
    } finally {
      setInterviewing(false);
    }
  }

  return (
    <ModuleFormShell
      title="角色设计"
      description="创建角色档案、生成台词风格，并通过角色面试测试人物一致性。"
      left={
        <section className="glass-panel rounded-lg border p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="姓名" className="border-white/10 bg-black/10" />
              <Input value={age} onChange={(event) => setAge(event.target.value)} placeholder="年龄" className="border-white/10 bg-black/10" />
              <Input value={gender} onChange={(event) => setGender(event.target.value)} placeholder="性别" className="border-white/10 bg-black/10" />
              <Input value={identity} onChange={(event) => setIdentity(event.target.value)} placeholder="身份" className="border-white/10 bg-black/10" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">角色定位</p>
              <OptionChips options={roles} value={role} onChange={setRole} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">性格标签</p>
              <OptionChips options={traitSeeds} value={traits} onChange={setTraits} multi />
            </div>
            <Button className="w-full" onClick={generateProfile} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              生成角色档案
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() =>
                setTraits((value) =>
                  Array.from(new Set([...value, "矛盾感", "秘密", "强目标"])),
                )
              }
            >
              AI 性格标签
            </Button>
          </div>
        </section>
      }
      right={
        <div className="space-y-5">
          <section className="glass-panel rounded-lg border p-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />
              <span>角色库为空。生成并保存角色档案后会在这里形成角色资料。</span>
            </div>
          </section>
          <StreamResultPanel
            title="角色档案"
            content={profile}
            isLoading={isLoading}
            error={error}
            onSave={
              profile
                ? () => {
                    saveEntry(savedEntryFromText("角色", `${name} 角色档案`, profile, [role[0], ...traits]));
                    saveSetting(settingEntryFromText("角色", name, profile, [role[0], ...traits]));
                  }
                : undefined
            }
          />
          <section className="glass-panel rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">角色面试</h2>
            </div>
            <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} className="mt-3 min-h-20 border-white/10 bg-black/10" />
            <Button className="mt-3" onClick={askCharacter} disabled={interviewing}>
              {interviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              提问
            </Button>
          </section>
          <StreamResultPanel
            title="角色回答"
            content={interview}
            isLoading={interviewing}
            error={null}
            onSave={interview ? () => saveEntry(savedEntryFromText("角色", `${name} 面试`, interview, ["角色面试"])) : undefined}
          />
        </div>
      }
    />
  );
}
