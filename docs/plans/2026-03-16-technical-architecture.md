# WhyFire 技术架构设计文档

> 版本：v3.0 (向导式流程)
> 日期：2026-03-17
> 状态：✅ 已更新为向导式流程设计

---

## 修订记录

| 版本 | 日期 | 修订内容 |
|------|------|---------|
| v2.0 | 2026-03-16 | 腾讯云部署方案 |
| v2.1 | 2026-03-16 | 修复34个审核问题 |
| v3.0 | 2026-03-17 | 向导式流程设计，海外创意灵感库（精准推荐6-10个） |

---

## 一、项目概述

### 1.1 产品定位

小红书 0-1万粉博主的 AI 教练 — 告诉你为什么他能火，你不火

### 1.2 产品形态

**向导式流程**（Wizard UI）— 用户按步骤完成分析，每一步依赖前一步的数据

### 1.3 核心功能（按流程顺序）

| 步骤 | 功能 | 优先级 | 描述 |
|------|------|--------|------|
| Step 1 | 竞品分析 | P0 | 粘贴竞品链接 → AI 分析爆款要素 |
| Step 2 | 内容诊断 | P0 | 分析用户笔记 → 找出与竞品的差距 |
| Step 3 | 可视化对比 | P0 | 雷达图/柱状图展示差距 |
| Step 4 | 海外创意灵感库 | P1 | 精准推荐 6-10 个相关海外爆款 |
| Step 5 | 完成提醒 | P1 | 提醒用户拍完再回来诊断 |

### 1.3 技术目标

- **性能**：页面加载 < 2s，API 响应 < 3s（国内）
- **可用性**：99.9% SLA
- **安全性**：数据加密，防 XSS/CSRF
- **可扩展**：支持抖音、B站扩展

---

## 二、技术栈选型（腾讯云版）

### 2.1 技术栈总览

