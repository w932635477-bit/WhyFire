# WhyFire v2.0 API 接口规范

> 返回 [TDD 主文档](./TDD.md)

---

## 1. API 设计原则

### 1.1 RESTful 规范

| 规范 | 说明 |
|------|------|
| **资源命名** | 使用复数名词，如 `/api/videos` |
| **HTTP 方法** | GET(读), POST(创), PUT(替), PATCH(更), DELETE(删) |
| **版本控制** | 暂不需要，后续可通过 `/api/v2/` 引入 |
| **响应格式** | JSON，统一结构 |

### 1.2 统一响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  code: 0
  message: 'success'
  data: T
}

// 错误响应
interface ErrorResponse {
  code: number  // 错误码
  message: string
  data: null
}

// 分页响应
interface PaginatedResponse<T> {
  code: 0
  message: 'success'
  data: {
    items: T[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }
}
```

### 1.3 错误码设计

```
格式：ABCDE
- A: 模块 (1-9)
- B: 子模块 (0-9)
- CDE: 具体错误 (001-999)

模块划分：
1xxxx: 系统错误
2xxxx: 用户模块
3xxxx: 歌词模块
4xxxx: 音乐模块
5xxxx: 视频模块
6xxxx: 支付模块
```

| 错误码 | 错误信息 | HTTP 状态码 |
|--------|----------|-------------|
| 10001 | 系统繁忙 | 500 |
| 10002 | 请求参数错误 | 400 |
| 10003 | 请求频率超限 | 429 |
| 20001 | 用户不存在 | 404 |
| 20002 | 密码错误 | 401 |
| 20003 | 账号已被封禁 | 403 |
| 20004 | 积分不足 | 402 |
| 30001 | 歌词生成失败 | 500 |
| 30002 | 内容包含敏感词 | 400 |
| 40001 | 音乐生成失败 | 500 |
| 50001 | 视频上传失败 | 500 |
| 50002 | 视频合成失败 | 500 |
| 60001 | 订单创建失败 | 500 |
| 60002 | 支付失败 | 402 |

---

## 2. 认证接口

### 2.1 发送验证码

```
POST /api/auth/send-code
```

**请求体：**
```json
{
  "email": "user@example.com"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "expiresIn": 300
  }
}
```

### 2.2 邮箱登录/注册

```
POST /api/auth/login
```

**请求体：**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": null,
      "avatarUrl": null,
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1...",
    "expiresIn": 3600
  }
}
```

### 2.3 刷新 Token

```
POST /api/auth/refresh
```

**请求体：**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

### 2.4 退出登录

```
POST /api/auth/logout
```

**请求头：**
```
Authorization: Bearer {accessToken}
```

---

## 3. 用户接口

### 3.1 获取当前用户信息

```
GET /api/user/profile
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "创作者小明",
    "avatarUrl": "https://r2.example.com/avatars/xxx.jpg",
    "role": "user",
    "points": {
      "balance": 45,
      "totalEarned": 100,
      "totalSpent": 55
    },
    "subscription": {
      "planType": "light",
      "status": "active",
      "endDate": "2026-04-18"
    }
  }
}
```

### 3.2 更新用户信息

```
PATCH /api/user/profile
```

**请求体：**
```json
{
  "nickname": "新昵称",
  "avatarUrl": "https://..."
}
```

---

## 4. 歌词接口

### 4.1 生成歌词

```
POST /api/lyrics/generate
```

**请求体：**
```json
{
  "scene": "product",
  "dialect": "dongbei",
  "productName": "星空手机壳",
  "sellingPoints": ["防摔", "轻薄", "星空图案"],
  "style": "funny",
  "duration": 30,
  "customPrompt": "加入遥遥领先的梗"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "lyricsId": "uuid",
    "content": "老铁们看过来，这手机壳真带劲\n防摔又轻薄，必须杠杠滴...",
    "wordCount": 156,
    "estimatedDuration": 28,
    "dialect": "dongbei"
  }
}
```

### 4.2 AI 对话修改歌词

```
POST /api/lyrics/chat
```

**请求体：**
```json
{
  "lyricsId": "uuid",
  "message": "再搞笑一点，节奏快一点"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "lyricsId": "uuid",
    "content": "更新后的歌词内容...",
    "chatHistory": [
      { "role": "user", "content": "再搞笑一点" },
      { "role": "assistant", "content": "好的，我来调整..." }
    ],
    "version": 2
  }
}
```

### 4.3 重新生成歌词

```
POST /api/lyrics/regenerate
```

**请求体：**
```json
{
  "lyricsId": "uuid"
}
```

### 4.4 预览歌词 (TTS)

```
POST /api/lyrics/preview
```

**请求体：**
```json
{
  "lyricsId": "uuid",
  "dialect": "dongbei"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "audioUrl": "https://r2.example.com/preview/xxx.mp3",
    "duration": 28
  }
}
```

---

## 5. 音乐接口

### 5.1 创建音乐生成任务

```
POST /api/music/generate
```

**请求体：**
```json
{
  "lyricsId": "uuid",
  "dialect": "dongbei",
  "style": "trap",
  "bpm": 120
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "taskId": "uuid",
    "status": "pending",
    "estimatedTime": 30
  }
}
```

