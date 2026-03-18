# WhyFire v2.0 技术设计文档 (TDD)

> AI Rap 视频一键生成器 - 技术架构设计

**文档版本**: 1.0
**最后更新**: 2026-03-18
**关联 PRD**: [PRD v6.1](./PRD.md)

---

## 目录

1. [技术架构概述](#1-技术架构概述)
2. [技术栈选型](#2-技术栈选型)
3. [系统架构设计](#3-系统架构设计)
4. [数据库设计](./TDD-database.md)
5. [API 接口规范](./TDD-api.md)
6. [组件设计](./TDD-components.md)
7. [安全设计](./TDD-security.md)
8. [部署架构](./TDD-deployment.md)
9. [测试策略](./TDD-testing.md)
10. [Storybook 配置](./TDD-storybook.md)
11. [验证报告](./TDD-review.md)

---

## 1. 技术架构概述

### 1.1 系统目标

WhyFire 是一款 AI 驱动的 Rap 视频生成工具，核心流程：

```
对话创作 → AI 生成 Rap 歌词（含方言）→ AI 生成 Rap 音乐 → 合成特效视频
```

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **Serverless First** | 利用 Vercel Serverless 函数，降低运维成本 |
| **Edge Optimized** | 静态资源 CDN 加速，API 边缘计算 |
| **渐进式增强** | MVP 核心功能优先，后续迭代增强 |
| **成本可控** | 按需付费，免费额度优先 |
| **可扩展** | 模块化设计，便于功能扩展 |

### 1.3 核心技术挑战

| 挑战 | 解决方案 |
|------|----------|
| 音乐生成耗时长 (15-45s) | 异步任务 + 轮询机制 |
| 视频合成性能 | FFmpeg.wasm 浏览器端渲染 |
| 方言 TTS | MiniMax + Azure（粤语）混合方案 |
| 动感字幕 | Canvas 渲染 + FFmpeg overlay |

---

## 2. 技术栈选型

### 2.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.x | 全栈框架 (App Router) |
| React | 18.x | UI 组件库 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 3.x | 样式框架 |
| FFmpeg.wasm | 0.12.x | 浏览器端视频处理 |
| Zustand | 4.x | 状态管理 |
| React Query | 5.x | 服务端状态管理 |
| Framer Motion | 11.x | 动画库 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | 15.x | Serverless API |
| Supabase | Latest | PostgreSQL + Auth + Realtime |
| Upstash Redis | Latest | 缓存 + 限流 + 任务队列 |
| Cloudflare R2 | - | 文件存储 |

### 2.3 AI 服务

| 服务 | 用途 | 备选 |
|------|------|------|
| Claude API (Haiku) | 歌词生成 + AI 对话 | - |
| MiniMax API | TTS + 音乐生成 | Azure TTS（粤语） |
| Azure Cognitive | 粤语 TTS | - |

### 2.4 第三方服务

| 服务 | 用途 |
|------|------|
| Vercel | 托管 + CDN |
| 微信支付 | 支付处理 |
| Sentry | 错误监控 |
| Logflare | 日志管理 |

---

## 3. 系统架构设计

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           用户浏览器                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────────────┐ │
│  │ React   │  │ Zustand │  │ React   │  │ FFmpeg.wasm             │ │
│  │ UI      │  │ Store   │  │ Query   │  │ (视频合成)               │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────────┬────────────┘ │
└───────┼────────────┼────────────┼─────────────────────┼──────────────┘
        │            │            │                     │
        └────────────┴────────────┴─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Vercel Edge Network                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Application                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │   │
│  │  │ Pages    │  │ API      │  │ Server   │  │ Middleware   │ │   │
│  │  │ (SSR/SSG)│  │ Routes   │  │ Actions  │  │ (Auth/Rate)  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Supabase    │    │  Upstash      │    │  Cloudflare   │
│   PostgreSQL  │    │  Redis        │    │  R2 Storage   │
│   + Auth      │    │  (Cache/Queue)│    │  (Files)      │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │
        │                     │
        ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          AI Services                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │ Claude API    │  │ MiniMax API   │  │ Azure TTS     │           │
│  │ (歌词/对话)    │  │ (音乐/TTS)    │  │ (粤语)        │           │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流架构

#### 3.2.1 歌词生成流程

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  用户输入  │ ──► │ 请求验证  │ ──► │ Claude   │ ──► │ 存储歌词  │
│ 场景/方言  │     │ 限流检查  │     │ API      │     │ 返回结果  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                        │
                        ▼
                 ┌──────────┐
                 │ 敏感词    │
                 │ 过滤      │
                 └──────────┘
```

#### 3.2.2 音乐生成流程（异步）

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ 生成请求  │ ──► │ 创建任务  │ ──► │ Redis    │ ──► │ 返回      │
│          │     │ task_id  │     │ 入队     │     │ task_id  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                       │
                        ┌──────────────┘
                        ▼
                 ┌──────────┐     ┌──────────┐     ┌──────────┐
                 │ Worker   │ ──► │ MiniMax  │ ──► │ R2 存储   │
                 │ 处理任务  │     │ API      │     │ 更新状态  │
                 └──────────┘     └──────────┘     └──────────┘
                                       │
                        ┌──────────────┘
                        ▼
                 ┌──────────┐
                 │ 前端轮询  │
                 │ 状态更新  │
                 └──────────┘
```

#### 3.2.3 视频合成流程（浏览器端）

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ 上传素材  │ ──► │ R2 存储   │ ──► │ 获取素材  │ ──► │ Canvas   │
│ 图片/视频 │     │ 获取URL  │     │ 到浏览器  │     │ 字幕渲染  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
                        ┌────────────────────────────────┘
                        ▼
                 ┌──────────┐     ┌──────────┐     ┌──────────┐
                 │ FFmpeg   │ ──► │ 合成视频  │ ──► │ 下载/上传 │
                 │ .wasm    │     │ +特效    │     │ R2       │
                 └──────────┘     └──────────┘     └──────────┘
```

### 3.3 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面组
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (main)/                   # 主要功能页面组
│   │   ├── create/               # 视频创作流程
│   │   ├── my-videos/            # 我的作品
│   │   ├── pricing/              # 定价页
│   │   └── layout.tsx
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── lyrics/
│   │   ├── music/
│   │   ├── video/
│   │   ├── payment/
│   │   └── user/
│   ├── layout.tsx
│   ├── page.tsx                  # 首页
│   └── globals.css
├── components/                   # 组件
│   ├── ui/                       # 基础 UI 组件
│   ├── features/                 # 业务功能组件
│   ├── layout/                   # 布局组件
│   └── providers/                # Context Providers
├── lib/                          # 工具库
│   ├── api/                      # API 客户端
│   ├── db/                       # 数据库操作
│   ├── ai/                       # AI 服务集成
│   ├── storage/                  # 文件存储
│   └── utils/                    # 通用工具
├── hooks/                        # 自定义 Hooks
├── stores/                       # Zustand Stores
├── types/                        # TypeScript 类型定义
├── constants/                    # 常量定义
└── middleware.ts                 # Next.js 中间件
```

---

## 4. 分模块详细设计

详细设计请参考以下独立文档：

| 模块 | 文档 | 说明 |
|------|------|------|
| 数据库设计 | [TDD-database.md](./TDD-database.md) | 表结构、索引、关系 |
| API 接口规范 | [TDD-api.md](./TDD-api.md) | RESTful API 设计 |
| 组件设计 | [TDD-components.md](./TDD-components.md) | 前端组件架构 |
| 安全设计 | [TDD-security.md](./TDD-security.md) | 认证、授权、数据安全 |
| 部署架构 | [TDD-deployment.md](./TDD-deployment.md) | CI/CD、监控、运维 |
| 测试策略 | [TDD-testing.md](./TDD-testing.md) | 组件测试指南 |
| Storybook 配置 | [TDD-storybook.md](./TDD-storybook.md) | 组件可视化文档 |
| OpenAPI 规范 | [openapi.yaml](./openapi.yaml) | API 文档规范 |
| 验证报告 | [TDD-review.md](./TDD-review.md) | 最佳实践验证结果 |

---

## 5. 关键技术决策

### 5.1 为什么选择 FFmpeg.wasm？

| 对比项 | FFmpeg.wasm | 服务端 FFmpeg | WebCodecs API |
|--------|-------------|---------------|---------------|
| **部署复杂度** | 低 | 高 | 低 |
| **服务器成本** | 无 | 高 | 无 |
| **浏览器兼容** | 良好 | - | 有限 |
| **功能完整性** | 高 | 高 | 中 |
| **性能** | 中 | 高 | 高 |

**结论**：MVP 阶段选择 FFmpeg.wasm，降低服务器成本，后续可迁移到服务端。

### 5.2 为什么选择 Supabase？

| 对比项 | Supabase | Firebase | 自建 PostgreSQL |
|--------|----------|----------|------------------|
| **免费额度** | 500MB DB + 1GB Storage | 1GB Firestore | 无 |
| **内置 Auth** | ✅ | ✅ | ❌ |
| **实时订阅** | ✅ | ✅ | 需配置 |
| **学习成本** | 低 | 中 | 高 |
| **数据迁移** | 标准 SQL | 专有格式 | 标准 SQL |

**结论**：Supabase 提供完整的后端服务，适合独立开发者快速迭代。

### 5.3 为什么选择 Upstash Redis？

| 对比项 | Upstash | 自建 Redis | Vercel KV |
|--------|---------|------------|-----------|
| **Serverless** | ✅ | ❌ | ✅ |
| **定价模式** | 按请求 | 固定+流量 | 按请求 |
| **免费额度** | 10k 请求/天 | 无 | 256MB 存储 |
| **Vercel 集成** | 原生 | 需配置 | 原生 |

**结论**：Upstash 完美适配 Serverless 架构，免费额度足够初期使用。

---

## 6. 性能基准

### 6.1 目标指标

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 首屏加载 (LCP) | < 2s | Lighthouse |
| 首次输入延迟 (FID) | < 100ms | Lighthouse |
| 累积布局偏移 (CLS) | < 0.1 | Lighthouse |
| API 响应时间 (P95) | < 3s | Vercel Analytics |
| 歌词生成 | < 5s | 服务端监控 |
| 音乐生成 | < 45s | 异步轮询 |
| 视频合成 (30s) | < 90s | 客户端计时 |

### 6.2 优化策略

| 策略 | 实现方式 |
|------|----------|
| 代码分割 | 动态 import + Suspense |
| 图片优化 | Next.js Image 组件 |
| 字体优化 | next/font |
| 静态生成 | SSG for landing pages |
| 增量静态再生 | ISR for content pages |
| 边缘缓存 | Vercel Edge Network |
| API 响应缓存 | Redis + stale-while-revalidate |

---

## 附录

### A. 环境变量清单

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Claude API
ANTHROPIC_API_KEY=

# MiniMax API
MINIMAX_API_KEY=
MINIMAX_GROUP_ID=

# Azure TTS (粤语)
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=

# 微信支付
WECHAT_MCH_ID=
WECHAT_APPID=
WECHAT_API_KEY=
WECHAT_NOTIFY_URL=

# 应用配置
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=WhyFire
```

### B. 参考资源

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [FFmpeg.wasm Documentation](https://ffmpegwasm.netlify.app/)
- [Claude API Documentation](https://docs.anthropic.com/)
- [MiniMax API Documentation](https://platform.minimaxi.com/)

---

*本文档最后更新于 2026-03-18*