```
┌─────────────────────────────────────────────────────────────┐
│                    技术栈架构（腾讯云）                       │
├─────────────────────────────────────────────────────────────┤
│  前端框架    Next.js 15 (App Router) + React 18             │
│  UI 组件     Tailwind CSS + Shadcn/ui                       │
│  状态管理    TanStack Query                                 │
│  认证服务    NextAuth.js (自托管)                           │
│  数据库      PostgreSQL (腾讯云 Docker) + Prisma ORM         │
│  缓存        Redis (腾讯云 Docker)                          │
│  支付        微信支付 / 支付宝                              │
│  数据抓取    Playwright (腾讯云 Docker)                     │
│  AI 服务     Claude API (Anthropic)                         │
│  部署        腾讯云轻量应用服务器 + Docker Compose           │
│  CDN         腾讯云 CDN                                     │
│  监控        腾讯云监控 + Sentry                            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 选型理由

| 技术 | 选型理由 | 成本 |
|------|---------|------|
| **Next.js 15** | React 生态最成熟的全栈框架 | 免费 |
| **NextAuth.js** | 完全自托管，无 MAU 限制 | 免费 |
| **PostgreSQL** | 企业级数据库，Prisma 支持好 | 云服务器内免费 |
| **Redis** | 高性能缓存，速率限制 | 云服务器内免费 |
| **Playwright** | 可在服务器直接运行 | 云服务器内免费 |
| **微信/支付宝** | 中国用户支付习惯 | 0.6% 手续费 |

---

## 三、目录结构（向导式流程）

```
/whyfire
├── app/                          # Next.js App Router
│   ├── (marketing)/              # 营销页面组 (Server Components)
│   │   ├── page.tsx              # 首页
│   │   ├── pricing/              # 定价页
│   │   └── about/                # 关于页
│   │
│   ├── (auth)/                   # 认证页面组
│   │   ├── login/                # 登录
│   │   ├── signup/               # 注册
│   │   └── callback/             # OAuth 回调
│   │
│   ├── (wizard)/                 # 向导式流程组 (需认证)
│   │   ├── layout.tsx            # 向导布局（含进度条）
│   │   ├── page.tsx              # 流程入口/选择
│   │   │
│   │   ├── step1-competitor/     # Step 1: 竞品分析
│   │   │   └── page.tsx
│   │   │
│   │   ├── step2-diagnose/       # Step 2: 内容诊断
│   │   │   └── page.tsx
│   │   │
│   │   ├── step3-compare/        # Step 3: 可视化对比
│   │   │   └── page.tsx
│   │   │
│   │   ├── step4-inspiration/    # Step 4: 海外创意灵感库
│   │   │   └── page.tsx          # 精准推荐 6-10 个视频
│   │   │
│   │   └── step5-complete/       # Step 5: 完成提醒
│   │       └── page.tsx
│   │
│   ├── (dashboard)/              # 用户仪表盘组 (需认证，高级功能)
│   │   ├── layout.tsx            # 仪表盘布局
│   │   ├── page.tsx              # 仪表盘首页
│   │   ├── history/              # 历史记录
│   │   ├── favorites/            # 收藏的灵感
│   │   └── settings/             # 设置
│   │
│   ├── api/                      # API 路由
│   │   ├── auth/                 # NextAuth.js
│   │   │   └── [...nextauth]/route.ts
│   │   ├── wizard/               # 向导流程 API
│   │   │   ├── competitor/route.ts    # 竞品分析
│   │   │   ├── diagnose/route.ts      # 内容诊断
│   │   │   ├── compare/route.ts       # 可视化对比
│   │   │   └── inspiration/route.ts   # 灵感推荐
│   │   ├── scrape/               # 数据抓取（小红书）
│   │   ├── youtube/              # YouTube API
│   │   ├── tiktok/               # TikTok API (Apify)
│   │   ├── webhooks/             # Webhooks
│   │   │   ├── wechat/           # 微信支付
│   │   │   └── alipay/           # 支付宝
│   │   ├── payment/              # 支付
│   │   ├── user/                 # 用户
│   │   └── health/               # 健康检查
│   │
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式
│   └── not-found.tsx             # 404 页面
│
├── components/                   # React 组件
│   ├── ui/                       # Shadcn/ui 组件 (Client Components)
│   │   └── ... (自动标记 'use client')
│   ├── wizard/                   # 向导流程组件
│   │   ├── progress-bar.tsx      # 'use client' 步骤进度条
│   │   ├── step-navigation.tsx   # 'use client' 上一步/下一步
│   │   ├── competitor-form.tsx   # 'use client' 竞品链接输入
│   │   ├── diagnose-form.tsx     # 'use client' 自己链接输入
│   │   ├── compare-chart.tsx     # 'use client' 可视化对比图表
│   │   ├── inspiration-card.tsx  # 'use client' 灵感卡片
│   │   └── analysis-result.tsx   # Server Component
│   ├── features/                 # 业务组件
│   │   ├── pricing-card.tsx      # 'use client' (有交互)
│   │   └── usage-stats.tsx       # Server Component
│   └── layout/                   # 布局组件
│       ├── header.tsx            # 'use client'
│       ├── sidebar.tsx           # 'use client'
│       └── footer.tsx            # Server Component
│
├── lib/                          # 核心库
│   ├── anthropic/                # Claude API
│   │   ├── client.ts
│   │   ├── prompts/              # 分析 Prompts
│   │   │   ├── competitor.ts     # 竞品分析
│   │   │   ├── diagnose.ts       # 内容诊断
│   │   │   └── inspiration.ts    # 灵感解读
│   │   └── analyze.ts
│   ├── platforms/                # 多平台数据抓取
│   │   ├── base.ts
│   │   ├── types.ts
│   │   ├── xiaohongshu/          # 小红书
│   │   ├── youtube/              # YouTube
│   │   ├── tiktok/               # TikTok
│   │   └── index.ts
│   ├── wizard/                   # 向导流程
│   │   ├── session.ts            # 会话数据管理
│   │   ├── steps.ts              # 步骤配置
│   │   └── validators.ts         # 步骤验证
│   ├── payment/                  # 支付
│   │   ├── wechat/
│   │   ├── alipay/
│   │   └── index.ts
│   ├── auth/                     # 认证
│   │   ├── config.ts             # NextAuth 配置
│   │   └── callbacks.ts          # 回调处理
│   ├── db/                       # 数据库
│   │   ├── index.ts              # Prisma 客户端（单例）
│   │   ├── users.ts
│   │   └── usage.ts
│   ├── cache/                    # 缓存
│   │   └── redis.ts              # Redis 客户端
│   └── utils/                    # 工具函数
│       ├── rate-limit.ts         # 速率限制（Redis）
│       ├── encryption.ts         # 加密工具
│       ├── retry.ts              # 重试机制
│       └── validators.ts         # 数据验证
│
├── prisma/                       # 数据库
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── .dockerignore
│
├── nginx/
│   ├── nginx.conf
│   └── ssl/
│
├── scripts/
├── public/
├── docs/
├── .env.example
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 四、向导式流程设计

