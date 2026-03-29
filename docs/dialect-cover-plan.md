# WhyFire 方言翻唱（Upload & Cover）+ 音乐视频方案

## Context

WhyFire 当前 pipeline：Claude 歌词 → Suno Add Vocals → Seed-VC 声音克隆 → MP3。这个 pipeline 优化的是"唱得好"，但用户的实际需求是"能传播"。声音克隆后的 AI 唱功打折，传播力反而下降。

产品决策：**传播大于唱 rap**。新增 SunoAPI 的 Upload & Cover（方言翻唱热门歌）和 Create Music Video（自动生成 MP4）功能。Seed-VC 保留为高级功能，但从主流程中移除。

核心理念：**用户上传一首热门歌 → 选方言 → Suno 用方言翻唱 → 自动生成视频 → 一键分享。2 步，30 秒。**

## 架构

```
新流程（Cover Pipeline）:
  用户上传歌曲 → OSS
  → CoverGenerator.generate()
    → Step 1: 可选 AI 歌词（Claude + 品牌信息）
    → Step 2: SunoAPI Upload & Cover（方言翻唱）
    → Step 3: 可选 SunoAPI Create Music Video
  → MP4 / MP3 下载分享

旧流程（Rap Pipeline，保留不动）:
  用户录音 → CosyVoice 声音克隆
  → RapGeneratorSunoRvc.generate()
    → Claude 歌词 → Suno Add Vocals → Seed-VC 换声
  → MP3 下载分享
```

## 实施步骤

### Step 1: 扩展 SunoApiClient

**修改文件**: `src/lib/music/suno-api-client.ts`

新增类型：
```typescript
export interface UploadCoverRequest {
  uploadUrl: string         // 原曲公网 URL
  customMode: boolean       // true=自定义歌词/风格
  instrumental: boolean     // false=含人声
  model?: SunoApiModel
  prompt?: string           // 自定义歌词
  style?: string            // 方言风格标签
  title?: string
  negativeTags?: string
  vocalGender?: 'm' | 'f'
  styleWeight?: number      // 0-1
  audioWeight?: number      // 0-1，保留原曲程度
  callBackUrl?: string
}

export interface UploadCoverResult {
  taskId: string
  status: 'pending' | 'completed' | 'failed'
  audioUrl?: string
  audioId?: string           // 关键：MV 生成需要
  duration?: number
  title?: string
  tags?: string
  imageUrl?: string
  error?: string
}

export interface CreateMusicVideoRequest {
  taskId: string             // Cover 生成的 taskId
  audioId: string            // Cover 生成的 audioId
  author?: string
  callBackUrl?: string
}

export interface MusicVideoResult {
  taskId: string
  status: 'pending' | 'completed' | 'failed'
  videoUrl?: string
  error?: string
}
```

新增方法：
- `uploadCover(request)` — POST `/api/v1/generate/upload-cover`，复用 `fetchRecordInfo` 轮询。关键：从 `sunoData[0].id` 提取 `audioId`
- `createMusicVideo(request)` — POST `/api/v1/mp4/create`，用新的 `fetchMp4RecordInfo` 轮询 `GET /api/v1/mp4/record-info?taskId=xxx`
- `getMusicVideoStatus(taskId)` — 外部轮询用

### Step 2: 创建 CoverGenerator

**新建文件**: `src/lib/services/cover-generator.ts`

```typescript
export type CoverGenerationStep = 'lyrics' | 'cover' | 'music-video'

export interface CoverGenerationParams {
  userId: string
  songUrl: string            // 原曲公网 URL（OSS 或外链）
  dialect: DialectCode
  customLyrics?: string      // 自定义歌词
  brandMessage?: string      // 品牌信息，AI 据此生成歌词
  vocalGender?: 'm' | 'f'
}

export interface CoverGenerationResult {
  audioUrl: string
  audioId: string            // MV 需要此字段
  taskId: string
  duration: number
  lyrics?: string
  dialect: DialectCode
  pipeline: 'upload-cover'
}
```