### 5.2 查询音乐生成状态

```
GET /api/music/status/:taskId
```

**响应（处理中）：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "taskId": "uuid",
    "status": "processing",
    "progress": 60,
    "message": "正在生成伴奏..."
  }
}
```

**响应（完成）：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "taskId": "uuid",
    "status": "completed",
    "progress": 100,
    "musicUrl": "https://r2.example.com/music/xxx.mp3",
    "duration": 30
  }
}
```

### 5.3 预览音乐

```
GET /api/music/preview/:taskId
```

直接返回音频文件流。

---

## 6. 视频接口

### 6.1 上传素材

```
POST /api/video/upload
Content-Type: multipart/form-data
```

**请求体：**
```
file: (binary)
type: "video" | "image"
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "fileId": "uuid",
    "url": "https://r2.example.com/uploads/xxx.mp4",
    "type": "video",
    "size": 52428800,
    "duration": 30,
    "width": 1920,
    "height": 1080
  }
}
```

### 6.2 创建视频合成任务

```
POST /api/video/synthesize
```

**请求体：**
```json
{
  "lyricsId": "uuid",
  "musicId": "uuid",
  "mediaFiles": [
    { "fileId": "uuid", "type": "video" },
    { "fileId": "uuid", "type": "image" }
  ],
  "templateId": "uuid",
  "subtitleStyle": "dynamic_1",
  "effects": ["filter_warm", "transition_fade"],
  "outputQuality": "720p"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "videoId": "uuid",
    "status": "draft"
  }
}
```

### 6.3 获取视频合成配置（供 FFmpeg.wasm 使用）

```
GET /api/video/config/:videoId
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "videoId": "uuid",
    "musicUrl": "https://...",
    "mediaFiles": [
      { "url": "https://...", "type": "video", "duration": 10 },
      { "url": "https://...", "type": "image" }
    ],
    "lyrics": {
      "content": "歌词内容...",
      "timestamps": [
        { "word": "老铁们", "start": 0, "end": 0.5 },
        { "word": "看过来", "start": 0.5, "end": 1.0 }
      ]
    },
    "subtitleStyle": {
      "font": "Noto Sans SC",
      "fontSize": 48,
      "color": "#FFFFFF",
      "effect": "bounce"
    },
    "effects": {
      "filters": ["warm"],
      "transitions": ["fade"]
    },
    "output": {
      "width": 1280,
      "height": 720,
      "fps": 30,
      "format": "mp4"
    }
  }
}
```

### 6.4 更新视频合成状态

```
PATCH /api/video/status/:videoId
```

**请求体：**
```json
{
  "status": "completed",
  "videoUrl": "blob:xxx" // 或 base64
}
```

> 注：实际视频在浏览器端合成后直接下载，此接口仅更新状态

### 6.5 获取视频详情

```
GET /api/video/:videoId
```

### 6.6 获取我的视频列表

```
GET /api/video/list?page=1&pageSize=10&status=completed
```

### 6.7 删除视频

```
DELETE /api/video/:videoId
```

---

## 7. 模板接口

### 7.1 获取模板列表

```
GET /api/templates?category=product
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "产品推广-简约风",
        "category": "product",
        "previewUrl": "https://...",
        "isPremium": false,
        "useCount": 1234
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  }
}
```

### 7.2 获取模板详情

```
GET /api/templates/:templateId
```

---

## 8. 积分接口

### 8.1 获取积分余额

```
GET /api/points/balance
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "balance": 45,
    "totalEarned": 100,
    "totalSpent": 55
  }
}
```

### 8.2 获取积分记录

