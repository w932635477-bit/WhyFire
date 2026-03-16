# WhyFire

> 小红书 0-1万粉博主的 AI 教练 — 告诉你为什么他能火，你不火

## Slogan

**Crack the code of viral content** / 破解爆款密码

## 一句话定位

帮助 0-1万粉的小红书初级用户诊断内容问题、对比差距、给出可执行建议 — 并让你看到你能变得多好

## 核心价值

**"告诉你为什么他能火，你不火 — 并给你看你能变得多好"**

## 核心功能

- 🔥 **爆款拆解** — 粘贴链接，AI 告诉你为什么火
- 📊 **内容诊断** — 分析你的笔记，找出差距
- 🎨 **可视化对比** — 展示优化前后效果，看到能变得多好
- 💡 **行动建议** — 封面、标题等具体优化建议（配合 VidLuxe）

## 技术栈

- Next.js 15 + React 18
- Tailwind CSS
- Playwright (数据抓取)
- Claude API (AI 分析)

## 项目结构

```
/WhyFire
├── docs/           # 文档
│   └── plans/      # 设计方案
├── src/
│   ├── app/        # Next.js App Router
│   ├── components/ # React 组件
│   └── lib/        # 工具库
└── public/         # 静态资源
```

## 快速开始

```bash
cd /Users/weilei/WhyFire
pnpm install
pnpm dev
```

## 文档

- [产品需求文档 PRD](./docs/REQUIREMENTS.md) ⭐ 核心
- [产品设计文档](./docs/PRODUCT_DESIGN.md)
- [讨论记录](./docs/DISCUSSION_NOTES.md)
- [数据分析](./docs/DATA_ANALYSIS.md)
- [钩子模板库](./docs/HOOK_TEMPLATES.md)