CoverGenerator 类：
- `generate(params, onProgress?)` — 2 步翻唱生成
  - Step 1（可选）：如果没给 customLyrics 但给了 brandMessage，用 Claude 生成带品牌信息的歌词。复用 `generateWithClaude` + `buildViralLyricsPrompt`
  - Step 2：调用 `sunoApiClient.uploadCover()` + 方言风格
- `createMusicVideo(taskId, audioId)` — 生成 MV
- `checkServices()` — 只检查 SunoAPI（不需要 Seed-VC）

方言到翻唱风格映射（区别于 rap 风格，更偏流行/民谣）：
```typescript
const DIALECT_COVER_STYLE: Partial<Record<DialectCode, string>> = {
  original: 'chinese pop, mandarin pop',
  cantonese: 'cantonese pop, hong kong pop',
  sichuan: 'sichuan dialect pop, chinese folk pop',
  dongbei: 'northeastern chinese pop, dongbei folk pop',
  shaanxi: 'shaanxi dialect pop, qinqiang pop',
  wu: 'wu dialect pop, shanghai pop',
  minnan: 'taiwanese pop, minnan pop',
  tianjin: 'tianjin dialect pop, northern folk pop',
  nanjing: 'nanjing dialect pop, jiangsu folk pop',
}
```

audioWeight 默认 0.5（保留一半原曲旋律，一半方言风格）。

### Step 3: 创建 API 路由

**新建文件**: `src/app/api/cover/upload/route.ts`

- `POST /api/cover/upload` — 上传用户歌曲到 OSS `cover-uploads/` 目录
- 接受 FormData（audio file），返回 `{ url, objectKey }`
- 文件大小限制 20MB

**新建文件**: `src/app/api/cover/generate/route.ts`

- `POST /api/cover/generate` — 方言翻唱生成
  - Body: `{ userId, songUrl, dialect, customLyrics?, brandMessage?, vocalGender? }`
  - 返回: `{ taskId, audioUrl, audioId, duration, lyrics?, dialect, pipeline: 'upload-cover' }`
  - 限流：3 次/分钟
  - 复用 `withOptionalAuth` 和 `checkRateLimit`
- `GET /api/cover/generate?action=services` — 服务状态

**新建文件**: `src/app/api/cover/music-video/route.ts`

- `POST /api/cover/music-video` — 生成 MV
  - Body: `{ taskId, audioId, author? }`
  - 返回: `{ taskId, videoUrl?, status }`
  - 限流：2 次/分钟
- `GET /api/cover/music-video?taskId=xxx` — 轮询 MV 状态

**修改文件**: `src/app/api/audio-proxy/route.ts`
- `ALLOWED_PATH_PREFIXES` 数组新增 `'cover-uploads/'`

### Step 4: 前端 - 封面创作流程

**新建文件**: `src/app/sonic-gallery/cover/page.tsx`

3 步向导（比现有的 4 步简单，不需要声音克隆）：

```
Step 1: 上传原唱
  - 文件上传（MP3/WAV，最大 20MB）
  - 或粘贴歌曲 URL
  - 预览播放器
  → 调用 POST /api/cover/upload 上传到 OSS

Step 2: 选方言 + 改歌词
  - 方言选择器（9 种方言，复用现有数据）
  - 歌词模式切换：「保留原词」/「自定义歌词」/「AI 创作」
  - 保留原词：不传 prompt，Suno 用原歌词 + 方言唱
  - 自定义歌词：textarea 编辑
  - AI 创作：输入品牌信息 → Claude 生成方言歌词
  - 声音性别选择（男/女）

Step 3: 预览 + 生成
  - 生成按钮 → POST /api/cover/generate
  - 进度条（歌词 → 翻唱 → 可选 MV）
  - 音频播放器 + 歌词同步
  - 「生成 MV」按钮 → POST /api/cover/music-video
  - 视频播放器 + 下载/分享
```

