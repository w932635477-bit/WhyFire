# WhyFire 视频合成功能开发计划

> 创建日期: 2026-03-19
> 状态: 规划中
> 基于前期研究和验证

---

## 📋 项目概述

### 目标
实现一键生成带文字特效的竖屏音乐视频，支持：
- Rap 说唱与用户视频自动同步
- 霓虹发光文字效果
- 逐字高亮（卡拉OK 风格）
- 用户自主选择时长适配方式

### 已完成功能
- [x] Suno 风格 UI 重设计
- [x] 歌词生成（Claude API）
- [x] 歌词编辑功能
- [x] 音乐生成（MiniMax API）
- [x] 方言支持（普通话/粤语/英语）

### 待开发功能
- [ ] 视频上传与处理
- [ ] 时长差异检测与用户选择
- [ ] 字幕时间戳生成（Whisper）
- [ ] 视频合成（Remotion）
- [ ] 视频导出与下载

---

## 🏗️ 技术架构

### 技术选型

| 功能 | 技术方案 | 验证状态 |
|------|----------|----------|
| 视频合成框架 | **Remotion** (React) | ✅ 已验证，业界最佳 |
| 字幕转录 | **@remotion/whisper-web** | ✅ 已验证，浏览器端 |
| 字幕同步 | **@remotion/captions** | ✅ TikTok 风格支持 |
| 视频处理 | **FFmpeg** | ✅ 配合 Remotion |
| 时长适配 | **FFmpeg setpts/atempo** | ✅ 已验证 |

### 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        WhyFire 视频合成流程                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户输入          AI 生成            视频合成         输出     │
│  ┌──────┐        ┌──────┐         ┌──────────┐      ┌──────┐  │
│  │ 描述 │───┬───▶│ 歌词 │───┬────▶│ 时长适配 │───┬─▶│ MP4  │  │
│  └──────┘   │    └──────┘   │     └──────────┘   │  └──────┘  │
│  ┌──────┐   │    ┌──────┐   │     ┌──────────┐   │            │
│  │ 视频 │───┴───▶│ 音乐 │───┴────▶│ 字幕生成 │───┘            │
│  └──────┘        └──────┘         └──────────┘                │
│                       │                   │                    │
│                       ▼                   ▼                    │
│                  ┌──────────┐      ┌──────────────┐           │
│                  │ Whisper  │      │ Remotion     │           │
│                  │ 转录时间戳│      │ 渲染合成     │           │
│                  └──────────┘      └──────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 开发阶段

### Phase 0: 基础设施准备 (1-2 天)

#### 任务清单
- [ ] 安装 Remotion 及相关依赖
- [ ] 配置 Remotion 项目结构
- [ ] 安装 Whisper WebAssembly
- [ ] 测试基础渲染流程

#### 依赖安装
```bash
# Remotion 核心
npm install remotion @remotion/cli

# 媒体处理
npm install @remotion/media

# 字幕处理
npm install @remotion/captions @remotion/whisper-web
```

#### 文件结构
```
src/
├── lib/
│   └── video/
│       ├── compositions/
│       │   ├── LyricsVideo.tsx      # 主视频组件
│       │   └── Root.tsx             # Remotion 入口
│       ├── components/
│       │   ├── NeonText.tsx         # 霓虹文字效果
│       │   ├── KaraokeCaption.tsx   # 卡拉OK字幕
│       │   ├── Background.tsx       # 视频背景
│       │   └── ProgressBar.tsx      # 进度条
│       ├── utils/
│       │   ├── duration-matcher.ts  # 时长匹配
│       │   └── captions-sync.ts     # 字幕同步
│       └── render.ts                # 渲染配置
├── app/
│   └── api/
│       └── video/
│           ├── upload/
│           │   └── route.ts         # 视频上传
│           ├── render/
│           │   └── route.ts         # 视频渲染
│           └── status/
│               └── route.ts         # 渲染状态
└── components/
    └── video/
        ├── VideoUploader.tsx        # 上传组件
        ├── DurationAdjustModal.tsx  # 时长调整选择
        └── VideoPlayer.tsx          # 视频播放器
```

---

### Phase 1: 视频上传与处理 (2-3 天)

