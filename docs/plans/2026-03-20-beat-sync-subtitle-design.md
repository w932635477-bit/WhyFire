# 节拍同步与字幕特效系统设计

## 概述

本设计文档描述如何通过 web-audio-beat-detector 实现音乐节拍检测，并修复动态字幕系统，实现字幕特效与rap音乐的精准同步。

## 当前问题

### 1. 字幕系统完全失效
- **现象**: 动态字幕只显示为底部小字，与rap歌词完全不对齐
- **根本原因**:
  - 歌词API返回纯文本，没有时间戳
  - `parsePlainText()` 使用固定3秒间隔，无视音乐节奏
  - 没有 `words` 数组，所有动态特效降级为简单模式
  - 字体加载可能失败

### 2. 缺乏节拍同步
- 视频特效与音乐完全脱节
- 无法实现卡点效果

## 解决方案架构

```
用户输入 → AI生成歌词(纯文本)
    ↓
MiniMax生成音乐 → 音频文件
    ↓
web-audio-beat-detector → BPM + 节拍偏移
    ↓
智能时间戳分配 → LyricLine[] with words[]
    ↓
EffectsConfigEngine → ASS字幕 + 特效标签
    ↓
FFmpeg.wasm → 最终视频
```

## 核心组件设计

### 1. 节拍检测器 (BeatDetector)

**文件**: `src/lib/audio/beat-detector.ts`

```typescript
interface BeatAnalysisResult {
  bpm: number           // 每分钟节拍数
  offset: number        // 第一拍的偏移时间(ms)
  beatInterval: number  // 节拍间隔(ms)
  confidence: number    // 检测置信度
}

class BeatDetector {
  async analyze(audioBuffer: ArrayBuffer): Promise<BeatAnalysisResult>
}
```

**依赖**: web-audio-beat-detector

### 2. 智能时间戳分配器 (TimestampMapper)

**文件**: `src/lib/audio/timestamp-mapper.ts`

```typescript
interface MappingConfig {
  bpm: number
  offset: number
  totalDuration: number
}

class TimestampMapper {
  // 根据节拍信息为纯文本歌词生成时间戳
  mapLyricsToBeats(
    plainText: string,
    beatInfo: BeatAnalysisResult,
    audioDuration: number
  ): LyricLineWithWords[]
}
```

**算法逻辑**:
1. 计算每拍时长 = 60000 / BPM (ms)
2. 根据歌词行数和总时长，分配每行的起始时间
3. 对齐到最近的节拍点
4. 为每行生成 words 数组（按音节/字符分割）

### 3. 修复歌词API

**文件**: `src/app/api/lyrics/route.ts`

当前只返回纯文本，需要扩展支持结构化返回：

```typescript
interface LyricsResponse {
  plainText: string      // 纯文本歌词
  structured?: {         // 可选：预分段
    verses: string[]     // 主歌段落
    chorus?: string      // 副歌
  }
}
```

### 4. 更新视频合成流程

**文件**: `src/lib/ffmpeg/video-synthesizer.ts`

修改 `synthesize()` 方法：

```typescript
// 1. 加载音频
const audioBuffer = await this.loadAudio(audioUrl)

// 2. 分析节拍
const beatInfo = await beatDetector.analyze(audioBuffer)

// 3. 生成带时间戳的歌词
const syncedLyrics = timestampMapper.mapLyricsToBeats(
  lyrics,
  beatInfo,
  audioDuration
)

// 4. 生成ASS字幕
const assContent = effectsEngine.render(syncedLyrics)
```

