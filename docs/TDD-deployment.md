# WhyFire v2.0 部署架构

> 返回 [TDD 主文档](./TDD.md)

---

## 1. 部署架构概述

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           用户请求                                   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                        Edge Functions                          │  │
│  │  - 全球 CDN 分发                                                │  │
│  │  - 静态资源缓存                                                  │  │
│  │  - 边缘计算                                                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js Application                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Pages     │  │  API Routes │  │  Server     │                  │
│  │   (SSR/SSG) │  │  (Serverless)│  │  Actions    │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Supabase    │    │  Upstash      │    │  Cloudflare   │
│   (PostgreSQL)│    │  (Redis)      │    │  R2 (Storage) │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 1.2 服务列表

| 服务 | 用途 | 地区 | 计费 |
|------|------|------|------|
| Vercel | 应用托管 | 全球边缘 | Pro: $20/月 |
| Supabase | 数据库 + Auth | AWS ap-northeast-1 | Free/Pro |
| Upstash | Redis 缓存 | 全球边缘 | Free/Pro |
| Cloudflare R2 | 文件存储 | 全球 | Free/Pro |
| Sentry | 错误监控 | - | Free/Team |
| 微信支付 | 支付 | - | 按交易 |

---

## 2. Vercel 部署配置

### 2.1 项目配置

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["hnd1", "sfo1"],
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    },
    {
      "source": "/(.*).js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/ffmpeg/:path*",
      "destination": "https://unpkg.com/@ffmpeg/core@0.12.6/dist/:path*"
    }
  ]
}
```

### 2.2 环境变量配置

在 Vercel Dashboard 配置以下环境变量：

| 变量名 | 环境 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Supabase Service Key |
| `UPSTASH_REDIS_REST_URL` | Production, Preview | Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview | Redis Token |
| `R2_ACCOUNT_ID` | Production | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | Production | R2 Access Key |
| `R2_SECRET_ACCESS_KEY` | Production | R2 Secret Key |
| `R2_BUCKET_NAME` | Production | R2 Bucket 名称 |
| `ANTHROPIC_API_KEY` | Production | Claude API Key |
| `MINIMAX_API_KEY` | Production | MiniMax API Key |
| `ENCRYPTION_KEY` | Production | 数据加密密钥 |

### 2.3 部署分支策略

```
main ──────────────────────────────────────────► Production
                                                (whyfire.com)

develop ───────────────────────────────────────► Preview
                                                (whyfire-git-develop.vercel.app)

