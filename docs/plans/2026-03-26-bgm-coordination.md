# BGM 协调方案实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 让 Suno 生成的 Rap 与指定 BGM 的节奏/风格协调，混音时使用用户指定的 BGM

**架构：** 在 Suno 生成时注入 BGM 的 BPM 和风格标签，最终混音时使用 BGM 库中的指定 BGM（而非 Demucs 分离的伴奏）

**技术栈：** TypeScript, Suno API (Evolink), FFmpeg

---

## 任务概览

| 任务 | 描述 | 预计时间 |
|------|------|---------|
| Task 0 | Suno BPM 验证测试脚本 | 10 分钟 |
| Task 1 | 创建 BGM 库模块 | 15 分钟 |
| Task 2 | 扩展 Suno Client | 10 分钟 |
| Task 3 | 修改 Rap Generator | 20 分钟 |
| Task 4 | 修改 API 路由 | 10 分钟 |
| Task 5 | 端到端测试 | 15 分钟 |

---

## Task 0: Suno BPM 验证测试脚本（关键前置）

**目标：** 验证 Suno 对 style 参数中 BPM 指令的遵循程度

**Files:**
- Create: `scripts/test-suno-bpm-adherence.ts`

**Step 1: 创建测试脚本**

```typescript
// scripts/test-suno-bpm-adherence.ts

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { getSunoClient } from '../src/lib/music/suno-client.js'

const TEST_CASES = [
  { bpm: 90, label: 'slow' },
  { bpm: 140, label: 'medium' },
  { bpm: 170, label: 'fast' },
]

const TEST_LYRICS = `
[Verse 1]
Testing one two three
This is a BPM test
Check the rhythm check the flow
`

async function testBPMAdherence() {
  const client = getSunoClient()

  console.log('Suno BPM Adherence Test')
  console.log('='.repeat(50))

  for (const testCase of TEST_CASES) {
    console.log(`\nTest: ${testCase.bpm} BPM (${testCase.label})`)

    try {
      const result = await client.generate({
        lyrics: TEST_LYRICS,
        dialect: 'original',
        style: `rap, ${testCase.bpm} BPM`,
        title: `BPM Test ${testCase.bpm}`,
      })

      console.log(`  Generated: ${result.audioUrl}`)
      console.log(`  Expected BPM: ${testCase.bpm}`)
      console.log(`  Duration: ${result.duration}s`)
      console.log(`  → 请使用 bpmdetector.com 检测实际 BPM`)
      console.log(`  → 计算偏差: |actual - ${testCase.bpm}| / ${testCase.bpm} * 100%`)
    } catch (error) {
      console.error(`  ❌ Error: ${error}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('通过标准: 所有偏差 < 10%')
}

testBPMAdherence().catch(console.error)
```

**Step 2: 运行测试脚本**

Run: `npx tsx scripts/test-suno-bpm-adherence.ts`

Expected: 生成 3 个测试音频，输出音频 URL

**Step 3: 手动验证 BPM**

使用 [bpmdetector.com](https://bpmdetector.com/) 检测每个音频的实际 BPM

**通过标准：**
- 3 个用例的 BPM 偏差都在 ±10% 以内 → 继续 Task 1
- 偏差 > 15% → 停止，需要重新评估方案

---

## Task 1: 创建 BGM 库模块

**目标：** 定义 BGM 元数据结构和库

**Files:**
- Create: `src/lib/music/bgm-library.ts`

**Step 1: 创建 BGM 元数据接口**

```typescript
// src/lib/music/bgm-library.ts

/**
 * BGM 元数据
 */
export interface BGMMetadata {
  /** BGM ID */
  id: string
  /** 音频 URL（OSS 存储） */
  url: string
  /** BPM */
  bpm: number
  /** 风格标签（直接注入 Suno） */
  styleTags: string
  /** 能量级别 */
  energy: 'low' | 'medium' | 'high'
  /** 情绪标签 */
  mood: string[]
  /** 时长（秒） */
  duration: number
}
```

**Step 2: 创建 toSunoStyle 辅助函数**

```typescript
/**
 * 转换为 Suno style 参数
 */