**新建文件**:
- `src/app/sonic-gallery/cover/cover-context.tsx` — 状态管理（参考 create-context.tsx）
- `src/app/sonic-gallery/cover/step-1-upload.tsx` — 歌曲上传
- `src/app/sonic-gallery/cover/step-2-dialect-lyrics.tsx` — 方言 + 歌词
- `src/app/sonic-gallery/cover/step-3-preview.tsx` — 生成 + 预览 + MV

**修改文件**: `src/lib/services/create-api.ts`

新增函数：
- `uploadSong(file: File)` — 上传歌曲到 OSS
- `generateCover(params)` — 翻唱生成
- `createMusicVideo(params)` — MV 生成
- `getMusicVideoStatus(taskId)` — 轮询 MV 状态

### Step 5: 更新落地页

**修改文件**: `src/app/sonic-gallery/page.tsx`

- Hero 区域改为双 CTA：
  - 「方言翻唱」→ `/sonic-gallery/cover`（主推，视觉权重更高）
  - 「原创 Rap」→ `/sonic-gallery/create`（保留）
- 标题从"用你的声音，唱方言 Rap"改为"用方言翻唱热门歌，30 秒出片"
- 副本更新：强调传播性和速度
- 快速体验流程更新为 3 步（上传歌曲 → 选方言 → 出片分享）
- 数据展示更新：30s 生成、9 种方言、MV 视频直出

## 关键文件清单

### 新建（9 个文件）

| 文件 | 用途 |
|------|------|
| `src/lib/services/cover-generator.ts` | 翻唱生成器，2 步 pipeline |
| `src/app/api/cover/upload/route.ts` | 上传原曲到 OSS |
| `src/app/api/cover/generate/route.ts` | 翻唱生成 API |
| `src/app/api/cover/music-video/route.ts` | MV 生成 API |
| `src/app/sonic-gallery/cover/page.tsx` | 翻唱创建页面 |
| `src/app/sonic-gallery/cover/cover-context.tsx` | 翻唱流程状态 |
| `src/app/sonic-gallery/cover/step-1-upload.tsx` | 上传歌曲组件 |
| `src/app/sonic-gallery/cover/step-2-dialect-lyrics.tsx` | 方言 + 歌词组件 |
| `src/app/sonic-gallery/cover/step-3-preview.tsx` | 生成 + 预览 + MV 组件 |

### 修改（4 个文件）

| 文件 | 改动 |
|------|------|
| `src/lib/music/suno-api-client.ts` | 新增 `uploadCover()`、`createMusicVideo()` 方法和类型 |
| `src/lib/services/create-api.ts` | 新增翻唱和 MV 相关 API 调用函数 |
| `src/app/sonic-gallery/page.tsx` | 更新 Hero 双 CTA、文案、流程说明 |
| `src/app/api/audio-proxy/route.ts` | 白名单新增 `cover-uploads/` |

### 不动（保持现有功能）

- `src/lib/services/rap-generator.ts` — 原创 Rap pipeline 不变
- `src/lib/audio/seed-vc-client.ts` — Seed-VC 保留，高级功能
- `src/app/api/rap/generate-v2/route.ts` — Rap API 不变
- `src/app/sonic-gallery/create/**` — 所有现有创建向导不变

## 验证方式

### 后端验证
1. `suno-api-client.ts` 单元测试：uploadCover 请求构造、audioId 提取、MV 轮询
2. `cover-generator.ts` 单元测试：方言风格映射、歌词生成逻辑、进度回调
3. API route 测试：请求验证、限流、认证
4. curl 端到端：上传歌曲 → 翻唱 → MV

### 前端验证
1. 上传歌曲文件 → OSS 上传进度 → URL 返回
2. 选方言 + 三种歌词模式切换
3. 生成 → 进度显示 → 音频播放
4. 生成 MV → 视频播放 → 下载
5. 分享功能（Web Share API）
6. 移动端响应式

### 回归测试
1. 现有 `/sonic-gallery/create` 流程不受影响
2. 现有 `/api/rap/generate-v2` 不受影响
3. Seed-VC 相关功能正常

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | clean | 0 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |

**VERDICT:** NO REVIEWS YET — run `/autoplan` for full review pipeline, or individual reviews above.

## Plan vs 实际实现 差距分析（2026-03-29）

### Step 1: 扩展 SunoApiClient — 状态：已完成 ✅

| 计划项 | 实现状态 |
|--------|---------|
| `UploadCoverRequest` 类型 | ✅ 已实现 |
| `UploadCoverResult` 类型（含 `audioId`） | ✅ 已实现 |
| `CreateMusicVideoRequest` 类型 | ✅ 已实现 |
| `MusicVideoResult` 类型 | ✅ 已实现 |
| `uploadCover()` 方法 | ✅ 已实现，含提交+轮询 |
| `createMusicVideo()` 方法 | ✅ 已实现，含提交+轮询 |
| `getMusicVideoStatus()` 外部轮询 | ✅ 已实现 |
| `fetchMp4RecordInfo` 新轮询方法 | ✅ 已实现 |

### Step 2: 创建 CoverGenerator — 状态：已完成 ✅

| 计划项 | 实现状态 |
|--------|---------|
| `CoverGenerationParams` 类型 | ✅ 已实现 |
| `CoverGenerationResult` 类型（含 audioId） | ✅ 已实现 |
| `generate()` 2 步 pipeline | ✅ 已实现（歌词→翻唱） |
| `createMusicVideo()` | ✅ 已实现 |
| `checkServices()` | ✅ 已实现 |
| 方言风格映射 `DIALECT_COVER_STYLE` | ✅ 已实现（9 种方言） |
| `audioWeight` 默认 0.5 | ✅ 已实现 |

### Step 3: 创建 API 路由 — 状态：已完成 ✅

| 计划项 | 实现状态 |
|--------|---------|
| `POST /api/cover/upload` 上传到 OSS | ✅ 已实现 |
| `POST /api/cover/generate` 翻唱生成 | ✅ 异步模式（POST 返回 taskId，GET 轮询） |
| `GET /api/cover/generate?action=services` | ✅ 已实现 |
| `POST /api/cover/music-video` MV 生成 | ✅ 异步模式（POST 返回 taskId，GET 轮询） |
| `GET /api/cover/music-video?taskId=xxx` | ✅ 已实现（轮询内存 TaskStore + SunoAPI 兜底） |
| `audio-proxy` 白名单新增 `cover-uploads/` | ✅ 已确认 |

### Step 4: 前端封面创作流程 — 状态：已完成 ✅

| 计划项 | 实现状态 |
|--------|---------|
| 3 步向导（上传→方言→生成） | ✅ 已实现 |
| `cover-context.tsx` 状态管理 | ✅ 已实现 |
| Step 1: 文件上传（音频+视频） | ✅ 已实现 |
| Step 1: 粘贴 URL | ✅ 已实现 |
| Step 1: 预览播放器 | ✅ 已实现 — 上传/粘贴后可试听确认 |
| Step 2: 方言选择器（9 种） | ✅ 已实现 |
| Step 2: 歌词三模式切换 | ✅ 已实现 |
| Step 2: 声音性别选择 | ✅ 已实现 |
| Step 3: 生成按钮 | ✅ 已实现 |
| Step 3: 进度条（真实状态） | ✅ 已实现 — 异步轮询真实进度（提交→歌词→翻唱→完成） |
| Step 3: 音频播放器 + 波形 | ✅ 已实现 |
| Step 3: 歌词展示（静态） | ✅ 已实现 — 生成完成后展示歌词文本区域 |
| Step 3: 「生成 MV」按钮 | ✅ 已实现 |
| Step 3: MV 轮询（前端） | ✅ 已实现 — 异步提交 + 3 秒轮询 |
| Step 3: 视频播放器 | ✅ 已实现 |
| Step 3: 下载/分享 | ✅ 已实现 |

### Step 5: 更新落地页 — 状态：已完成 ✅