#### 1.1 视频上传组件
```typescript
// components/video/VideoUploader.tsx

interface VideoUploaderProps {
  onUpload: (file: File, duration: number) => void
  maxSize?: number // 默认 100MB
}

// 功能:
// - 拖拽上传
// - 格式验证 (MP4, MOV, WebM)
// - 时长检测
// - 预览缩略图
```

#### 1.2 视频元数据提取
```typescript
// lib/video/utils/metadata.ts

export async function getVideoMetadata(file: File): Promise<{
  duration: number
  width: number
  height: number
  fps: number
}>
```

#### 1.3 API 端点
```typescript
// POST /api/video/upload
// - 接收视频文件
// - 存储到临时目录或云存储
// - 返回视频 ID 和元数据
```

---

### Phase 2: 时长适配功能 (2-3 天)

#### 2.1 时长差异检测
```typescript
// lib/video/utils/duration-matcher.ts

interface DurationAnalysis {
  videoDuration: number
  audioDuration: number
  ratio: number
  difference: number
  needsAdjustment: boolean
  recommendedMethod: AdjustmentMethod
}

export function analyzeDurations(
  videoDuration: number,
  audioDuration: number
): DurationAnalysis
```

#### 2.2 用户选择界面
```typescript
// components/video/DurationAdjustModal.tsx

interface DurationAdjustModalProps {
  isOpen: boolean
  videoDuration: number
  audioDuration: number
  onSelect: (method: AdjustmentMethod) => void
  onSkip: () => void
}

// 调整选项:
// 1. adjust-video    - 调整视频速度
// 2. trim-audio      - 裁剪音频
// 3. loop-audio      - 循环音频
// 4. stretch-audio   - 音频变速
```

#### 2.3 FFmpeg 时长调整
```typescript
// lib/video/utils/duration-matcher.ts

export async function adjustDuration(
  videoPath: string,
  audioPath: string,
  method: AdjustmentMethod,
  outputPath: string
): Promise<AdjustResult>
```

---

### Phase 3: 字幕生成与同步 (3-4 天)

#### 3.1 Whisper 转录
```typescript
// lib/video/utils/transcribe.ts

import { transcribe } from '@remotion/whisper-web'

interface TranscriptionResult {
  captions: Caption[]
  duration: number
}

export async function transcribeAudio(
  audioUrl: string
): Promise<TranscriptionResult>
```

#### 3.2 TikTok 风格字幕生成
```typescript
// lib/video/utils/captions-sync.ts

import { createTikTokStyleCaptions } from '@remotion/captions'

export function generateCaptions(
  transcription: Caption[],
  combineMs: number = 1200
): TikTokPage[]
```

#### 3.3 字幕时间戳验证
- 确保每个词的起止时间准确
- 处理歌词与转录不匹配的情况
- 提供手动调整接口

---

### Phase 4: Remotion 视频合成 (4-5 天)

#### 4.1 主视频组件
```typescript
// lib/video/compositions/LyricsVideo.tsx

import {
  AbsoluteFill,
  Video,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig
} from 'remotion'

interface LyricsVideoProps {
  videoUrl: string
  audioUrl: string
  captions: TikTokPage[]
  style: VideoStyle
}

export const LyricsVideo: React.FC<LyricsVideoProps> = ({
  videoUrl,
  audioUrl,
  captions,
  style
}) => {
  // 组件实现
}
```

#### 4.2 霓虹文字效果
```typescript
// lib/video/components/NeonText.tsx

interface NeonTextProps {
  text: string
  color?: string
  glowIntensity?: number
  fontSize?: number
}

export const NeonText: React.FC<NeonTextProps> = ({
  text,
  color = '#00f',
  glowIntensity = 20,
  fontSize = 48
}) => {
  const frame = useCurrentFrame()

  // 呼吸效果动画
  const glow = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [glowIntensity * 0.8, glowIntensity * 1.2]
  )

  return (
    <span style={{
      color: '#fff',
      fontSize,
      fontWeight: 'bold',
      textShadow: `
        0 0 ${glow}px ${color},
        0 0 ${glow * 2}px ${color},
        0 0 ${glow * 3}px ${color}
      `
    }}>
      {text}
    </span>
  )
}
```