export function toSunoStyle(bgm: BGMMetadata): string {
  const parts = [
    bgm.styleTags,
    `${bgm.bpm} BPM`,
    ...bgm.mood,
  ]
  return parts.filter(Boolean).join(', ')
}
```

**Step 3: 创建 BGM 库（初始为空）**

```typescript
/**
 * BGM 库
 *
 * 使用方法：
 * 1. 准备 BGM 文件（MP3/WAV，44100Hz，2-5分钟）
 * 2. 使用 tunebat.com 检测 BPM
 * 3. 人工标注风格和情绪标签
 * 4. 上传到 OSS，获取 URL
 * 5. 添加到此数组
 */
export const BGM_LIBRARY: BGMMetadata[] = [
  // 示例（替换为实际的 BGM）:
  // {
  //   id: 'trap-dark-140',
  //   url: 'https://your-oss.com/bgm/trap-dark-140.mp3',
  //   bpm: 140,
  //   styleTags: 'trap, dark, heavy 808, southern hip-hop',
  //   energy: 'high',
  //   mood: ['aggressive', 'confident'],
  //   duration: 180,
  // },
]
```

**Step 4: 创建查询函数**

```typescript
/**
 * 根据 ID 获取 BGM 元数据
 */
export function getBGMById(id: string): BGMMetadata | undefined {
  return BGM_LIBRARY.find(bgm => bgm.id === id)
}

/**
 * 获取默认 BGM（向后兼容）
 */
export function getDefaultBGM(): BGMMetadata | undefined {
  return BGM_LIBRARY[0]
}

/**
 * 列出所有可用的 BGM
 */