```
GET /api/points/records?page=1&pageSize=20
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "spend",
        "amount": -2,
        "balanceAfter": 43,
        "remark": "生成视频",
        "createdAt": "2026-03-18T10:30:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

### 8.3 每日签到

```
POST /api/points/signin
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "earned": 1,
    "balance": 46,
    "alreadySignedIn": false
  }
}
```

---

## 9. 订阅接口

### 9.1 获取订阅方案

```
GET /api/subscription/plans
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "plans": [
      {
        "id": "free",
        "name": "免费版",
        "price": 0,
        "points": 2,
        "features": ["基础场景", "基础字幕", "有水印", "720p"],
        "isPopular": false
      },
      {
        "id": "light",
        "name": "轻量版",
        "price": 89,
        "points": 60,
        "features": ["全部场景", "高级字幕", "无水印", "1080p", "2种方言"],
        "isPopular": true
      },
      {
        "id": "pro",
        "name": "专业版",
        "price": 139,
        "points": 200,
        "features": ["全部场景", "高级特效", "无水印", "1080p", "全部方言", "优先队列"],
        "isPopular": false
      }
    ],
    "pointPackages": [
      { "id": "small", "points": 10, "price": 9.9 },
      { "id": "medium", "points": 35, "price": 29 },
      { "id": "large", "points": 80, "price": 59 }
    ]
  }
}
```

### 9.2 获取当前订阅状态

```
GET /api/subscription/status
```

### 9.3 取消订阅

```
POST /api/subscription/cancel
```

---

## 10. 支付接口

### 10.1 创建支付订单

```
POST /api/payment/create
```

**请求体：**
```json
{
  "productType": "subscription",
  "productId": "light",
  "paymentMethod": "wechat"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "orderId": "uuid",
    "orderNo": "WF20260318123456",
    "amount": 89,
    "paymentMethod": "wechat",
    "qrCodeUrl": "weixin://wxpay/bizpayurl?...",
    "deepLink": "weixin://...",
    "expiredAt": "2026-03-18T10:45:00Z"
  }
}
```

### 10.2 查询支付状态

```
GET /api/payment/status/:orderId
```

### 10.3 微信支付回调

```
POST /api/payment/wechat/notify
```

> 由微信服务器调用，验证签名后更新订单状态

---

## 11. 限流策略

| 接口类型 | 限制 | 时间窗口 | 备注 |
|----------|------|----------|------|
| 发送验证码 | 5 次 | 1 分钟 | 同一邮箱 |
| 登录/注册 | 5 次 | 1 分钟 | 同一 IP |
| 歌词生成 | 10 次 | 1 分钟 | 登录用户 |
| 音乐生成 | 5 次 | 1 分钟 | 登录用户 |
| 视频合成 | 3 次 | 1 分钟 | 登录用户 |
| 其他 API | 100 次 | 1 分钟 | 登录用户 |
| 游客 API | 20 次 | 1 分钟 | 同一 IP |

---

## 12. API 实现示例

### 12.1 歌词生成 API (Next.js)

```typescript
// app/api/lyrics/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateLyrics } from '@/lib/ai/claude'
import { rateLimit } from '@/lib/rate-limit'
import { validateInput } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // 1. 认证检查
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { code: 20001, message: '请先登录', data: null },
        { status: 401 }
      )
    }

    // 2. 限流检查
    const rateLimitResult = await rateLimit(
      `lyrics:${user.id}`,
      10,
      60
    )
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { code: 10003, message: '请求频率超限', data: null },
        { status: 429 }
      )
    }

    // 3. 参数验证
    const body = await request.json()
    const validation = validateInput(body, lyricsGenerateSchema)
    if (!validation.valid) {
      return NextResponse.json(
        { code: 10002, message: validation.error, data: null },
        { status: 400 }
      )
    }

    // 4. 积分检查
    const points = await checkUserPoints(supabase, user.id, 2)
    if (!points.enough) {
      return NextResponse.json(
        { code: 20004, message: '积分不足', data: null },
        { status: 402 }
      )
    }

    // 5. 内容审核
    const auditResult = await auditContent(body)
    if (!auditResult.pass) {
      return NextResponse.json(
        { code: 30002, message: '内容包含敏感词', data: null },
        { status: 400 }
      )
    }

    // 6. 生成歌词
    const lyrics = await generateLyrics({
      scene: body.scene,
      dialect: body.dialect,
      productName: body.productName,
      sellingPoints: body.sellingPoints,
      customPrompt: body.customPrompt,
    })

    // 7. 保存到数据库
    const { data: savedLyrics, error } = await supabase
      .from('lyrics')
      .insert({
        content: lyrics.content,
        dialect: body.dialect,
        style: body.style,
        chat_history: [{ role: 'assistant', content: lyrics.content }],
      })
      .select()
      .single()

    if (error) throw error

    // 8. 返回结果
    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        lyricsId: savedLyrics.id,
        content: lyrics.content,
        wordCount: lyrics.wordCount,
        estimatedDuration: lyrics.estimatedDuration,
        dialect: body.dialect,
      },
    })

  } catch (error) {
    console.error('Lyrics generation error:', error)
    return NextResponse.json(
      { code: 30001, message: '歌词生成失败', data: null },
      { status: 500 }
    )
  }
}
```

### 12.2 音乐生成 API (异步)

```typescript
// app/api/music/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { v4 as uuidv4 } from 'uuid'

const redis = Redis.fromEnv()

export async function POST(request: NextRequest) {
  // ... 认证、限流、验证 ...

  const taskId = uuidv4()

  // 创建任务记录
  await redis.hset(`task:music:${taskId}`, {
    status: 'pending',
    progress: 0,
    userId: user.id,
    lyricsId: body.lyricsId,
    dialect: body.dialect,
    style: body.style,
    createdAt: Date.now(),
  })
  await redis.expire(`task:music:${taskId}`, 3600)

  // 加入队列
  await redis.lpush('queue:music_generation', taskId)

  return NextResponse.json({
    code: 0,
    message: 'success',
    data: {
      taskId,
      status: 'pending',
      estimatedTime: 30,
    },
  })
}

// app/api/music/status/[taskId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const task = await redis.hgetall(`task:music:${params.taskId}`)

  if (!task) {
    return NextResponse.json(
      { code: 40001, message: '任务不存在', data: null },
      { status: 404 }
    )
  }

  return NextResponse.json({
    code: 0,
    message: 'success',
    data: task,
  })
}
```

---

*返回 [TDD 主文档](./TDD.md)*