| 计划项 | 实现状态 |
|--------|---------|
| Hero 双 CTA（翻唱+Rap） | ✅ 已实现 |
| 标题改为「用方言翻唱，30 秒出片」 | ✅ 已实现 |
| 副本更新（传播性+速度） | ✅ 已实现 |
| 统计数据（9 方言/30s/MV） | ✅ 已实现 |
| AI 背景 Hero 视频 | ✅ 已实现（Seedance 生成） |

### create-api.ts 翻唱 API 函数 — 状态：已完成 ✅

| 计划项 | 实现状态 |
|--------|---------|
| `uploadSong(file)` | ✅ 已实现 |
| `submitCoverGeneration(params)` | ✅ 异步提交 |
| `getCoverTaskStatus(taskId)` | ✅ 轮询状态 |
| `submitMusicVideoGeneration(params)` | ✅ 异步提交 |
| `getMusicVideoStatus(taskId)` | ✅ 已实现 |
| `pollTaskStatus()` 通用轮询 | ✅ 已实现 |

---

## 需要完成的工作（优先级排序）

### P0 — 核心体验问题 ✅ 已全部完成

1. **异步轮询改造** ✅
   - `POST /api/cover/generate` → 立即返回 `{ taskId, status: 'processing', step: 'submitting' }`
   - 后端内存 TaskStore（Map, 30 分钟 TTL）
   - `GET /api/cover/generate?taskId=xxx` → 返回当前阶段和进度
   - 前端每 3 秒轮询，显示真实阶段文案

2. **MV 异步轮询** ✅
   - `POST /api/cover/music-video` → 立即返回 `{ taskId, status: 'processing' }`
   - 前端轮询 `GET /api/cover/music-video?taskId=xxx`

3. **前端真实进度展示** ✅
   - 真实进度条（提交→歌词→翻唱→完成）
   - 阶段文案从后端返回
   - 趣味提示轮换

### P1 — 功能补全 ✅ 已全部完成

4. **Step 1 上传预览播放器** ✅ — 上传/粘贴后可试听确认
5. **Step 3 歌词静态展示** ✅ — 生成完成后展示歌词文本区域
6. **audio-proxy 白名单** ✅ — 确认 `cover-uploads/` 已加入

### P2 — 体验优化

7. **等待趣味提示** ✅ — 已实现 FUN_TIPS 轮换
8. **步骤间动画过渡** ✅ — 已有 animate-fade-in
9. **移动端响应式微调** — 可进一步优化小屏幕体验

### 安全修复（Review 完成）

- ✅ SEC-4: GET 端点添加 withOptionalAuth
- ✅ PROMPT-1: 移除 httpbin.org 回调 URL，改用环境变量
- ✅ ENUM-1: 添加 mandarin 方言 + 未知方言 warning
- ✅ SEC-5: bodySizeLimit 从 500mb 降至 20mb
- ✅ DEAD-3: 移除已废弃的同步包装函数
- ✅ SSRF 防护: isValidPublicUrl 阻止内网地址
- ✅ LLM 注入防护: brandMessage/customLyrics 长度限制

## 7 个 Suno API 驱动的内容传播玩法（2026-03-29）

> 核心判断：产品本身不是内容，方言翻唱的结果才是内容。不发产品 demo，发方言翻唱视频本身。

### 玩法 1：「当 XX 歌用 XX 话唱」系列（已具备）

- **API**: Upload & Cover（已集成）
- **格式**: 标题 = "当《成都》用东北话唱"
- **频率**: 每天 1-2 条
- **为什么火**: 熟悉 + 意外 = 3 秒内笑出来。抖音算法给"停留时间"权重最高，搞笑方言翻唱天然高停留。
- **执行**: 选抖音热歌榜前 10 的歌，每个用 3 种方言各做一版。每天 6 条内容，30 分钟搞定。

### 玩法 2：「方言 Battle」对战格式（已具备）