### 4.1 数据流

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           向导式流程数据流                                │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: 竞品分析
    │
    ├── 输入：竞品笔记链接
    ├── 处理：小红书数据抓取 + Claude Sonnet 分析
    └── 输出：竞品分析结果（存入 session）
          │
          ▼
Step 2: 内容诊断
    │
    ├── 输入：用户笔记链接 + Step 1 的竞品数据
    ├── 处理：小红书数据抓取 + Claude Sonnet 分析 + 对比
    └── 输出：诊断结果 + 差距分析（存入 session）
          │
          ▼
Step 3: 可视化对比
    │
    ├── 输入：Step 1 + Step 2 的数据
    ├── 处理：数据聚合 + 图表生成
    └── 输出：可视化对比图表
          │
          ▼
Step 4: 海外创意灵感库
    │
    ├── 输入：前几步的分析结果（用户类别、差距点）
    ├── 处理：YouTube/TikTok API 搜索 + 相关性筛选 + Claude Haiku 解读
    └── 输出：6-10 个精选视频 + 每个的本土化建议
          │
          ▼
Step 5: 完成与提醒
    │
    ├── 输入：所有步骤的数据
    ├── 处理：汇总 + 生成报告
    └── 输出：完整报告 + 下次诊断提醒
```

### 4.2 Session 数据结构

```typescript
// lib/wizard/session.ts

interface WizardSession {
  id: string;
  userId: string;
  currentStep: number;
  createdAt: Date;
  updatedAt: Date;

  // Step 1: 竞品分析
  competitorAnalysis?: {
    noteUrl: string;
    noteData: XhsNoteData;
    result: CompetitorAnalysisResult;
  };

  // Step 2: 内容诊断
  selfDiagnosis?: {
    noteUrl: string;
    noteData: XhsNoteData;
    result: DiagnosisResult;
  };

  // Step 3: 可视化对比（从 Step 1 + Step 2 计算）
  comparison?: {
    radarChart: RadarChartData;
    gapAnalysis: GapAnalysis;
  };

  // Step 4: 灵感推荐
  inspirations?: {
    videos: InspirationVideo[];  // 6-10 个
    selectedIds: string[];       // 用户收藏的
  };

  // Step 5: 完成
  completedAt?: Date;
  reportUrl?: string;
}

// 存储方式：MVP 用 Session Storage，V2 用数据库
```

### 4.3 步骤配置

```typescript
// lib/wizard/steps.ts

export const WIZARD_STEPS = [
  {
    id: 1,
    slug: 'competitor',
    title: '竞品分析',
    description: '分析爆款笔记，拆解成功要素',
    required: true,
  },
  {
    id: 2,
    slug: 'diagnose',
    title: '内容诊断',
    description: '分析自己的内容，找出差距',
    required: true,
  },
  {
    id: 3,
    slug: 'compare',
    title: '可视化对比',
    description: '对比差距，一目了然',
    required: true,
  },
  {
    id: 4,
    slug: 'inspiration',
    title: '灵感推荐',
    description: '精选 6-10 个相关海外爆款',
    required: false,  // 可选，但推荐
  },
  {
    id: 5,
    slug: 'complete',
    title: '完成',
    description: '查看报告，再次诊断提醒',
    required: true,
  },
] as const;

export function getNextStep(currentStep: number): number | null {
  return currentStep < WIZARD_STEPS.length ? currentStep + 1 : null;
}

