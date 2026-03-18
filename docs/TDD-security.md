# WhyFire v2.0 安全设计

> 返回 [TDD 主文档](./TDD.md)

---

## 1. 安全架构概述

### 1.1 安全原则

| 原则 | 说明 |
|------|------|
| **纵深防御** | 多层安全措施，单一失效不影响整体 |
| **最小权限** | 仅授予必要的最小权限 |
| **默认安全** | 默认配置为安全状态 |
| **数据隔离** | 用户数据严格隔离 |
| **可审计** | 关键操作可追溯 |

### 1.2 威胁模型

```
┌─────────────────────────────────────────────────────────────┐
│                        攻击面分析                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   前端      │  │   API       │  │   数据存储  │         │
│  │  - XSS     │  │  - 注入     │  │  - 泄露    │         │
│  │  - CSRF    │  │  - 认证绕过  │  │  - 篡改    │         │
│  │  - 点击劫持 │  │  - 限流绕过  │  │  - 删除    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   AI 服务   │  │   支付      │  │   内容      │         │
│  │  - API 滥用 │  │  - 支付绕过  │  │  - 敏感词  │         │
│  │  - Prompt   │  │  - 金额篡改  │  │  - 版权    │         │
│  │    注入     │  │  - 重放攻击  │  │  - 违规    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 认证与授权

### 2.1 认证机制

采用 **Supabase Auth** + **JWT** 的认证方案：

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  用户    │ ──► │ Supabase │ ──► │  JWT     │
│  登录    │     │  Auth    │     │  Token   │
└──────────┘     └──────────┘     └──────────┘
                       │
                       ▼
                ┌──────────┐
                │  邮箱    │
                │  验证码  │
                └──────────┘
```

### 2.2 JWT Token 结构

```typescript
// JWT Payload
interface JWTPayload {
  sub: string        // 用户 ID
  email: string      // 邮箱
  role: string       // 角色
  iat: number        // 签发时间
  exp: number        // 过期时间
  aud: string        // 受众
  iss: string        // 签发者
}
```

### 2.3 Token 刷新策略

```typescript
// lib/auth/token-refresh.ts
export function setupTokenRefresh() {
  // Access Token: 1 小时过期
  // Refresh Token: 7 天过期

  // 自动刷新逻辑
  setInterval(async () => {
    const session = await supabase.auth.getSession()
    const expiresAt = session?.expires_at

    if (expiresAt && Date.now() / 1000 > expiresAt - 300) {
      // 提前 5 分钟刷新
      await supabase.auth.refreshSession()
    }
  }, 60000) // 每分钟检查一次
}
```