#### 4.3 卡拉OK字幕组件
```typescript
// lib/video/components/KaraokeCaption.tsx

interface KaraokeCaptionProps {
  page: TikTokPage
  highlightColor?: string
  inactiveColor?: string
}

export const KaraokeCaption: React.FC<KaraokeCaptionProps> = ({
  page,
  highlightColor = '#39E508',
  inactiveColor = '#666'
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const currentTimeMs = (frame / fps) * 1000
  const absoluteTimeMs = page.startMs + currentTimeMs

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '0.2em'
    }}>
      {page.tokens.map((token) => {
        const isActive =
          token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs

        return (
          <NeonText
            key={token.fromMs}
            text={token.text}
            color={isActive ? highlightColor : inactiveColor}
            glowIntensity={isActive ? 30 : 10}
          />
        )
      })}
    </div>
  )
}
```

#### 4.4 视频组合
```typescript
// lib/video/compositions/LyricsVideo.tsx

export const LyricsVideo: React.FC<LyricsVideoProps> = (props) => {
  const { videoUrl, audioUrl, captions, style } = props
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill>
      {/* 背景视频 */}
      <Video
        src={videoUrl}
        style={{ objectFit: 'cover' }}
        muted
      />

      {/* 音频 */}
      <Audio src={audioUrl} />

      {/* 歌词字幕 */}
      {captions.map((page, index) => {
        const nextPage = captions[index + 1] ?? null
        const startFrame = (page.startMs / 1000) * fps
        const endFrame = nextPage
          ? (nextPage.startMs / 1000) * fps
          : Infinity
        const durationInFrames = endFrame - startFrame

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <AbsoluteFill style={{
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingBottom: '15%'
            }}>
              <KaraokeCaption page={page} />
            </AbsoluteFill>
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
```

---

### Phase 5: 渲染与导出 (2-3 天)

#### 5.1 服务端渲染 API
```typescript
// app/api/video/render/route.ts

import { renderMedia } from '@remotion/renderer'

export async function POST(request: Request) {
  const { videoId, captions, style } = await request.json()

  // 异步渲染
  const renderJob = await startRenderJob({
    compositionId: 'LyricsVideo',
    inputProps: { videoId, captions, style },
    outputLocation: `output/${videoId}.mp4`
  })

  return Response.json({
    jobId: renderJob.id,
    status: 'processing'
  })
}
```

#### 5.2 渲染进度追踪
```typescript
// app/api/video/status/route.ts

export async function GET(request: Request) {
  const { jobId } = parseQuery(request.url)

  const status = await getRenderStatus(jobId)

  return Response.json({
    status: status.state,
    progress: status.progress,
    outputUrl: status.outputUrl
  })
}
```

#### 5.3 视频下载
```typescript
// app/api/video/download/route.ts

export async function GET(request: Request) {
  const { videoId } = parseQuery(request.url)

  const videoStream = await getVideoStream(videoId)

  return new Response(videoStream, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="whyfire-${videoId}.mp4"`
    }
  })
}
```

---

### Phase 6: 前端集成 (3-4 天)

#### 6.1 更新创建页面 Phase
```typescript
// app/create/page.tsx

type CreationPhase =
  | 'input'
  | 'creating-lyrics'
  | 'lyrics-preview'
  | 'creating-music'
  | 'upload-video'      // 新增
  | 'duration-adjust'   // 新增
  | 'creating-video'    // 新增
  | 'done'
  | 'error'
```

#### 6.2 视频上传界面
- 拖拽上传区域
- 进度指示器
- 视频预览

#### 6.3 时长调整模态框
- 时长对比展示
- 调整选项卡片
- 推荐标记

#### 6.4 视频生成进度
- 渲染进度条
- 预计剩余时间
- 取消渲染按钮

#### 6.5 完成页面
- 视频播放器
- 下载按钮
- 分享功能

---

## 🔧 配置与依赖

### Remotion 配置
```typescript
// remotion.config.ts

import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)
Config.setPixelFormat('yuv420p')
```

### Remotion Root
```typescript
// src/lib/video/compositions/Root.tsx

import { Composition } from 'remotion'
import { LyricsVideo } from './LyricsVideo'