export function getPrevStep(currentStep: number): number | null {
  return currentStep > 1 ? currentStep - 1 : null;
}
```

---

## 五、数据库设计

### 5.1 Schema 定义

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== NextAuth.js 模型 ====================

model User {
  id            String        @id @default(cuid())
  email         String?       @unique
  phone         String?       @unique
  name          String?
  image         String?
  passwordHash  String?
  emailVerified DateTime?

  // NextAuth.js 关联
  accounts      Account[]
  sessions      Session[]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // 业务关联
  subscription  Subscription?
  usage         Usage?
  credentials   PlatformCredential[]
  analyses      Analysis[]

  @@index([email])
  @@index([phone])
}

model Account {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?  @db.Text
  access_token      String?  @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?  @db.Text
  session_state     String?

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@index([provider, userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires      DateTime

  @@index([userId])
}

// NextAuth.js 验证令牌（邮箱验证、密码重置）
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ==================== 业务模型 ====================

model Subscription {
  id                   String              @id @default(cuid())
  userId               String              @unique
  user                 User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  plan                 Plan                @default(FREE)
  status               SubscriptionStatus  @default(ACTIVE)

  paymentProvider      PaymentProvider?
  paymentOrderId       String?             @unique
  paymentTransactionId String?

  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?

  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt

  @@index([paymentOrderId])
}

model Usage {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  analyzeCount    Int       @default(0)
  diagnoseCount   Int       @default(0)
  hookCheckCount  Int       @default(0)

  resetAt         DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([resetAt])
}

model PlatformCredential {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  platform      Platform  @default(XIAOHONGSHU)
  encryptedData String

  expiresAt     DateTime?
  isValid       Boolean   @default(true)
  lastUsedAt    DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([userId, platform])
  @@index([platform])
}

model Analysis {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  platform      Platform      @default(XIAOHONGSHU)
  analysisType  AnalysisType  @default(COMPETITOR)

  noteUrl       String
  noteId        String?

  rawData       Json?
  result        Json?

  status        AnalysisStatus @default(PENDING)
  errorMessage  String?

  deletedAt     DateTime?
  createdAt     DateTime      @default(now())

  @@index([userId])
  @@index([platform, noteId])
  @@index([createdAt])
}

// ==================== 枚举 ====================

enum Plan {
  FREE
  STARTER
  TRAINER
  PRO
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}

enum PaymentProvider {
  WECHAT
  ALIPAY
}

enum Platform {
  XIAOHONGSHU
  DOUYIN
  BILIBILI
}

enum AnalysisType {
  COMPETITOR
  SELF_DIAGNOSE
  HOOK_CHECK
}

enum AnalysisStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### 4.2 索引策略

| 表 | 索引 | 用途 |
|---|------|------|
| User | email, phone | 登录查询 |
| Account | userId, provider+userId | OAuth 查询 |
| Subscription | paymentOrderId | 支付回调 |
| Usage | resetAt | 用量重置 |
| PlatformCredential | userId+platform(唯一) | 凭证查询 |
| Analysis | userId, platform+noteId, createdAt | 历史查询、去重 |

---

## 五、核心模块实现

### 5.1 Prisma 客户端（单例模式）

```typescript
// lib/db/index.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### 5.2 Redis 客户端

```typescript
// lib/cache/redis.ts

import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export default redis;
```

### 5.3 速率限制（Redis 实现）

```typescript
// lib/utils/rate-limit.ts

import { redis } from '@/lib/cache/redis';

interface RateLimitConfig {
  key: string;        // 包含用户 ID
  limit: number;
  window: number;     // 秒
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export async function rateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { key, limit, window } = config;
  const now = Date.now();
  const windowStart = Math.floor(now / 1000 / window) * window;
  const currentKey = `ratelimit:${key}:${windowStart}`;

  try {
    // 使用 Redis INCR
    const current = await redis.incr(currentKey);

    // 设置过期时间
    if (current === 1) {
      await redis.expire(currentKey, window);
    }

    const remaining = Math.max(0, limit - current);
    const resetAt = (windowStart + window) * 1000;

    return {
      success: current <= limit,
      remaining,
      resetAt,
      retryAfter: current > limit ? resetAt - now : undefined,
    };
  } catch (error) {
    // Redis 失败时，降级为允许请求
    console.error('Rate limit error:', error);
    return {
      success: true,
      remaining: limit,
      resetAt: now + window * 1000,
    };
  }
}

// 根据用户和套餐生成 key（修复：包含用户 ID）
export function getRateLimitKey(userId: string, plan: string): string {
  return `${plan}:${userId}`;
}

// 根据套餐获取限制配置
export function getRateLimitConfig(plan: string): { limit: number; window: number } {
  switch (plan) {
    case 'FREE':
      return { limit: 3, window: 86400 };
    case 'STARTER':
      return { limit: 30, window: 86400 };
    case 'TRAINER':
      return { limit: 100, window: 86400 };
    case 'PRO':
      return { limit: 500, window: 86400 };
    default:
      return { limit: 3, window: 86400 };
  }
}
```

### 5.4 加密工具（带验证和错误处理）