export function listAllBGM(): BGMMetadata[] {
  return BGM_LIBRARY
}
```

**Step 5: 验证类型检查通过**

Run: `npx tsc --noEmit src/lib/music/bgm-library.ts`

Expected: 无类型错误

**Step 6: Commit**

```bash
git add src/lib/music/bgm-library.ts
git commit -m "feat(music): add BGM library module with metadata structure"
```

---

## Task 2: 扩展 Suno Client

**目标：** 让 Suno 支持接收 BGM 元数据并注入到 style 参数

**Files:**
- Modify: `src/lib/music/suno-client.ts:41-58` (SunoGenerationRequest 接口)
- Modify: `src/lib/music/suno-client.ts:150-198` (generate 方法)

**Step 1: 扩展 SunoGenerationRequest 接口**

在 `src/lib/music/suno-client.ts` 的 `SunoGenerationRequest` 接口中添加 `bgm` 字段：

```typescript
// 在 SunoGenerationRequest 接口中添加（约 line 58 之后）
export interface SunoGenerationRequest {
  // ... existing fields
  /** 背景音乐元数据（用于风格注入） */
  bgm?: {
    bpm: number
    styleTags: string
    mood: string[]
  }
}
```

**Step 2: 导入 toSunoStyle 函数**

在文件顶部添加 import：

```typescript
import { toSunoStyle, type BGMMetadata } from './bgm-library'
```

**Step 3: 修改 generate 方法中的 style 构建**

修改 `generate` 方法（约 line 150-198）：

```typescript
async generate(request: SunoGenerationRequest): Promise<SunoGenerationResult> {
  // ... existing code ...

  const {
    lyrics,
    dialect,
    style = 'rap',
    title = 'WhyFire Generated',
    model = 'suno-v4.5-beta',
    vocalGender,
    callbackUrl,
    bgm,  // 新增
  } = request

  // 构建风格标签（强制 Rap + 方言风格 + BGM 信息）
  const dialectRapStyle = DIALECT_RAP_STYLE_MAP[dialect] || ''

  // 构建 style 部分
  const styleParts = [RAP_STYLE_TAGS, dialectRapStyle]

  // 注入 BGM 信息
  if (bgm) {
    const bgmStyle = toSunoStyle({
      id: '',
      url: '',
      bpm: bgm.bpm,
      styleTags: bgm.styleTags,
      energy: 'medium',
      mood: bgm.mood,
      duration: 0,
    })
    styleParts.push(bgmStyle)
    console.log(`[Suno] Injecting BGM style: BPM=${bgm.bpm}, tags=${bgm.styleTags}`)
  }

  const combinedStyle = styleParts.filter(Boolean).join(', ')

  console.log(`[Suno] Generating Rap for dialect: ${dialect}, style: ${combinedStyle}`)

  // ... rest of the method ...
}
```

**Step 4: 验证类型检查通过**

Run: `npx tsc --noEmit src/lib/music/suno-client.ts`

Expected: 无类型错误

**Step 5: Commit**

```bash
git add src/lib/music/suno-client.ts
git commit -m "feat(suno): support BGM metadata injection in style parameter"
```

---

## Task 3: 修改 Rap Generator

**目标：** 使用 BGM 库，注入 BGM 信息到 Suno，混音时使用指定 BGM

**Files:**
- Modify: `src/lib/services/rap-generator-suno-rvc.ts:29-42` (RapGenerationParams 接口)
- Modify: `src/lib/services/rap-generator-suno-rvc.ts:109-279` (generate 方法)

**Step 1: 导入 BGM 库**

在文件顶部添加 import：

```typescript
import { getBGMById, getDefaultBGM, type BGMMetadata } from '@/lib/music/bgm-library'
```

**Step 2: 修改 RapGenerationParams 接口**

```typescript
export interface RapGenerationParams {
  /** 用户 ID */
  userId: string
  /** 用户描述（职业、爱好、想说的） */
  userDescription: string
  /** 方言 */
  dialect: DialectCode
  /** 用户 RVC 模型 ID */
  voiceModelId: string
  /** BGM ID（从 BGM 库选择，可选） */
  bgmId?: string
  /** 歌词（可选，如果不提供则自动生成） */
  lyrics?: string
  // 注意：移除 bgmUrl，统一使用 bgmId
}
```

**Step 3: 在 generate 方法开头获取 BGM 元数据**

```typescript
async generate(
  params: RapGenerationParams,
  onProgress?: ProgressCallback
): Promise<RapGenerationResult> {
  const { userId, userDescription, dialect, voiceModelId, bgmId, lyrics: providedLyrics } = params
  const taskId = `${userId}-${Date.now()}`

  // 获取 BGM 元数据
  const bgmMetadata = bgmId
    ? getBGMById(bgmId)
    : getDefaultBGM()

  if (!bgmMetadata) {
    throw new Error(`BGM not found: ${bgmId || 'default'}. Please add BGM to the library or provide a valid bgmId.`)
  }

  console.log(`[RapGenerator] Using BGM: ${bgmMetadata.id} (${bgmMetadata.bpm} BPM)`)

  // Step 1: 生成歌词
  // ... existing code ...
```

**Step 4: 修改 Suno 生成调用（注入 BGM 信息）**

找到 Step 2 的 Suno 生成调用（约 line 141），修改为：

```typescript
// Step 2: Suno 生成 Rap（注入 BGM 信息）
onProgress?.({
  step: 'suno',
  stepName: '生成 Rap',
  progress: 0,
  message: '正在使用 Suno 生成 Rap...',
})

const sunoResult = await this.sunoClient.generate({
  lyrics,
  dialect,
  style: 'rap',
  title: `WhyFire ${dialect} Rap`,
  bgm: {
    bpm: bgmMetadata.bpm,
    styleTags: bgmMetadata.styleTags,
    mood: bgmMetadata.mood,
  },
})
```

**Step 5: 修改 Step 5 混音逻辑（使用指定 BGM）**

找到 Step 5 的混音逻辑（约 line 209-278），修改为：

```typescript
// Step 5: FFmpeg 混音（使用用户指定的 BGM）
onProgress?.({
  step: 'mixing',
  stepName: '混音合成',
  progress: 0,
  message: '正在与 BGM 混音...',
})

// 下载 RVC 输出音频
const rvcAudioUrl = rvcResult.outputAudio!
if (!rvcAudioUrl.startsWith('http')) {
  throw new Error(`RVC output must be a full URL, got: ${rvcAudioUrl}`)
}

console.log(`[RapGenerator] Downloading RVC output: ${rvcAudioUrl}`)
const rvcAudioRes = await fetch(rvcAudioUrl, {
  signal: AbortSignal.timeout(60000),
})
if (!rvcAudioRes.ok) {
  throw new Error(`Failed to download RVC audio: ${rvcAudioRes.status}`)
}
const rvcAudioBuffer = Buffer.from(await rvcAudioRes.arrayBuffer())

// 下载用户指定的 BGM（而不是 Demucs 分离的伴奏）
console.log(`[RapGenerator] Downloading BGM: ${bgmMetadata.url}`)
const bgmRes = await fetch(bgmMetadata.url, {
  signal: AbortSignal.timeout(60000),
})
if (!bgmRes.ok) {
  throw new Error(`Failed to download BGM: ${bgmRes.status}`)
}
const bgmBuffer = Buffer.from(await bgmRes.arrayBuffer())

// 计算时长
const rvcDuration = rvcResult.duration || sunoResult.duration || 0

// 决定是否循环 BGM
const shouldLoopBgm = bgmMetadata.duration > 0 && bgmMetadata.duration < rvcDuration * 0.9

console.log(`[RapGenerator] Mixing: vocal=${rvcDuration}s, bgm=${bgmMetadata.duration}s, loop=${shouldLoopBgm}`)

// 混音
const mixResult = await this.ffmpegProcessor.mixTracks(rvcAudioBuffer, bgmBuffer, {
  vocalVolume: 1.0,
  bgmVolume: 0.3,
  loopBgm: shouldLoopBgm,
})

// ... 保存文件逻辑保持不变 ...
```

**Step 6: 验证类型检查通过**

Run: `npx tsc --noEmit src/lib/services/rap-generator-suno-rvc.ts`

Expected: 无类型错误

**Step 7: Commit**

```bash
git add src/lib/services/rap-generator-suno-rvc.ts
git commit -m "feat(rap-generator): use BGM library and inject style to Suno"
```

---

## Task 4: 修改 API 路由

**目标：** 添加 bgmId 参数验证

**Files:**
- Modify: `src/app/api/rap/generate-v2/route.ts:24-37` (请求接口)
- Modify: `src/app/api/rap/generate-v2/route.ts:53-118` (POST 处理)

**Step 1: 导入 BGM 库**

```typescript
import { getBGMById, listAllBGM } from '@/lib/music/bgm-library'
```

**Step 2: 修改请求接口**

```typescript
interface RapGenerateV2Request {
  /** 用户 ID */
  userId: string
  /** 用户描述（职业、爱好、想说的） */
  userDescription: string
  /** 方言 */
  dialect: DialectCode
  /** 用户 RVC 模型 ID */
  voiceModelId: string
  /** BGM ID（从 BGM 库选择，可选） */
  bgmId?: string
  /** 歌词（可选，如果不提供则自动生成） */
  lyrics?: string
}
```

**Step 3: 添加 bgmId 验证**

在 POST 处理中添加验证（在现有验证之后）：

```typescript
// 验证 bgmId（如果提供）
if (body.bgmId) {
  const bgm = getBGMById(body.bgmId)
  if (!bgm) {
    const availableBgmIds = listAllBGM().map(b => b.id)
    return NextResponse.json(
      {
        code: 400,
        message: `Invalid bgmId: ${body.bgmId}. Available: ${availableBgmIds.join(', ') || 'none'}`
      },
      { status: 400 }
    )
  }
  console.log(`[API V2] Using BGM: ${body.bgmId}`)
}
```

**Step 4: 传递 bgmId 到 generator**

修改 generator 调用：

```typescript
const result = await generator.generate(
  {
    userId: body.userId,
    userDescription: body.userDescription || '',
    dialect: body.dialect,
    voiceModelId: body.voiceModelId,
    bgmId: body.bgmId,  // 新增
    lyrics: body.lyrics,
  },
  onProgress
)
```

**Step 5: 添加 BGM 列表查询接口（可选）**

在 GET 处理中添加 BGM 列表：

```typescript
// 在 GET 函数中添加
if (action === 'bgm-list') {
  const bgmList = listAllBGM().map(bgm => ({
    id: bgm.id,
    bpm: bgm.bpm,
    styleTags: bgm.styleTags,
    energy: bgm.energy,
    mood: bgm.mood,
    duration: bgm.duration,
  }))

  return NextResponse.json({
    code: 0,
    data: {
      bgmList,
      count: bgmList.length,
    },
  })
}
```

**Step 6: 验证类型检查通过**

Run: `npx tsc --noEmit src/app/api/rap/generate-v2/route.ts`

Expected: 无类型错误

**Step 7: Commit**

```bash
git add src/app/api/rap/generate-v2/route.ts
git commit -m "feat(api): add bgmId parameter support for rap generation"
```

---

## Task 5: 端到端测试

**目标：** 验证整个流程工作正常

**Files:**
- Create: `scripts/test-bgm-coordination.ts`

**Step 1: 创建测试脚本**

```typescript
// scripts/test-bgm-coordination.ts

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { getRapGenerator } from '../src/lib/services/rap-generator-suno-rvc.js'
import type { GenerationProgress } from '../src/lib/services/rap-generator-suno-rvc.js'

async function testBGCoordination() {
  console.log('BGM 协调方案端到端测试')
  console.log('='.repeat(60))

  const generator = getRapGenerator()

  // 检查服务状态
  console.log('\n1. 检查服务状态...')
  const services = await generator.checkServices()
  console.log('   Suno:', services.suno ? '✓' : '✗')
  console.log('   Demucs:', services.demucs ? '✓' : '✗')
  console.log('   RVC:', services.rvc ? '✓' : '✗')
  console.log('   FFmpeg:', services.ffmpeg ? '✓' : '✗')

  if (!services.suno || !services.demucs || !services.rvc || !services.ffmpeg) {
    console.error('\n❌ 部分服务未启动，请先启动所有服务')
    process.exit(1)
  }

  // 进度回调
  const onProgress = (progress: GenerationProgress) => {
    const icon = progress.progress === 100 ? '✓' : '...'
    console.log(`   [${progress.stepName}] ${icon} ${progress.message || ''}`)
  }

  // 测试生成（使用 bgmId）
  console.log('\n2. 测试 Rap 生成（带 BGM ID）...')
  try {
    const result = await generator.generate(
      {
        userId: 'test-user',
        userDescription: '测试 BGM 协调功能',
        dialect: 'original',
        voiceModelId: 'test-model',
        bgmId: undefined, // 使用默认 BGM（如果 BGM_LIBRARY 非空）
        lyrics: `[Verse 1]
这是测试
节奏协调
BGM 匹配
效果如何

[Chorus]
测试成功
继续前进`,
      },
      onProgress
    )

    console.log('\n' + '='.repeat(60))
    console.log('✓ 测试完成!')
    console.log('='.repeat(60))
    console.log('Audio URL:', result.audioUrl)
    console.log('Duration:', result.duration, 's')
    console.log('Dialect:', result.dialect)
    console.log('Task ID:', result.taskId)
  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    process.exit(1)
  }
}

testBGCoordination().catch(console.error)
```

**Step 2: 运行测试**

Run: `npx tsx scripts/test-bgm-coordination.ts`

Expected: 如果 BGM_LIBRARY 为空，会报错 "BGM not found: default"

**Step 3: 添加测试 BGM 到 BGM_LIBRARY**

编辑 `src/lib/music/bgm-library.ts`，添加至少一个测试 BGM：

```typescript
export const BGM_LIBRARY: BGMMetadata[] = [
  {
    id: 'test-trap-140',
    url: 'https://example.com/bgm/test-trap-140.mp3', // 替换为实际的 URL
    bpm: 140,
    styleTags: 'trap, dark, heavy 808',
    energy: 'high',
    mood: ['aggressive', 'confident'],
    duration: 180,
  },
]
```

**Step 4: 重新运行测试**

Run: `npx tsx scripts/test-bgm-coordination.ts`

Expected: 成功生成 Rap，输出音频 URL

**Step 5: Commit**

```bash
git add scripts/test-bgm-coordination.ts
git commit -m "test: add BGM coordination e2e test script"
```

---

## 验收标准

1. ✅ `npx tsc --noEmit` 无类型错误
2. ✅ Suno BPM 验证测试完成（偏差 < 10%）
3. ✅ `npx tsx scripts/test-bgm-coordination.ts` 成功运行
4. ✅ 生成的音频使用指定的 BGM（而非 Suno 生成的伴奏）

---

## 回滚计划

如果实施过程中遇到问题：

```bash
# 回滚到实施前
git revert HEAD~5  # 回滚最近 5 个 commit
```

---

## 后续任务（不在本计划范围）

- [ ] 准备 3-5 首真实 BGM 并上传到 OSS
- [ ] 使用 tunebat.com 标注 BGM 的 BPM
- [ ] 人工标注风格和情绪标签
- [ ] 如果 BPM 遵循效果不佳，实现 FFmpeg 时间拉伸微调