feature/* ─────────────────────────────────────► Preview
                                                (whyfire-git-feature-xxx.vercel.app)
```

---

## 3. CI/CD 流程

### 3.1 GitHub Actions 配置

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build

  deploy-preview:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref != 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 3.2 包管理

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "db:generate": "supabase db generate",
    "db:push": "supabase db push",
    "db:migrate": "supabase migration new"
  }
}
```

---

## 4. 监控与告警

### 4.1 Sentry 集成

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', 'whyfire.com'],
    }),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
})

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
  tracesSampleRate: 0.1,
})
```

### 4.2 日志规范

```typescript
// lib/logger.ts
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
})

// 结构化日志
export function logInfo(
  module: string,
  message: string,
  data?: Record<string, any>
) {
  logger.info({ module, ...data }, message)
}

export function logError(
  module: string,
  message: string,
  error: Error,
  data?: Record<string, any>
) {
  logger.error({ module, error: error.message, stack: error.stack, ...data }, message)
}

export function logWarn(
  module: string,
  message: string,
  data?: Record<string, any>
) {
  logger.warn({ module, ...data }, message)
}
```

### 4.3 监控指标

```typescript
// lib/monitoring/metrics.ts
import { Registry, Counter, Histogram, Gauge } from 'prom-client'

const register = new Registry()

// API 请求计数
export const apiRequestCounter = new Counter({
  name: 'api_requests_total',
  help: 'Total API requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
})

// API 响应时间
export const apiDurationHistogram = new Histogram({
  name: 'api_duration_seconds',
  help: 'API response duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
})

// 视频生成计数
export const videoGenerationCounter = new Counter({
  name: 'video_generation_total',
  help: 'Total video generations',
  labelNames: ['scene', 'dialect', 'status'],
  registers: [register],
})

// 音乐生成计数
export const musicGenerationCounter = new Counter({
  name: 'music_generation_total',
  help: 'Total music generations',
  labelNames: ['dialect', 'style', 'status'],
  registers: [register],
})

// 活跃用户数
export const activeUsersGauge = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  registers: [register],
})

export { register }
```

### 4.4 告警规则

| 指标 | 阈值 | 告警方式 | 处理建议 |
|------|------|----------|----------|
| 页面加载时间 | > 3s | 邮件 | 检查资源大小、CDN |
| API 响应时间 | > 5s | 邮件 | 检查数据库、API |
| 服务可用率 | < 99% | 短信 | 检查 Vercel 状态 |
| 错误率 | > 5% | 邮件 | 查看 Sentry |
| 支付失败率 | > 10% | 短信 | 检查支付服务 |

---

## 5. 数据库迁移

### 5.1 Supabase CLI 配置

```toml
# supabase/config.toml
[api]
port = 54321

[db]
port = 54322

[studio]
port = 54323

[inbucket]
port = 54324

[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
```

### 5.2 迁移脚本示例

```sql
-- supabase/migrations/20260318000001_init_schema.sql

-- 创建枚举类型
CREATE TYPE scene_type AS ENUM ('product', 'funny', 'ip', 'vlog');
CREATE TYPE dialect_type AS ENUM ('mandarin', 'dongbei', 'cantonese', 'sichuan');
CREATE TYPE video_status AS ENUM ('draft', 'generating', 'completed', 'failed');

-- 创建 profiles 表
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  nickname VARCHAR(50),
  avatar_url VARCHAR(500),
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Public profiles are viewable"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 创建索引
CREATE INDEX idx_profiles_email ON public.profiles(email);
```

### 5.3 迁移命令

```bash
# 创建新迁移
supabase migration new add_subscriptions_table

# 生成类型
supabase gen types typescript --local > src/types/database.ts

# 推送到远程
supabase db push

# 重置本地数据库
supabase db reset
```

---

## 6. 文件存储

### 6.1 Cloudflare R2 配置

```typescript
// lib/storage/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!

export async function uploadFile(
  key: string,
  body: Buffer | ReadableStream,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

  return `https://${process.env.R2_PUBLIC_URL}/${key}`
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: 3600 }
  )
}

// 文件路径规范
export function generateStoragePath(type: 'video' | 'music' | 'image', userId: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${type}s/${userId}/${year}/${month}/${nanoid(16)}`
}
```

### 6.2 文件清理策略

```typescript
// scripts/cleanup-expired-files.ts
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'

// 每日运行，清理过期临时文件
export async function cleanupExpiredFiles() {
  const expiredDate = new Date()
  expiredDate.setDate(expiredDate.getDate() - 7) // 7 天前

  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: 'temp/',
  })

  const response = await r2Client.send(listCommand)

  for (const object of response.Contents || []) {
    if (object.LastModified && object.LastModified < expiredDate) {
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: object.Key,
        })
      )
      console.log(`Deleted: ${object.Key}`)
    }
  }
}
```

---

## 7. 备份策略

### 7.1 数据库备份

Supabase 自动备份策略：

| 计划 | 备份频率 | 保留时间 |
|------|----------|----------|
| Free | 无自动备份 | - |
| Pro | 每日 | 7 天 |
| Team | 每日 | 14 天 |

### 7.2 手动备份脚本

```bash
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="whyfire_backup_$DATE.sql"

# 使用 pg_dump 备份
pg_dump $DATABASE_URL > "backups/$BACKUP_FILE"

# 上传到 R2
aws s3 cp "backups/$BACKUP_FILE" "s3://$R2_BUCKET/backups/$BACKUP_FILE"

# 清理本地备份（保留最近 7 个）
ls -t backups/*.sql | tail -n +8 | xargs rm -f

echo "Backup completed: $BACKUP_FILE"
```

### 7.3 恢复流程

```bash
# 从备份恢复
psql $DATABASE_URL < backups/whyfire_backup_20260318.sql

# 或使用 Supabase Dashboard 的恢复功能
```

---

## 8. 性能优化

### 8.1 缓存策略

```typescript
// lib/cache/strategies.ts

// 页面缓存
export const pageCacheConfig = {
  // 首页 - ISR，每 5 分钟重新生成
  '/': { revalidate: 300 },
  // 定价页 - ISR，每小时重新生成
  '/pricing': { revalidate: 3600 },
  // 模板页 - ISR，每 10 分钟重新生成
  '/templates': { revalidate: 600 },
}

// API 缓存
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached) return cached

  const data = await fetcher()
  await redis.set(key, data, { ex: ttl })

  return data
}

// 使用示例
export async function getTemplates(category?: string) {
  const key = `templates:${category || 'all'}`
  return withCache(key, () => fetchTemplatesFromDB(category), 300)
}
```

### 8.2 图片优化

```typescript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'whyfire.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

### 8.3 代码分割

```typescript
// 动态导入大型组件
const VideoSynthesizer = dynamic(
  () => import('@/components/features/video/video-synthesizer'),
  {
    loading: () => <VideoSynthesizerSkeleton />,
    ssr: false, // 仅客户端渲染
  }
)

const FFmpegWasm = dynamic(
  () => import('@/lib/ffmpeg'),
  {
    loading: () => <p>加载视频处理引擎...</p>,
    ssr: false,
  }
)
```

---

## 9. 灾难恢复

### 9.1 恢复时间目标 (RTO/RPO)

| 场景 | RTO | RPO | 恢复方式 |
|------|-----|-----|----------|
| 应用故障 | 5 分钟 | 0 | Vercel 自动回滚 |
| 数据库故障 | 1 小时 | 1 小时 | Supabase 备份恢复 |
| 区域故障 | 30 分钟 | 0 | Vercel 自动切换 |
| 数据损坏 | 4 小时 | 24 小时 | 手动备份恢复 |

### 9.2 故障演练

```markdown
## 故障演练清单

### 场景 1: 应用部署失败
1. Vercel 自动回滚到上一个版本
2. 检查构建日志
3. 修复问题后重新部署

### 场景 2: 数据库不可用
1. 检查 Supabase 状态页
2. 如需要，从备份恢复
3. 切换到只读模式（如有副本）

### 场景 3: 第三方 API 故障
1. 启用降级模式
2. 显示友好的错误信息
3. 监控 API 恢复状态
```

---

## 10. 运维检查清单

### 10.1 日常检查

- [ ] 检查 Vercel 部署状态
- [ ] 检查 Sentry 错误报告
- [ ] 检查 API 响应时间
- [ ] 检查支付成功率

### 10.2 周检查

- [ ] 检查存储使用量
- [ ] 检查 API 使用量
- [ ] 检查数据库大小
- [ ] 检查备份完整性

### 10.3 月检查

- [ ] 轮换敏感密钥
- [ ] 更新依赖版本
- [ ] 审查访问日志
- [ ] 检查成本报告

---

*返回 [TDD 主文档](./TDD.md)*