```typescript
// lib/utils/encryption.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// 获取加密密钥（带验证）
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error('ENCRYPTION_KEY must be a valid hex string');
  }

  return Buffer.from(keyHex, 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encrypted.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, data] = parts;

    if (ivHex.length !== IV_LENGTH * 2) {
      throw new Error('Invalid IV length');
    }

    if (authTagHex.length !== AUTH_TAG_LENGTH * 2) {
      throw new Error('Invalid auth tag length');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // 记录错误但不暴露细节
    console.error('Decryption failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Decryption failed: data may be corrupted or tampered');
  }
}

// 生成新的加密密钥（用于初始化）
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

### 5.5 重试机制

```typescript
// lib/utils/retry.ts

interface RetryOptions {
  retries: number;
  delay: number;
  backoff?: boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { retries, delay, backoff = true } = options;

  let lastError: Error | undefined;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (i < retries) {
        const waitTime = backoff ? delay * Math.pow(2, i) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}
```

### 5.6 AI 分析模块（带重试）

```typescript
// lib/anthropic/analyzer.ts

import Anthropic from '@anthropic-ai/sdk';
import { withRetry } from '@/lib/utils/retry';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeNote(noteData: XhsNoteData): Promise<AnalysisResult> {
  return withRetry(
    async () => {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildPrompt(noteData) }],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('AI returned non-text response');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response as JSON');
      }

      return JSON.parse(jsonMatch[0]) as AnalysisResult;
    },
    { retries: 3, delay: 1000, backoff: true }
  );
}

function buildPrompt(noteData: XhsNoteData): string {
  // ... prompt 构建逻辑
}
```

---

## 六、安全设计

### 6.1 认证中间件（NextAuth.js）

```typescript
// middleware.ts

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // 可以在这里添加额外的检查逻辑
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // 公开路由
        const publicPaths = ['/', '/pricing', '/about', '/api/health', '/api/webhooks'];
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true;
        }

        // 认证路由
        if (pathname.startsWith('/api/auth')) {
          return true;
        }

        // 其他路由需要认证
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
```

### 6.2 NextAuth 配置

```typescript
// lib/auth/config.ts

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/db';
import { compare } from 'bcrypt';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
```

---

## 七、部署配置

### 7.1 Docker Compose（安全配置）

```yaml
# docker/docker-compose.yml

services:
  nginx:
    image: nginx:1.25-alpine
    container_name: whyfire-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - nginx-logs:/var/log/nginx
    depends_on:
      app:
        condition: service_healthy
    restart: always
    networks:
      - whyfire-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: whyfire-app
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://whyfire:${DB_PASSWORD}@postgres:5432/whyfire
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - WECHAT_APP_ID=${WECHAT_APP_ID}
      - WECHAT_MCH_ID=${WECHAT_MCH_ID}
      - WECHAT_API_KEY=${WECHAT_API_KEY}
      - ALIPAY_APP_ID=${ALIPAY_APP_ID}
      - ALIPAY_PRIVATE_KEY=${ALIPAY_PRIVATE_KEY}
    env_file:
      - ../.env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: always
    networks:
      - whyfire-network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  postgres:
    image: postgres:16-alpine
    container_name: whyfire-postgres
    expose:
      - "5432"
    environment:
      - POSTGRES_USER=whyfire
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=whyfire
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U whyfire"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - whyfire-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  redis:
    image: redis:7.2-alpine
    container_name: whyfire-redis
    expose:
      - "6379"
    command: >
      redis-server
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - whyfire-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

volumes:
  postgres-data:
  redis-data:
  nginx-logs:

networks:
  whyfire-network:
    driver: bridge
```

### 7.2 Nginx 配置（完整安全 Headers）

```nginx
# nginx/nginx.conf

worker_processes auto;

events {
    worker_connections 1024;
}

http {
    upstream nextjs_app {
        server app:3000;
        keepalive 32;
    }

    # 安全 Headers 映射
    map $host $csp_header {
        default "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://api.anthropic.com";
    }

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name whyfire.cn www.whyfire.cn;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS
    server {
        listen 443 ssl http2;
        server_name whyfire.cn www.whyfire.cn;

        # SSL 证书
        ssl_certificate /etc/nginx/ssl/whyfire.cn.crt;
        ssl_certificate_key /etc/nginx/ssl/whyfire.cn.key;

        # SSL 配置（现代化）
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        # 安全 Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy $csp_header always;
        add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

        # 代理到 Next.js
        location / {
            proxy_pass http://nextjs_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # 超时配置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 静态资源缓存
        location /_next/static {
            proxy_pass http://nextjs_app;
            proxy_cache_valid 200 365d;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }

        # 图片缓存
        location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
            proxy_pass http://nextjs_app;
            proxy_cache_valid 200 30d;
            add_header Cache-Control "public, max-age=2592000";
        }
    }
}
```

### 7.3 Dockerfile（优化版）

```dockerfile
# docker/Dockerfile