## 数据流

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面                              │
│  场景选择 → 产品信息 → 歌词生成 → 音乐生成 → 视频合成       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     歌词生成 (API)                           │
│  输入: scene, productInfo                                    │
│  输出: plainText lyrics                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     音乐生成 (MiniMax)                       │
│  输入: lyrics, style, duration                               │
│  输出: audio URL + ArrayBuffer                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     节拍分析 (新增)                          │
│  输入: audio ArrayBuffer                                     │
│  输出: { bpm, offset, beatInterval, confidence }            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     时间戳映射 (新增)                        │
│  输入: lyrics, beatInfo, duration                            │
│  输出: LyricLineWithWords[]                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     字幕特效渲染                             │
│  输入: syncedLyrics, effectType, config                      │
│  输出: ASS content with effects                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     视频合成 (FFmpeg.wasm)                   │
│  输入: video, audio, ASS, fonts                              │
│  输出: final video with synced subtitles                     │
└─────────────────────────────────────────────────────────────┘
```

## 实施步骤

### Phase 1: 基础设施 (1天)

1. **安装依赖**
   ```bash
   npm install web-audio-beat-detector
   ```

2. **创建 BeatDetector 类**
   - 封装 web-audio-beat-detector
   - 处理错误和边界情况
   - 添加置信度检查

3. **创建 TimestampMapper 类**
   - 实现基础节拍对齐算法
   - 生成 words 数组
   - 处理边界情况（歌词过长/过短）

### Phase 2: 集成 (1天)

4. **修改 VideoSynthesizer**
   - 在合成流程中集成节拍检测
   - 更新状态管理（显示分析进度）

5. **更新 Zustand Store**
   - 添加 beatInfo 状态
   - 添加分析进度状态

6. **UI 反馈**
   - 显示 "正在分析节拍..." 进度
   - 显示 BPM 信息（可选）

### Phase 3: 优化 (半天)

7. **字体加载验证**
   - 确保字体正确加载到虚拟文件系统
   - 添加回退字体

8. **效果调优**
   - 调整特效参数以匹配节拍
   - 测试各种音乐风格

## 预期效果

### 成功标准

1. **字幕同步**: 歌词与音乐节拍对齐，误差 < 100ms
2. **动态特效**: 所有7种字幕特效正常工作
3. **words数组**: 每行歌词正确分割为words
4. **用户体验**: 显示分析进度，无长时间无响应

### 效果预览

- **karaoke-plus**: 逐字高亮，颜色渐变，跟随节拍
- **punch**: 每个词缩放冲击，与鼓点同步
- **bounce-3d**: 3D旋转弹跳，节奏感强
- **glitch-text**: 故障抖动，适合Trap
- **neon-pulse**: 霓虹脉冲，适合Chill
- **wave**: 波浪起伏，适合Melodic
- **explosion**: 爆炸出现，适合Hardcore

## 技术限制

1. **web-audio-beat-detector 限制**:
   - 只提供 BPM 和偏移量，无精确节拍点
   - 对某些音乐风格检测可能不准确
   - 需要完整的音频数据

2. **时间戳分配假设**:
   - 假设歌词均匀分布在音频中
   - 无法识别 verse/chorus 结构
   - 无法检测音乐高潮点

## 后续优化方向

1. **Phase 3 (可选)**: 部署 BeatNet 后端，获取精确节拍点
2. **歌词分段**: AI 识别 verse/chorus，更智能的时间分配
3. **能量曲线**: 根据音频能量动态调整特效强度
4. **用户微调**: 允许用户手动调整时间戳

## 文件清单

### 新增文件
- `src/lib/audio/beat-detector.ts` - 节拍检测器
- `src/lib/audio/timestamp-mapper.ts` - 时间戳映射器
- `src/lib/audio/types.ts` - 音频相关类型定义

### 修改文件
- `src/lib/ffmpeg/video-synthesizer.ts` - 集成节拍检测
- `src/stores/video-creation-store.ts` - 添加节拍状态
- `src/app/api/lyrics/route.ts` - 可选：扩展返回格式

## 测试计划

1. **单元测试**
   - BeatDetector: 测试不同 BPM 的音频
   - TimestampMapper: 测试边界情况

2. **集成测试**
   - 完整流程测试：歌词生成 → 音乐生成 → 节拍分析 → 视频合成
   - 测试不同音乐风格

3. **视觉验证**
   - 生成测试视频，验证字幕同步
   - 验证所有特效正常工作
