# AI Diagram Hub

一个 AI 驱动的图表创作平台，用自然语言描述你想要的图表，AI 帮你生成。

## 功能特点

- **自然语言生成图表** - 只需描述你想要的图表，AI 自动生成
- **三大绘图引擎**
  - Mermaid - 流程图、时序图、类图等
  - Excalidraw - 手绘风格图表
  - Draw.io - 专业图表编辑器
- **版本历史** - 自动保存每次修改，随时回退
- **本地存储** - 数据保存在浏览器本地，无需担心隐私

## 快速开始

### 方式一：首页快速生成

1. 打开首页
2. 选择绘图引擎（Mermaid / Excalidraw / Draw.io）
3. 输入图表描述，例如："画一个用户登录流程图"
4. 点击生成，AI 自动创建项目并生成图表

### 方式二：项目管理

1. 进入项目列表页
2. 点击"新建项目"
3. 选择引擎并命名
4. 在编辑器中通过对话描述你的需求

## 使用技巧

### AI 对话生成

在编辑器右侧的对话面板中，你可以：

- 描述新图表："画一个电商下单流程图"
- 修改现有图表："把支付节点改成红色"
- 添加元素："增加一个库存检查的步骤"

### 手动编辑

- **Excalidraw** - 直接在画布上拖拽、绘制
- **Draw.io** - 使用专业的图表编辑工具
- **Mermaid** - 可直接编辑代码

### 版本管理

- 点击工具栏的"历史记录"按钮
- 查看所有历史版本
- 点击任意版本预览
- 点击"恢复"回退到该版本

## 部署指南

### 前端部署

任何支持静态网站的平台。

### 后端部署

后端使用 Cloudflare Workers，需要配置 AI API：

```bash
cd worker

# 设置环境变量
pnpm run secret:set AI_API_KEY      # 你的 API Key
pnpm run secret:set AI_BASE_URL     # API 地址

# 部署
pnpm run deploy:prod
```

### 支持的 AI 服务

| 服务商 | 推荐模型 |
|--------|----------|
| OpenAI | gpt-5 |
| Anthropic | claude-4.5-sonnet |
| 其他兼容 OpenAI 格式的服务 | - |

## 本地开发

```bash
# 安装依赖
pnpm install
cd worker && pnpm install && cd ..

# 启动开发服务器（需要同时运行）
pnpm run dev              # 前端 http://localhost:5173
cd worker && pnpm run dev # 后端 http://localhost:8787
```

在 `worker/.dev.vars` 中配置：

```env
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.anthropic.com/v1
AI_PROVIDER=anthropic
AI_MODEL_ID=claude-4.5-sonnet
```

## 技术栈

- 前端：React 19 + Vite + TypeScript + Tailwind CSS
- 状态管理：Zustand
- 本地存储：Dexie.js (IndexedDB)
- 后端：Cloudflare Workers

## 开源协议

MIT