# Stage 1: 依赖安装
FROM node:20-alpine AS deps
WORKDIR /app

# 安装 Playwright 系统依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl

# 设置 Playwright 使用系统 Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Stage 2: 构建
FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 安装 Playwright 依赖
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 3: 运行
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 安装运行时依赖
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont curl

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 7.4 .dockerignore

```
# docker/.dockerignore

node_modules
.next
.git
.gitignore
*.md
.env*
!.env.example
scripts/
docs/
docker/
*.log
.DS_Store
```

---

## 八、Next.js 配置

### 8.1 next.config.js

```javascript
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // 重定向
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
    ];
  },

  // 安全 Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },

  // 图片域名白名单
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sns-webpic-qc.xhscdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.xhscdn.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

---

## 九、环境变量

### 9.1 .env.example

```bash
# .env.example

# ==================== 应用配置 ====================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ==================== 数据库 ====================
DATABASE_URL="postgresql://whyfire:your_password_here@localhost:5432/whyfire"

# ==================== Redis ====================
REDIS_URL="redis://:your_redis_password@localhost:6379"

# ==================== NextAuth.js ====================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here  # 运行: openssl rand -base64 32

# ==================== Anthropic API ====================
ANTHROPIC_API_KEY=sk-ant-your-key-here

# ==================== 微信支付 ====================
WECHAT_APP_ID=your_wechat_app_id
WECHAT_MCH_ID=your_merchant_id
WECHAT_API_KEY=your_api_key
WECHAT_NOTIFY_URL=https://whyfire.cn/api/webhooks/wechat

# ==================== 支付宝 ====================
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
ALIPAY_NOTIFY_URL=https://whyfire.cn/api/webhooks/alipay

# ==================== 加密密钥 ====================
# 生成方式: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_character_hex_key_here

# ==================== 邮件服务（可选） ====================
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=noreply@whyfire.cn

# ==================== Sentry（可选） ====================
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 十、审核检查清单

### 10.1 架构审核

- [x] 目录结构符合 Next.js 15 最佳实践
- [x] Server/Client Components 划分明确
- [x] 数据库设计规范化，索引合理
- [x] API 设计 RESTful，错误处理完善

### 10.2 安全审核

- [x] 认证使用 NextAuth.js（非 Clerk）
- [x] 环境变量无硬编码
- [x] Docker Compose 无硬编码密码
- [x] 数据库/Redis 端口不对外暴露
- [x] Cookie/凭证加密存储
- [x] 速率限制使用 Redis（非 Vercel KV）
- [x] Nginx 配置完整安全 Headers
- [x] 加密函数有密钥验证和错误处理

### 10.3 Docker 审核

- [x] Docker Compose 使用环境变量
- [x] 数据库端口仅内部暴露
- [x] 配置健康检查
- [x] 配置资源限制
- [x] 使用特定版本标签
- [x] 有 .dockerignore

### 10.4 代码审核

- [x] Prisma 单例模式
- [x] 加密函数有验证和错误处理
- [x] 速率限制 key 包含用户 ID
- [x] AI 模块有重试机制
- [x] 无重复代码
- [x] TypeScript 类型完整

---

## 十一、参考资源

**腾讯云**
- [PM2 自动部署 Next.js](https://cloud.tencent.com/developer/article/1943648)
- [PostgreSQL 安装指南](https://cloud.tencent.com/developer/article/2464815)
- [Redis 安装指南](https://cloud.tencent.com/developer/article/2464771)
- [SSL 证书配置](https://cloud.tencent.com/developer/article/2412467)

**框架文档**
- [Next.js 15 官方文档](https://nextjs.org/docs)
- [NextAuth.js 文档](https://next-auth.js.org)
- [Prisma 文档](https://www.prisma.io/docs)
- [Anthropic API 文档](https://docs.anthropic.com)
- [Playwright 文档](https://playwright.dev/docs/intro)

**GitHub 参考**
- [MediaCrawler - 小红书爬虫](https://github.com/NanmiCoder/MediaCrawler)
- [Next.js SaaS Starter](https://github.com/nextjs/saas-starter)
