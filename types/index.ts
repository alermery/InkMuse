export interface Novel {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Character {
  id: string;
  novelId: string;
  name: string;
  role: "主角" | "配角" | "反派" | "路人";
  personality: string[];
  background: string;
  motivation: string;
  appearance: string;
  relationships: { target: string; relation: string }[];
  avatar?: string;
}

export interface Chapter {
  id: string;
  novelId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  status: "草稿" | "修改中" | "已完成";
}

export interface WorldSetting {
  id: string;
  novelId: string;
  category: "地理" | "势力" | "功法体系" | "历史" | "规则";
  title: string;
  content: string;
}

export interface InspirationEntry {
  id: string;
  type: "灵感" | "片段" | "设定" | "对话";
  content: string;
  tags: string[];
  createdAt: Date;
}

export interface SavedEntry {
  id: string;
  title: string;
  content: string;
  source:
    | "工作台"
    | "灵感坊"
    | "大纲"
    | "角色"
    | "世界观"
    | "续写"
    | "对话"
    | "设定集";
  tags: string[];
  createdAt: string;
}

export interface EncyclopediaEntry {
  id: string;
  category: "角色" | "世界观" | "道具" | "术语" | "章节" | "其他";
  title: string;
  content: string;
  tags: string[];
  relatedChapterIds: string[];
  createdAt: string;
}

export type DeepSeekModel =
  | "deepseek-v4-flash"
  | "deepseek-v4-pro";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "info";
}
