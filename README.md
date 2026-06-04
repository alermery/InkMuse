# InkMuse

InkMuse 是一个面向小说作者的 AI 创作工作台，已经上线至 [https://inkmuse.xyz](https://inkmuse.xyz)。

它把灵感生成、大纲规划、角色设计、世界观构建、智能续写、对白生成和设定集管理放在同一个空间里，适合从一个模糊点子推进到可执行的长篇小说方案。

## 在线访问

- 线上地址：[https://inkmuse.xyz](https://inkmuse.xyz)
- 当前 AI 接入：DeepSeek API
- 数据存储：浏览器本地存储为主，API Key 会保存在当前浏览器的 LocalStorage 中

## 主要功能

### 创作工作台

工作台用于集中查看当前创作项目和每日写作状态。

- 展示今日字数、写作时长、效率和收藏素材数量
- 展示每日字数、写作时长、章节完成度、词频分析和写作日历
- 支持设置每日目标和每周目标
- 自动生成一条每日灵感建议
- 可把 AI 输出保存到本地素材区

### 灵感坊

灵感坊用于从题材、方向和情感基调生成小说创意。

- 支持开篇设定、情节转折、人物冲突、金手指设计、高潮桥段、虐心名场面、爽点设计等方向
- AI 返回结构化灵感卡片
- 支持收藏、复制、扩展和保存灵感
- 扩展结果会包含核心卖点、主要冲突、前三章钩子和长篇展开路线

### 大纲规划

大纲模块用于把一句话概念扩展成长篇结构。

- 从概念、类型和预计字数生成完整大纲
- 覆盖核心设定、世界观、力量体系、核心冲突、角色线、卷大纲和章节推进
- 支持在大纲树上对局部节点进行 AI 扩展、重写、添加转折或生成章节
- 支持保存大纲结果到工作台素材

### 角色设计

角色模块用于生成角色档案并测试人物一致性。

- 根据姓名、年龄、性别、身份、角色定位和性格标签生成角色档案
- 档案包含基础信息、性格标签、小传、核心动机、内心恐惧、说话风格和关系建议
- 支持“角色面试”，让 AI 以角色第一人称回答问题
- 可保存角色档案到设定集

### 世界观构建

世界观模块用于维护小说设定的一致性。

- 支持地理、势力、力量体系、历史、社会规则等分类
- 支持自动补全关联设定、一致性检查和假如推演
- 输出会明确潜在矛盾、剧情用途和后续扩展方向
- 可保存到素材区和设定集

### 智能续写

续写模块用于基于现有文本继续推进内容。

- 支持续写、润色、改写、扩写、缩写和情感注入
- 支持选择输出长度
- 尽量保持既有人称、文风、剧情逻辑和角色说话方式
- 可把结果保存为素材

### 对话生成

对话模块用于快速生成剧本格式对白。

- 支持选择参与角色、场景、情绪和对话目的
- 输出包含对白、动作描写和表情标注
- 适合测试角色声音、推进冲突或补足场景互动

### 设定集

设定集用于统一管理创作资料。

- 支持角色、世界观、道具、术语、章节和其他分类
- 支持搜索设定、标签和正文
- 支持从输入文本中 AI 提取设定条目
- 可沉淀角色、世界观、道具、规则和章节相关资料

### 导出

顶部导出菜单支持把当前内容导出为：

- Markdown
- TXT
- 工作区 JSON 数据

## DeepSeek API 配置

InkMuse 支持两种 API Key 配置方式。

### 方式一：在网页中填写

打开 [https://inkmuse.xyz](https://inkmuse.xyz)，点击右上角“API Key 设置”，填入 DeepSeek API Key 即可使用。

这种方式下，Key 会保存在当前浏览器的 LocalStorage 中，用于调用站点的代理接口。请不要在公共电脑或不可信环境中保存自己的 Key。

### 方式二：通过环境变量配置

本地开发或自行部署时，可以在环境变量中配置：

```bash
DEEPSEEK_API_KEY=sk-xxxx
```

如果请求头中没有传入用户自己的 Key，服务端代理会尝试读取该环境变量。

### 支持的模型

当前界面内置以下模型选项：

- `deepseek-chat`
- `deepseek-v4-flash`
- `deepseek-v4-pro`

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- TipTap
- Recharts
- Base UI
- Lucide React
- OpenAI SDK 兼容 DeepSeek 接口

## 本地开发

### 环境要求

- Node.js 版本建议使用当前 LTS 或更高版本
- npm
- 可选：DeepSeek API Key

### 安装依赖

```bash
npm install
```

### 启动开发服务

```bash
npm run dev
```

启动后访问：

```text
http://localhost:3000
```

### 生产构建

```bash
npm run build
```

### 启动生产服务

```bash
npm run start
```

### 代码检查

```bash
npm run lint
```

## 项目结构

```text
app/
  api/deepseek/              DeepSeek 流式生成代理接口
  api/deepseek/balance/      DeepSeek 余额查询代理接口
  character/                 角色设计页面
  continuation/              智能续写页面
  dialogue/                  对话生成页面
  inspiration/               灵感坊页面
  outline/                   大纲规划页面
  setting/                   设定集页面
  world/                     世界观构建页面
  page.tsx                   创作工作台首页

components/
  ai/                        AI 输出与流式文本组件
  editor/                    TipTap 编辑器与工具栏
  features/                  业务功能组件
  layout/                    导航、侧栏、状态栏等布局组件
  providers/                 主题、初始化和 Toast Provider
  ui/                        通用 UI 组件

lib/
  ai-stream.ts               前端流式请求封装
  deepseek.ts                DeepSeek SDK 客户端
  export.ts                  导出工具
  store.ts                   Zustand 本地状态
  prompts/                   各模块提示词

types/
  index.ts                   全局类型定义
```

## 数据与隐私说明

- 当前项目以浏览器本地状态为主，不依赖用户账号系统。
- API Key 会保存在当前浏览器的 LocalStorage 中，并经过简单混淆后存储。
- 浏览器端存储不等同于高强度加密，不建议在公共设备上长期保存 Key。
- AI 生成请求会通过 `/api/deepseek` 代理转发到 DeepSeek。
- 余额查询会通过 `/api/deepseek/balance` 请求 DeepSeek 的账户余额接口。

## 常见问题

### 为什么生成失败？

常见原因包括：

- 没有配置 DeepSeek API Key
- API Key 无效或余额不足
- 当前网络无法访问 DeepSeek API
- 请求触发了服务端限流

### 为什么余额查询失败？

余额查询依赖 DeepSeek 账户接口。如果失败，请优先检查：

- API Key 是否正确
- 该 Key 是否有访问账户余额接口的权限
- 当前部署环境是否能访问 `https://api.deepseek.com`

### 数据会同步到云端吗？

当前版本没有账号同步能力。创作内容、收藏素材、设定集和 API Key 主要保存在当前浏览器环境中。更换浏览器、清理缓存或更换设备后，本地数据可能无法继续访问。

## 部署

这是一个标准 Next.js App Router 项目，可以部署到 Vercel 或其他支持 Node.js 的平台。

部署时建议配置：

```bash
DEEPSEEK_API_KEY=sk-xxxx
```

如果希望完全由用户在前端输入自己的 Key，也可以不配置该环境变量。

## 许可证

当前仓库未声明开源许可证。使用、分发或二次开发前，请先确认项目所有者授权。