### 2.4 中间件认证

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 需要认证的路由
const protectedRoutes = ['/create', '/my-videos', '/profile', '/settings']
// 仅限游客的路由
const guestOnlyRoutes = ['/login', '/register']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // 检查受保护路由
  if (protectedRoutes.some(route => path.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // 检查仅限游客路由
  if (guestOnlyRoutes.some(route => path.startsWith(route))) {
    if (session) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### 2.5 行级安全 (RLS)

Supabase RLS 确保数据隔离：

```sql
-- 用户只能访问自己的数据
CREATE POLICY "Users can access own data"
  ON public.videos FOR ALL
  USING (auth.uid() = user_id);

-- 管理员可以访问所有数据
CREATE POLICY "Admins can access all data"
  ON public.videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

---

## 3. API 安全

### 3.1 限流策略

使用 Upstash Redis 实现滑动窗口限流：

```typescript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

interface RateLimitConfig {
  key: string
  limit: number
  window: number // 秒
}

export async function rateLimit(
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const windowStart = now - config.window * 1000

  const key = `ratelimit:${config.key}`

  // 移除窗口外的请求
  await redis.zremrangebyscore(key, 0, windowStart)

  // 获取当前窗口内的请求数
  const count = await redis.zcard(key)

  if (count >= config.limit) {
    const oldest = await redis.zrange(key, 0, 0, { withScores: true })
    const resetAt = oldest.length > 0 ? oldest[0].score + config.window * 1000 : now

    return {
      success: false,
      remaining: 0,
      resetAt,
    }
  }

  // 添加当前请求
  await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` })
  await redis.expire(key, config.window)

  return {
    success: true,
    remaining: config.limit - count - 1,
    resetAt: now + config.window * 1000,
  }
}
```

### 3.2 限流配置

```typescript
// lib/rate-limit-config.ts
export const rateLimitConfigs = {
  // 认证相关
  sendCode: { limit: 5, window: 60 },      // 发送验证码
  login: { limit: 5, window: 60 },         // 登录

  // 业务 API
  lyricsGenerate: { limit: 10, window: 60 },
  musicGenerate: { limit: 5, window: 60 },
  videoSynthesize: { limit: 3, window: 60 },

  // 游客
  guest: { limit: 20, window: 60 },
  guestDaily: { limit: 1, window: 86400 }, // 每日 1 个视频
}

// 使用示例
export async function checkRateLimit(
  type: keyof typeof rateLimitConfigs,
  identifier: string
) {
  const config = rateLimitConfigs[type]
  return rateLimit({
    key: `${type}:${identifier}`,
    limit: config.limit,
    window: config.window,
  })
}
```

### 3.3 输入验证

使用 Zod 进行严格的输入验证：

```typescript
// lib/validation/schemas.ts
import { z } from 'zod'

export const lyricsGenerateSchema = z.object({
  scene: z.enum(['product', 'funny', 'ip', 'vlog']),
  dialect: z.enum(['mandarin', 'dongbei', 'cantonese', 'sichuan']),
  productName: z.string().min(1).max(50).optional(),
  sellingPoints: z.array(z.string().max(30)).max(5).optional(),
  style: z.enum(['funny', 'cool', 'emotional', 'energetic']).optional(),
  duration: z.number().int().min(15).max(60).default(30),
  customPrompt: z.string().max(500).optional(),
})

export const videoUploadSchema = z.object({
  type: z.enum(['video', 'image']),
  size: z.number().max(100 * 1024 * 1024), // 最大 100MB
  mimeType: z.enum([
    'video/mp4', 'video/quicktime', 'video/webm',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  ]),
})

// 验证函数
export function validateInput<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { valid: true; data: T } | { valid: false; error: string } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { valid: true, data: result.data }
  }

  const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  return { valid: false, error: errors.join('; ') }
}
```

---

## 4. 内容安全

### 4.1 敏感词过滤

```typescript
// lib/content/sensitive-words.ts
import DFAFilter from 'dfa-filter'

// 敏感词库（示例）
const sensitiveWords = [
  // 政治敏感词
  // 色情低俗词
  // 暴力恐怖词
  // 违法犯罪词
  // ...
]

const filter = new DFAFilter(sensitiveWords)

export function containsSensitiveWord(text: string): boolean {
  return filter.test(text)
}

export function filterSensitiveWord(text: string): string {
  return filter.filter(text, '*')
}

export function getSensitiveWords(text: string): string[] {
  return filter.match(text)
}
```

### 4.2 AI 内容审核

```typescript
// lib/content/moderation.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function moderateContent(content: string): Promise<{
  safe: boolean
  categories: string[]
  confidence: number
}> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `请审核以下内容是否包含不当内容（政治敏感、色情、暴力、违法等）：

内容：
"${content}"

请以 JSON 格式返回审核结果：
{
  "safe": boolean,
  "categories": string[], // 如有违规，列出违规类型
  "confidence": number // 0-1 置信度
}`,
      },
    ],
  })

  const result = JSON.parse(response.content[0].text)
  return result
}
```

### 4.3 文件上传安全

```typescript
// lib/storage/upload-security.ts
import { nanoid } from 'nanoid'
import path from 'path'

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
}

const MAX_SIZES: Record<string, number> = {
  image: 20 * 1024 * 1024,  // 20MB
  video: 100 * 1024 * 1024, // 100MB
}

export function validateUpload(
  file: File
): { valid: true; type: string } | { valid: false; error: string } {
  // 检查文件类型
  let fileType: string | null = null
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(file.type)) {
      fileType = type
      break
    }
  }

  if (!fileType) {
    return { valid: false, error: '不支持的文件类型' }
  }

  // 检查文件大小
  if (file.size > MAX_SIZES[fileType]) {
    return {
      valid: false,
      error: `文件大小超过限制 (${MAX_SIZES[fileType] / 1024 / 1024}MB)`,
    }
  }

  // 验证文件扩展名
  const ext = path.extname(file.name).toLowerCase()
  const allowedExts = {
    image: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    video: ['.mp4', '.mov', '.webm'],
  }

  if (!allowedExts[fileType].includes(ext)) {
    return { valid: false, error: '文件扩展名与内容不匹配' }
  }

  return { valid: true, type: fileType }
}

export function generateSafeFilename(originalName: string): string {
  const ext = path.extname(originalName)
  return `${nanoid(16)}${ext}`
}
```

---

## 5. 支付安全

### 5.1 签名验证

```typescript
// lib/payment/wechat/signature.ts
import crypto from 'crypto'

export function verifyWechatSignature(
  body: string,
  signature: string,
  timestamp: string,
  nonce: string,
  apiV3Key: string
): boolean {
  // 构造验签串
  const message = `${timestamp}\n${nonce}\n${body}\n`

  // 使用 APIv3 Key 生成签名
  const hmac = crypto.createHmac('sha256', apiV3Key)
  hmac.update(message)
  const expectedSignature = hmac.digest('base64')

  return signature === expectedSignature
}

export function generateSignature(
  params: Record<string, any>,
  apiKey: string
): string {
  // 按字典序排序参数
  const sortedKeys = Object.keys(params).sort()
  const paramString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&')

  // 拼接 API Key
  const stringToSign = `${paramString}&key=${apiKey}`

  // MD5 签名
  return crypto
    .createHash('md5')
    .update(stringToSign, 'utf8')
    .digest('hex')
    .toUpperCase()
}
```

### 5.2 订单幂等性

```typescript
// lib/payment/idempotency.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function withIdempotency<T>(
  orderId: string,
  action: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const key = `order:processing:${orderId}`

  // 检查是否正在处理
  const isProcessing = await redis.exists(key)
  if (isProcessing) {
    throw new Error('订单正在处理中，请勿重复提交')
  }

  // 设置处理标记
  await redis.set(key, '1', { ex: ttl })

  try {
    const result = await action()
    return result
  } finally {
    // 处理完成后删除标记
    await redis.del(key)
  }
}
```

### 5.3 金额校验

```typescript
// lib/payment/amount-validation.ts
export function validatePaymentAmount(
  orderAmount: number,
  paidAmount: number,
  tolerance: number = 0.01 // 允许 1 分钱误差
): boolean {
  return Math.abs(orderAmount - paidAmount) <= tolerance
}

// 在回调中使用
export async function handlePaymentCallback(
  orderId: string,
  paidAmount: number
) {
  const order = await getOrder(orderId)

  if (!order) {
    throw new Error('订单不存在')
  }

  if (!validatePaymentAmount(order.amount, paidAmount)) {
    // 记录异常日志
    await logPaymentAnomaly(orderId, order.amount, paidAmount)
    throw new Error('支付金额不匹配')
  }

  // 处理支付成功
  await processPaymentSuccess(order)
}
```

---

## 6. 数据安全

### 6.1 敏感数据加密

```typescript
// lib/crypto/encryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

### 6.2 环境变量安全

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // 必需的环境变量
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  ANTHROPIC_API_KEY: z.string().startsWith('sk-'),
  MINIMAX_API_KEY: z.string().min(1),

  // 加密密钥（32 字节，hex 编码）
  ENCRYPTION_KEY: z.string().length(64),
})

export const env = envSchema.parse(process.env)
```

### 6.3 安全响应头

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

---

## 7. 安全审计

### 7.1 审计日志

```typescript
// lib/audit/logger.ts
interface AuditLog {
  timestamp: Date
  userId?: string
  action: string
  resource: string
  resourceId?: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'failure'
  details?: Record<string, any>
}

export async function logAudit(log: AuditLog) {
  // 写入审计日志表
  await supabase.from('audit_logs').insert({
    user_id: log.userId,
    action: log.action,
    resource: log.resource,
    resource_id: log.resourceId,
    ip_address: log.ipAddress,
    user_agent: log.userAgent,
    status: log.status,
    details: log.details,
    created_at: log.timestamp.toISOString(),
  })
}

// 使用示例
export async function handleLogin(userId: string, req: NextRequest) {
  await logAudit({
    timestamp: new Date(),
    userId,
    action: 'LOGIN',
    resource: 'auth',
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    status: 'success',
  })
}
```

### 7.2 关键操作记录

```typescript
// lib/audit/tracking.ts
const AUDIT_ACTIONS = {
  // 认证相关
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  REGISTER: 'auth.register',
  PASSWORD_CHANGE: 'auth.password_change',

  // 支付相关
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  REFUND: 'payment.refund',

  // 内容相关
  LYRICS_GENERATE: 'content.lyrics_generate',
  MUSIC_GENERATE: 'content.music_generate',
  VIDEO_CREATE: 'content.video_create',
  VIDEO_DELETE: 'content.video_delete',

  // 用户操作
  PROFILE_UPDATE: 'user.profile_update',
  SUBSCRIPTION_CHANGE: 'user.subscription_change',
}

export function trackAction(
  action: keyof typeof AUDIT_ACTIONS,
  context: {
    userId?: string
    resourceId?: string
    status: 'success' | 'failure'
    details?: Record<string, any>
  },
  req?: NextRequest
) {
  return logAudit({
    timestamp: new Date(),
    userId: context.userId,
    action: AUDIT_ACTIONS[action],
    resource: action.split('_')[0].toLowerCase(),
    resourceId: context.resourceId,
    ipAddress: req?.ip || 'unknown',
    userAgent: req?.headers.get('user-agent') || 'unknown',
    status: context.status,
    details: context.details,
  })
}
```

---

## 8. 安全检查清单

### 8.1 开发阶段

- [ ] 所有 API 使用 Zod 验证输入
- [ ] 敏感数据加密存储
- [ ] API Key 不暴露到客户端
- [ ] 使用参数化查询防止 SQL 注入
- [ ] 用户输入进行 HTML 转义
- [ ] 实现适当的错误处理，不泄露敏感信息

### 8.2 部署阶段

- [ ] 启用 HTTPS
- [ ] 配置安全响应头
- [ ] 启用 RLS (Row Level Security)
- [ ] 配置 API 限流
- [ ] 设置 CSP (Content Security Policy)
- [ ] 配置 CORS 策略

### 8.3 运营阶段

- [ ] 定期轮换 API Key
- [ ] 监控异常登录行为
- [ ] 定期审计权限设置
- [ ] 监控支付异常
- [ ] 定期更新依赖包
- [ ] 备份关键数据

---

*返回 [TDD 主文档](./TDD.md)*
