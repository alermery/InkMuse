import type {
  Chapter,
  Character,
  InspirationEntry,
  Novel,
  WorldSetting,
} from "@/types";

export const defaultNovel: Novel = {
  id: "novel-1",
  title: "雾港回声",
  genre: "近未来悬疑",
  synopsis: "在一座记忆可交易的海港城市里，一名失败律师追查妹妹失踪真相。",
  createdAt: new Date("2026-06-04T00:00:00+08:00"),
  updatedAt: new Date("2026-06-04T00:00:00+08:00"),
};

export const defaultCharacters: Character[] = [
  {
    id: "char-1",
    novelId: "novel-1",
    name: "闻昭",
    role: "主角",
    personality: ["克制", "敏锐", "自我怀疑"],
    background: "前金牌律师，因一场败诉跌入职业谷底，现为灰色地带跑单人。",
    motivation: "找到妹妹失踪的真相，并证明自己的记忆没有被篡改。",
    appearance: "总穿深色风衣，手腕留有旧事故烧痕。",
    relationships: [{ target: "char-2", relation: "互相试探的盟友" }],
  },
  {
    id: "char-2",
    novelId: "novel-1",
    name: "黎岚",
    role: "配角",
    personality: ["冷静", "强势", "高度自律"],
    background: "记忆审计局调查员，擅长追踪非法记忆交易。",
    motivation: "查清港城上层与黑市之间的利益链。",
    appearance: "短发，银灰瞳片，语速极稳。",
    relationships: [{ target: "char-1", relation: "合作中的怀疑对象" }],
  },
  {
    id: "char-3",
    novelId: "novel-1",
    name: "顾沉舟",
    role: "反派",
    personality: ["优雅", "操控欲强", "危险"],
    background: "港城最大记忆银行实际掌控者。",
    motivation: "重塑城市秩序，把所有人纳入可预测系统。",
    appearance: "总是带着无框眼镜，气质温和到近乎失真。",
    relationships: [{ target: "char-1", relation: "隐秘的观察与操控" }],
  },
];

export const defaultChapters: Chapter[] = [
  {
    id: "chapter-1",
    novelId: "novel-1",
    title: "第1章 失而复得的记忆",
    content: "",
    order: 1,
    wordCount: 3200,
    status: "草稿",
  },
  {
    id: "chapter-2",
    novelId: "novel-1",
    title: "第2章 雨夜里的委托",
    content: "",
    order: 2,
    wordCount: 2800,
    status: "修改中",
  },
  {
    id: "chapter-3",
    novelId: "novel-1",
    title: "第3章 港区旧仓库",
    content: "",
    order: 3,
    wordCount: 3600,
    status: "已完成",
  },
  {
    id: "chapter-4",
    novelId: "novel-1",
    title: "第4章 第一条伪造证词",
    content: "",
    order: 4,
    wordCount: 3000,
    status: "草稿",
  },
];

export const defaultWorldSettings: WorldSetting[] = [
  {
    id: "world-1",
    novelId: "novel-1",
    category: "规则",
    title: "记忆交易法案",
    content: "合法记忆只能匿名切片交易，完整人格记忆被列为最高禁品。",
  },
  {
    id: "world-2",
    novelId: "novel-1",
    category: "势力",
    title: "记忆审计局",
    content: "负责监管记忆资产流通，但内部已被资本渗透。",
  },
  {
    id: "world-3",
    novelId: "novel-1",
    category: "地理",
    title: "雾港下城",
    content: "港城最混乱的区域，非法义体诊所和走私码头密布。",
  },
];

export const defaultInspirations: InspirationEntry[] = [
  {
    id: "idea-1",
    type: "灵感",
    content: "如果一个人能购买别人的勇气记忆，他在关键时刻表现出的镇定是否仍算真实？",
    tags: ["科幻", "身份", "心理"],
    createdAt: new Date("2026-06-04T09:00:00+08:00"),
  },
  {
    id: "idea-2",
    type: "对话",
    content: "“你不是忘了她，你只是把想起她的权限卖掉了。”",
    tags: ["对白", "冲突", "悬疑"],
    createdAt: new Date("2026-06-04T09:20:00+08:00"),
  },
  {
    id: "idea-3",
    type: "设定",
    content: "高阶记忆操盘手能通过价格波动判断社会情绪，从而提前收割事件走向。",
    tags: ["设定", "资本", "世界观"],
    createdAt: new Date("2026-06-04T10:00:00+08:00"),
  },
];
