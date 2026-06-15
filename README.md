# InkMuse

InkMuse 是一个面向小说创作者的 AI 写作工作台，提供灵感生成、大纲规划、角色设计、世界观构建、智能续写、对话生成、设定整理和写作统计等能力。

项目使用 `Next.js 16 + React 19 + TypeScript` 构建前端，已经上线至 [https://inkmuse.xyz](https://inkmuse.xyz)。

## 功能

- 创作工作台：查看今日字数、写作时长、词频和目标进度
- 灵感生成：按题材、方向和情绪基调生成灵感卡片
- 大纲规划：从一句话概念扩展为长篇大纲
- 角色设计：生成角色档案和角色面试
- 世界观构建：按维度生成设定并进行一致性推演
- 智能续写：续写、润色、改写、扩写、缩写
- 对话生成：生成剧本式对白
- 设定集与收藏：统一保存、搜索、编辑和再利用素材

## LLM 接入

当前支持以下 provider：

- DeepSeek
- OpenAI
- OpenRouter
- Groq
- SiliconFlow
- Together
- Fireworks
- 阿里云百炼
- 火山方舟
- xAI
- OpenAI Compatible

右上角 `API 设置` 可配置：

- Provider
- Model
- API Key
- Base URL
- 是否记住此设备

说明：

- DeepSeek 支持余额查询
- 其他平台按各自控制台或返回值显示可用额度
- `OpenAI Compatible` 可填写自定义 Base URL，适合大多数兼容 OpenAI 协议的网关和中转服务

## 请求链路

1. 用户在 `API 设置` 里选择 provider、model、API Key 和 Base URL
2. 配置写入 `Zustand`，并按需持久化到 `LocalStorage`
3. 各功能页通过 `lib/ai-stream.ts` 统一请求 `/api/llm`
4. `worker/index.ts` 根据 provider 转发到对应上游

兼容旧地址：

- `POST /api/deepseek`
- `GET /api/deepseek/balance`

统一新地址：

- `POST /api/llm`
- `GET /api/llm/balance`

## 数据与隐私

- 创作数据、收藏、设定和写作统计主要保存在浏览器本地
- API Key 默认只保存在当前会话内存中
- 开启“记住此设备”后，API Key 会保存到浏览器 `LocalStorage`
- 当前的持久化属于轻量混淆，不等同于强加密

## 目录结构

```text
app/
  character/      角色设计
  continuation/   智能续写
  dialogue/       对话生成
  inspiration/    灵感生成
  novel/          小说总览
  outline/        大纲规划
  saved/          收藏与素材管理
  setting/        设定集
  world/          世界观构建
  page.tsx        工作台首页

components/
  ai/             AI 展示组件
  editor/         编辑器相关组件
  features/       业务功能组件
  layout/         导航与布局
  providers/      全局初始化
  ui/             基础 UI 组件

lib/
  ai-stream.ts    统一流式请求封装
  llm.ts          provider/model 规则
  store.ts        全局状态与本地持久化
  export.ts       导出能力
  prompts/        提示词

worker/
  index.ts        Cloudflare Worker LLM 代理
```

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- TipTap
- Recharts
- Cloudflare Workers

## 当前状态

- `npm run lint` 通过
- `npm run build` 通过