export const RemotionRoot = () => {
  return (
    <Composition
      id="LyricsVideo"
      component={LyricsVideo}
      durationInFrames={900}  // 30s at 30fps
      fps={30}
      width={1080}
      height={1920}  // 竖屏 9:16
      defaultProps={{
        videoUrl: '',
        audioUrl: '',
        captions: [],
        style: 'neon'
      }}
    />
  )
}
```

### 环境变量
```env
# .env.local

# 视频存储
VIDEO_STORAGE_TYPE=local  # local | s3 | r2
VIDEO_STORAGE_PATH=./uploads

# 渲染配置
RENDER_CONCURRENCY=2
RENDER_TIMEOUT=300000

# 云存储 (可选)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET=
```

---

## 📊 工作量估算

| 阶段 | 任务 | 预估时间 | 优先级 |
|------|------|----------|--------|
| Phase 0 | 基础设施 | 1-2 天 | P0 |
| Phase 1 | 视频上传 | 2-3 天 | P0 |
| Phase 2 | 时长适配 | 2-3 天 | P0 |
| Phase 3 | 字幕生成 | 3-4 天 | P1 |
| Phase 4 | 视频合成 | 4-5 天 | P1 |
| Phase 5 | 渲染导出 | 2-3 天 | P1 |
| Phase 6 | 前端集成 | 3-4 天 | P1 |
| **总计** | | **17-24 天** | |

---

## 🚀 MVP 优先级

### MVP 必须有 (Phase 0-2)
- [x] 视频上传
- [x] 时长检测
- [x] 用户选择调整方式
- [x] 基础视频合成

### MVP 可选 (Phase 3-6)
- [ ] Whisper 自动字幕（可先用预设时间）
- [ ] 霓虹发光效果
- [ ] 逐字高亮动画
- [ ] 云存储

---

## ⚠️ 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 渲染时间过长 | 用户体验差 | 异步处理 + 进度通知 |
| 内存占用大 | 服务器崩溃 | 限制并发 + 流式处理 |
| Whisper 准确度 | 字幕不同步 | 允许手动调整 |
| 视频格式兼容 | 部分视频失败 | FFmpeg 预处理 |
| Chrome 依赖 | 部署复杂 | Docker 化 |

---

## 📈 后续优化

### 短期优化
- [ ] 添加更多文字特效样式
- [ ] 支持自定义字体
- [ ] 添加视频滤镜

### 中期优化
- [ ] 异步任务队列 (BullMQ)
- [ ] 云存储 (S3/R2)
- [ ] GPU 加速渲染

### 长期优化
- [ ] 分布式渲染集群
- [ ] CDN 分发
- [ ] 实时预览功能

---

## ✅ 验收标准

### 功能验收
- [ ] 用户可上传视频（MP4/MOV/WebM）
- [ ] 系统检测时长差异并提示
- [ ] 用户可选择调整方式
- [ ] 生成的视频包含字幕
- [ ] 字幕与音频基本同步
- [ ] 用户可下载 MP4 视频

### 性能验收
- [ ] 30秒视频渲染时间 < 3分钟
- [ ] 支持并发 2-3 个渲染任务
- [ ] 上传 100MB 视频无超时

### 质量验收
- [ ] 字幕可读性良好
- [ ] 音视频同步误差 < 0.5秒
- [ ] 输出视频分辨率 1080x1920

---

## 📚 参考资源

### 技术文档
- [Remotion 官方文档](https://remotion.dev/docs)
- [@remotion/captions](https://remotion.dev/docs/captions)
- [@remotion/whisper-web](https://remotion.dev/docs/whisper-web)

### 最佳实践
- [UX Design for Gen AI](https://www.bcg.com/x/the-multiplier/ux-design-for-gen-ai-balancing-user-control-and-automation)
- [Nielsen User Control Heuristic](https://www.nngroup.com/articles/user-control-and-freedom/)
- [Scaling Video Infrastructure](https://medium.com/@harshithgowdakt/designing-a-scalable-video-platform-like-youtube-a-modern-system-design-deep-dive-0212873d06d6)

### GitHub 参考
- [KaraokeHunt/karaoke-generator](https://github.com/karaokenerds/karaoke-generator)
- [Auto-Editor](https://github.com/WyattBlue/auto-editor)
- [Bungee Audio Stretch](https://github.com/bungee-audio-stretch/bungee)

---

*最后更新: 2026-03-19*
