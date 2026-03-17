# WhyFire

> 小红书博主的海外创意灵感库 — 看见海外正在火的创意

## Slogan

**打破创作瓶颈，找到你的下一个爆款** / Break the creative block

## 一句话定位

帮助小红书博主发现海外热门创意内容，AI 解读创意要点，给出本土化建议

## 核心价值

**"不知道拍什么？看看海外正在火的创意，AI 帮你解读并本土化"**

## 核心功能

- 🌍 **海外热门聚合** — YouTube/TikTok 趋势内容
- 🤖 **AI 创意解读** — Claude Haiku 文本分析，提取创意要点
- 🇨🇳 **本土化建议** — 如何改编适合小红书
- 📌 **灵感收藏** — 收藏整理你的创意库

## 技术栈

- **框架**: Next.js 15 (App Router) + React 18
- **样式**: Tailwind CSS
- **数据源**: YouTube Data API v3 (主) + Apify TikTok (辅)
- **AI**: Claude Haiku (文本分析)
- **存储**: SQLite

## 项目结构

```
/WhyFire
├── docs/           # 文档
├── src/
│   ├── app/        # Next.js App Router
│   │   ├── api/    # API Routes
│   │   │   ├── youtube/   # YouTube 数据接口
│   │   │   ├── tiktok/    # TikTok 数据接口
│   │   │   └── analyze/   # AI 分析接口
│   │   ├── page.tsx       # 首页瀑布流
│   │   └── layout.tsx
│   ├── components/ # React 组件
│   │   ├── VideoCard.tsx  # 视频卡片
│   │   ├── AnalysisPanel.tsx  # AI 解读面板
│   │   └── FilterBar.tsx  # 筛选器
│   └── lib/        # 工具库
│       ├── youtube.ts     # YouTube API 封装
│       ├── tiktok.ts      # TikTok API 封装
│       └── claude.ts      # Claude API 封装
└── public/         # 静态资源
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 API Keys

# 启动开发服务器
pnpm dev
```

## 环境变量

| 变量名 | 用途 | 获取地址 |
|--------|------|---------|
| `YOUTUBE_API_KEY` | YouTube Data API | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `APIFY_TOKEN` | TikTok 数据源 | [Apify Console](https://console.apify.com/) |
| `ANTHROPIC_API_KEY` | Claude AI 分析 | [Anthropic Console](https://console.anthropic.com/) |

## 成本估算

| 服务 | 月成本 |
|------|--------|
| YouTube API | 免费 (10,000 单位/天) |
| Apify TikTok | $49/月 |
| Claude Haiku | ~$5-10/月 |
| **总计** | **~¥400/月** |

## 文档

- [产品需求文档 PRD](./docs/REQUIREMENTS.md) ⭐ 核心
- [产品设计文档](./docs/PRODUCT_DESIGN.md)
- [工作计划](./docs/WORK_PLAN.md)

## 开发进度

- [x] 确定产品定位和目标用户
- [x] 确定新方向：参照系扩宽
- [x] 确定技术方案 v2.0
- [ ] YouTube Data API 集成
- [ ] Claude Haiku 分析 API
- [ ] 瀑布流 UI 组件
- [ ] TikTok 集成
- [ ] 收藏功能
