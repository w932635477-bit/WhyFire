# Remotion 集成方案

## 📊 项目现状分析

### 主项目 (WhyFire)
- **架构**: Next.js App Router
- **视频处理**: FFmpeg.wasm
- **字幕系统**: ASS 格式 (SubtitleRenderer)
- **节拍检测**: web-audio-beat-detector

### Demo 项目 (remotion-beatsync-demo)
- **架构**: 独立 Remotion 项目
- **特效**: 5 个核心 Rap 特效
- **位置**: `.worktrees/remotion-demo/remotion-beatsync-demo/`

---

## 🎯 集成方案

### 方案 A：Remotion 作为独立微服务 (推荐)

```
┌─────────────────────────────────────────────────────────────┐
│                    WhyFire 主应用                            │
│  Next.js + FFmpeg.wasm (预览/简单合成)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ API 调用
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Remotion Lambda 服务                            │
│  - 接收: 视频 + 音频 + 节拍数据 + 歌词                        │
│  - 渲染: 高质量特效视频                                       │
│  - 返回: 视频 URL                                            │
└─────────────────────────────────────────────────────────────┘
```

**优点**：
- ✅ 主应用不受影响
- ✅ Remotion 可独立扩展
- ✅ 云端渲染性能好
- ✅ 成本可控 (~$0.003/分钟)

**缺点**：
- ⚠️ 需要 AWS Lambda 部署
- ⚠️ 需要网络请求

### 方案 B：Remotion 嵌入主项目

```
src/
├── lib/
│   ├── ffmpeg/           # 现有 FFmpeg 逻辑
│   ├── subtitle/         # 现有字幕系统
│   └── remotion/         # 新增 Remotion 逻辑
│       ├── compositions/ # Remotion 组件
│       ├── effects/      # 特效模块
│       └── renderer.ts   # 渲染器
└── app/
    └── api/
        └── render/       # Remotion 渲染 API
```

**优点**：
- ✅ 单一代码库
- ✅ 共享类型和组件

**缺点**：
- ⚠️ 增加主包体积
- ⚠️ 本地渲染性能受限

---

## 📁 推荐目录结构 (方案 B)

```
src/lib/remotion/
├── index.ts                    # 导出入口
├── types.ts                    # 类型定义
├── compositions/
│   ├── rap-video.tsx           # Rap 视频合成
│   └── index.ts
├── effects/
│   ├── video-effects.tsx       # 画面特效
│   ├── subtitle-effects.tsx    # 字幕特效
│   ├── presets.ts              # 预设配置
│   └── index.ts
└── utils/
    ├── beat-utils.ts           # 节拍处理
    └── time-utils.ts           # 时间转换
```

---

## 🔄 需要清理的 Demo 代码

### 保留文件
```
src/components/
├── BeatSyncVideo.tsx     → 迁移到 src/lib/remotion/effects/video-effects.tsx
└── BeatSyncSubtitle.tsx  → 迁移到 src/lib/remotion/effects/subtitle-effects.tsx

src/compositions/
└── RapEffectsDemo.tsx    → 迁移到 src/lib/remotion/compositions/rap-video.tsx
```

### 删除文件
```
src/components/AudioVisualizer.tsx  # 暂不需要
src/compositions/BeatSyncDemo.tsx   # 旧版演示
```

---

## 🛠️ 类型统一

### 主项目现有类型
```typescript
// src/lib/subtitle/subtitle-styles.ts
interface LyricLine {
  id: string
  text: string
  startTime: number
  endTime: number
  words?: LyricWord[]
}

interface LyricWord {
  text: string
  startTime: number
  endTime: number
}
```

### Remotion Demo 类型
```typescript
// 需要统一
interface WordToken {
  text: string
  fromMs: number
  toMs: number
}

interface Beat {
  time: number
  intensity?: number
  type?: 'kick' | 'snare' | 'hihat'
}
```

### 统一后
```typescript
// src/lib/remotion/types.ts
export interface Beat {
  time: number           // 毫秒
  intensity?: number     // 0-1
  type?: BeatType
}

export type BeatType = 'kick' | 'snare' | 'hihat' | 'unknown'

// 复用主项目的 LyricLine 和 LyricWord
export type { LyricLine, LyricWord } from '@/lib/subtitle/subtitle-styles'
```

---

## 📋 集成步骤

### Phase 1: 类型统一 (1天)
1. [ ] 创建 `src/lib/remotion/types.ts`
2. [ ] 统一节拍和歌词类型
3. [ ] 添加类型转换工具函数

### Phase 2: 核心特效迁移 (2天)
1. [ ] 迁移 `BeatSyncVideo.tsx` → `video-effects.tsx`
2. [ ] 迁移 `BeatSyncSubtitle.tsx` → `subtitle-effects.tsx`
3. [ ] 提取预设配置 `presets.ts`

### Phase 3: 合成组件 (1天)
1. [ ] 创建 `rap-video.tsx` 合成
2. [ ] 集成节拍检测数据
3. [ ] 集成歌词数据

### Phase 4: API 集成 (2天)
1. [ ] 创建 `/api/render` 路由
2. [ ] 本地渲染测试
3. [ ] Remotion Lambda 集成 (可选)

### Phase 5: UI 集成 (1天)
1. [ ] 更新 `VideoSynthesizerComponent`
2. [ ] 添加 Remotion 渲染选项
3. [ ] 特效预览组件

---

## 💰 成本估算

### Remotion Lambda (云端渲染)
- 1分钟视频 ≈ $0.003 (≈ 2分钱)
- 10分钟视频 ≈ $0.03 (≈ 2毛钱)
- 100分钟视频 ≈ $0.30 (≈ 2块钱)

### 本地渲染 (免费)
- 用户浏览器渲染
- 性能受限
- 长视频可能超时

---

## 🎯 推荐方案

**短期**: 方案 B (嵌入主项目) + 本地渲染
**长期**: 方案 A (独立服务) + Lambda 渲染

理由：
1. 先验证效果，再投入云服务成本
2. 本地渲染可用于预览和短视频
3. 长视频/高质量视频走云端

---

## 📝 下一步行动

1. **确认集成方案** - 选择方案 A 或 B
2. **创建迁移计划** - 详细任务列表
3. **开始迁移** - 按步骤执行