- **API**: Upload & Cover × 2
- **格式**: 分屏对比，左=四川话，右=东北话，同一首歌
- **为什么火**: 投票互动格式。用户天然想在评论区站队。评论 = 互动 = 算法加权。
- **执行**: 每周 2-3 条 Battle 视频。标题："《晴天》四川话 vs 东北话，哪个更好笑？"

### 玩法 3：「9 种方言唱同一首歌」（已具备）

- **API**: Upload & Cover × 9
- **格式**: 一首歌切成 9 段，每段一种方言，拼成一个视频
- **为什么火**: B站《打上花火》9 方言版已经验证过这个格式。抖音上还没人系统做这个。
- **执行**: 每周 1 条"大制作"。选经典老歌（《同桌的你》《朋友》），因为经典老歌受众最广。

### 玩法 4：KTV 方言歌词视频（需集成时间戳歌词 API）

- **API**: Timestamp Lyrics（未集成，这是最大的机会）
- **格式**: KTV 风格滚动字幕 + 方言歌词 + 背景 MV
- **为什么火**: 歌词视频是抖音音乐类内容的第一大格式。加上方言字幕 = 双重信息密度。用户会截图分享歌词里搞笑的方言翻译。
- **执行**: 集成 Suno 的时间戳歌词 API，在生成的 MV 上叠加滚动歌词。这是和所有竞品的差异化。
- **技术方案**: Suno API 返回 `alignedWords`（逐词时间戳 `word/startS/endS`）→ 转换为 ASS 字幕文件（`\kf` 卡拉 OK 标签）→ FFmpeg 烧录到 MV 视频上

### 玩法 5：「原版 vs 方言版」对比（需集成人声分离 API）

- **API**: Vocal Separation（未集成）
- **格式**: 先听 5 秒原版，突然切方言版。反差最大化。
- **为什么火**: "听之前 vs 听之后"是抖音经久不衰的格式。音乐版 = 天然适合。
- **执行**: 每条视频 15 秒：5 秒原版 + 10 秒方言版。短=完播率高。

### 玩法 6：「热点蹭歌」快速反应（已具备）

- **API**: Upload & Cover
- **格式**: 热歌出来 24 小时内，方言版上线
- **为什么火**: 抖音热歌有 3-7 天流量窗口。第一个出方言版的人吃最大红利。30 秒生成时间是真正的壁垒。
- **执行**: 每天刷抖音热歌榜，发现新热歌立即出方言版。

### 玩法 7：「品牌植入案例」商业内容（已具备）

- **API**: Upload & Cover + AI 歌词生成
- **格式**: "这家火锅店用四川话翻唱《成都》做广告，评论区炸了"
- **为什么火**: 不是推广 AI 产品。是推广"AI 方言翻唱能帮实体店引流"这个价值。小微企业主看了会想"我也要一个"。
- **执行**: 找真实店铺合作，免费帮他们做一条方言翻唱广告，然后发成内容。既是案例，也是免费试用引流。

### 优先级排序

| 优先级 | 玩法 | 开发成本 | 传播潜力 |
|--------|------|----------|----------|
| P0 | 玩法 1+6：每天发方言翻唱（已具备） | 零 | 高 |
| P0 | 玩法 2：方言 Battle（已具备） | 零 | 高 |
| P1 | 玩法 4：KTV 歌词视频（需新 API） | 中 | 最高 |
| P2 | 玩法 3：9 种方言大制作（已具备） | 零（但 API 调用多） | 高 |
| P2 | 玩法 7：品牌植入案例（已具备） | 零 | 中（但能获客） |
| P3 | 玩法 5：原版 vs 方言版（需新 API） | 中 | 中 |

### 竞品参考

- 抖音方言翻唱已验证爆款格式：廖佳琳宁乡话《Rolling in the Deep》、王春燕陕北话《演员》
- 酷狗 AIK 已支持 15 种方言但输出 MP3（无视频），WhyFire 输出 MP4 是核心差异
- B站《打上花火》9 方言版验证了多方言混剪格式的传播力
