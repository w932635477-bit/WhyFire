# 节拍同步与字幕特效系统实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 通过 web-audio-beat-detector 实现节拍检测，修复动态字幕系统，实现字幕特效与rap音乐精准同步。

**Architecture:** 使用 web-audio-beat-detector 分析音频获取 BPM 和偏移量，创建 TimestampMapper 将纯文本歌词映射到节拍点并生成 words 数组，修改 VideoSynthesizer 集成节拍检测流程。

**Tech Stack:** Next.js 15, TypeScript, web-audio-beat-detector, FFmpeg.wasm, Zustand

---

## Task 1: 安装依赖并创建类型定义

**Files:**
- Create: `src/lib/audio/types.ts`

**Step 1: 安装 web-audio-beat-detector**

```bash
npm install web-audio-beat-detector
```

Run: `npm install web-audio-beat-detector`
Expected: package added to package.json

**Step 2: 创建音频类型定义文件**

```typescript
// src/lib/audio/types.ts

/**
 * 节拍分析结果
 */
export interface BeatAnalysisResult {
  /** 每分钟节拍数 */
  bpm: number
  /** 第一拍的偏移时间 (ms) */
  offset: number
  /** 节拍间隔 (ms) */
  beatInterval: number
  /** 检测置信度 (0-1) */
  confidence: number
}

/**
 * 节拍分析器配置
 */
export interface BeatDetectorConfig {
  /** 最小 BPM */
  minBpm?: number
  /** 最大 BPM */
  maxBpm?: number
  /** 是否输出详细日志 */
  debug?: boolean
}

/**
 * 时间戳映射配置
 */
export interface TimestampMappingConfig {
  /** 是否对齐到节拍 */
  alignToBeats: boolean
  /** 每个词的最小时长 (ms) */
  minWordDuration: number
  /** 是否生成 words 数组 */
  generateWords: boolean
}
```

**Step 3: Commit 类型定义**

```bash
git add package.json package-lock.json src/lib/audio/types.ts
git commit -m "feat: 添加 web-audio-beat-detector 依赖和音频类型定义"
```

---

## Task 2: 创建 BeatDetector 节拍检测器

**Files:**
- Create: `src/lib/audio/beat-detector.ts`
- Create: `src/lib/audio/__tests__/beat-detector.test.ts`

**Step 1: 编写 BeatDetector 测试**

```typescript
// src/lib/audio/__tests__/beat-detector.test.ts

import { BeatDetector } from '../beat-detector'
import { BeatAnalysisResult } from '../types'

// Mock web-audio-beat-detector
jest.mock('web-audio-beat-detector', () => ({
  analyze: jest.fn(),
}))

describe('BeatDetector', () => {
  let detector: BeatDetector

  beforeEach(() => {
    detector = new BeatDetector()
  })

  describe('analyze', () => {
    it('should return beat analysis result for valid audio', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024)
      const mockResult = {
        bpm: 120,
        offset: 0.5,
      }

      const webAudioBeatDetector = require('web-audio-beat-detector')
      webAudioBeatDetector.analyze.mockResolvedValue(mockResult)

      const result = await detector.analyze(mockAudioBuffer)

      expect(result.bpm).toBe(120)
      expect(result.offset).toBe(500) // 转换为 ms
      expect(result.beatInterval).toBe(500) // 60000 / 120
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should clamp BPM to valid range', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024)
      const mockResult = {
        bpm: 300, // 超出正常范围
        offset: 0.5,
      }

      const webAudioBeatDetector = require('web-audio-beat-detector')
      webAudioBeatDetector.analyze.mockResolvedValue(mockResult)

      const result = await detector.analyze(mockAudioBuffer)

      expect(result.bpm).toBeLessThanOrEqual(200)
      expect(result.bpm).toBeGreaterThanOrEqual(60)
    })

    it('should handle analysis failure gracefully', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024)

      const webAudioBeatDetector = require('web-audio-beat-detector')
      webAudioBeatDetector.analyze.mockRejectedValue(new Error('Analysis failed'))

      await expect(detector.analyze(mockAudioBuffer)).rejects.toThrow('节拍分析失败')
    })
  })
})
```

**Step 2: 运行测试确认失败**

Run: `npm test src/lib/audio/__tests__/beat-detector.test.ts`
Expected: FAIL - Cannot find module '../beat-detector'

**Step 3: 实现 BeatDetector**

```typescript
// src/lib/audio/beat-detector.ts

import { analyze } from 'web-audio-beat-detector'
import { BeatAnalysisResult, BeatDetectorConfig } from './types'

/**
 * 默认配置
 */
const DEFAULT_CONFIG: BeatDetectorConfig = {
  minBpm: 60,
  maxBpm: 200,
  debug: false,
}

/**
 * 节拍检测器
 * 使用 web-audio-beat-detector 分析音频的 BPM 和节拍偏移
 */
export class BeatDetector {
  private config: BeatDetectorConfig

  constructor(config: Partial<BeatDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 分析音频的节拍信息
   * @param audioBuffer 音频数据
   * @returns 节拍分析结果
   */
  async analyze(audioBuffer: ArrayBuffer): Promise<BeatAnalysisResult> {
    try {
      if (this.config.debug) {
        console.log('[BeatDetector] 开始分析音频...')
      }

      // web-audio-beat-detector 需要完整的 AudioBuffer
      // 但我们传入 ArrayBuffer，需要先解码
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const decodedBuffer = await audioContext.decodeAudioData(audioBuffer)

      // 分析节拍
      const result = await analyze(decodedBuffer)

      // 关闭 AudioContext
      await audioContext.close()

      // 将 BPM 限制在合理范围内
      const bpm = this.clampBpm(result.bpm)
      const offset = result.offset * 1000 // 转换为 ms
      const beatInterval = 60000 / bpm // 每拍的时长 (ms)

      // 计算置信度（基于 BPM 的合理性）
      const confidence = this.calculateConfidence(result.bpm)

      if (this.config.debug) {
        console.log(`[BeatDetector] 分析完成: BPM=${bpm}, offset=${offset}ms, confidence=${confidence}`)
      }

      return {
        bpm,
        offset,
        beatInterval,
        confidence,
      }
    } catch (error) {
      console.error('[BeatDetector] 分析失败:', error)
      throw new Error(`节拍分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 将 BPM 限制在有效范围内
   */
  private clampBpm(bpm: number): number {
    return Math.max(
      this.config.minBpm || 60,
      Math.min(this.config.maxBpm || 200, bpm)
    )
  }

  /**
   * 计算置信度
   * BPM 在 80-160 范围内置信度较高
   */
  private calculateConfidence(bpm: number): number {
    if (bpm >= 80 && bpm <= 160) {
      return 0.9
    } else if (bpm >= 60 && bpm <= 200) {
      return 0.7
    }
    return 0.5
  }
}

/**
 * 创建节拍检测器实例
 */
export function createBeatDetector(config?: Partial<BeatDetectorConfig>): BeatDetector {
  return new BeatDetector(config)
}
```

**Step 4: 运行测试确认通过**

Run: `npm test src/lib/audio/__tests__/beat-detector.test.ts`
Expected: PASS - all tests pass

**Step 5: Commit BeatDetector**

```bash
git add src/lib/audio/beat-detector.ts src/lib/audio/__tests__/beat-detector.test.ts
git commit -m "feat: 实现 BeatDetector 节拍检测器"
```

---

## Task 3: 创建 TimestampMapper 时间戳映射器

**Files:**
- Create: `src/lib/audio/timestamp-mapper.ts`
- Create: `src/lib/audio/__tests__/timestamp-mapper.test.ts`

**Step 1: 编写 TimestampMapper 测试**

```typescript
// src/lib/audio/__tests__/timestamp-mapper.test.ts

import { TimestampMapper } from '../timestamp-mapper'
import { BeatAnalysisResult } from '../types'
import { LyricLineWithWords } from '@/lib/effects/types'

describe('TimestampMapper', () => {
  let mapper: TimestampMapper

  beforeEach(() => {
    mapper = new TimestampMapper()
  })

  describe('mapLyricsToBeats', () => {
    const beatInfo: BeatAnalysisResult = {
      bpm: 120,
      offset: 0,
      beatInterval: 500,
      confidence: 0.9,
    }

    it('should map single line lyrics correctly', () => {
      const lyrics = '这是一句测试歌词'
      const duration = 5000 // 5秒

      const result = mapper.mapLyricsToBeats(lyrics, beatInfo, duration)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('这是一句测试歌词')
      expect(result[0].startTime).toBe(0)
      expect(result[0].endTime).toBe(5000)
      expect(result[0].words).toBeDefined()
      expect(result[0].words!.length).toBeGreaterThan(0)
    })

    it('should map multiple lines with beat alignment', () => {
      const lyrics = `第一句歌词
第二句歌词
第三句歌词`
      const duration = 9000 // 9秒，每句3秒 = 6拍

      const result = mapper.mapLyricsToBeats(lyrics, beatInfo, duration)

      expect(result).toHaveLength(3)

      // 每句应该对齐到节拍点
      result.forEach(line => {
        expect(line.startTime % beatInfo.beatInterval).toBeLessThan(50) // 允许50ms误差
      })

      // 检查顺序
      expect(result[0].startTime).toBeLessThan(result[1].startTime)
      expect(result[1].startTime).toBeLessThan(result[2].startTime)
    })

    it('should generate words array with proper timing', () => {
      const lyrics = '测试'
      const duration = 1000

      const result = mapper.mapLyricsToBeats(lyrics, beatInfo, duration)

      expect(result[0].words).toBeDefined()
      expect(result[0].words!.length).toBe(2) // 两个字

      // 验证 words 的时间戳
      const words = result[0].words!
      words.forEach((word, index) => {
        expect(word.text).toBeDefined()
        expect(word.startTime).toBeGreaterThanOrEqual(result[0].startTime)
        expect(word.endTime).toBeLessThanOrEqual(result[0].endTime)

        if (index > 0) {
          expect(word.startTime).toBeGreaterThanOrEqual(words[index - 1].endTime)
        }
      })
    })

    it('should handle empty lyrics', () => {
      const result = mapper.mapLyricsToBeats('', beatInfo, 5000)
      expect(result).toHaveLength(0)
    })

    it('should respect beat offset', () => {
      const beatInfoWithOffset: BeatAnalysisResult = {
        ...beatInfo,
        offset: 500, // 500ms 偏移
      }

      const lyrics = '测试歌词'
      const duration = 5000

      const result = mapper.mapLyricsToBeats(lyrics, beatInfoWithOffset, duration)

      // 第一句应该从 offset 开始或之后
      expect(result[0].startTime).toBeGreaterThanOrEqual(beatInfoWithOffset.offset)
    })
  })
})
```

**Step 2: 运行测试确认失败**

Run: `npm test src/lib/audio/__tests__/timestamp-mapper.test.ts`
Expected: FAIL - Cannot find module '../timestamp-mapper'

**Step 3: 实现 TimestampMapper**

```typescript
// src/lib/audio/timestamp-mapper.ts

import { BeatAnalysisResult, TimestampMappingConfig } from './types'
import { LyricLineWithWords, LyricWord } from '@/lib/effects/types'

/**
 * 默认配置
 */
const DEFAULT_CONFIG: TimestampMappingConfig = {
  alignToBeats: true,
  minWordDuration: 100, // 每个词最小时长 100ms
  generateWords: true,
}

/**
 * 时间戳映射器
 * 将纯文本歌词映射到节拍点，生成带时间戳的歌词结构
 */
export class TimestampMapper {
  private config: TimestampMappingConfig

  constructor(config: Partial<TimestampMappingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 将纯文本歌词映射到节拍
   * @param plainText 纯文本歌词
   * @param beatInfo 节拍信息
   * @param audioDuration 音频总时长 (ms)
   * @returns 带时间戳的歌词数组
   */
  mapLyricsToBeats(
    plainText: string,
    beatInfo: BeatAnalysisResult,
    audioDuration: number
  ): LyricLineWithWords[] {
    // 解析歌词行
    const lines = this.parseLines(plainText)

    if (lines.length === 0) {
      return []
    }

    // 计算每行的时长
    const lineDuration = this.calculateLineDurations(lines, beatInfo, audioDuration)

    // 为每行生成时间戳和 words 数组
    const results: LyricLineWithWords[] = []
    let currentTime = beatInfo.offset // 从偏移量开始

    lines.forEach((line, index) => {
      const duration = lineDuration[index]
      const startTime = this.alignToBeat(currentTime, beatInfo.beatInterval)
      const endTime = startTime + duration

      // 生成 words 数组
      const words = this.config.generateWords
        ? this.generateWords(line, startTime, duration)
        : undefined

      results.push({
        id: `line-${index}`,
        text: line,
        startTime,
        endTime,
        words,
      })

      currentTime = endTime
    })

    return results
  }

  /**
   * 解析歌词行
   */
  private parseLines(text: string): string[] {
    return text
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }

  /**
   * 计算每行的时长
   */
  private calculateLineDurations(
    lines: string[],
    beatInfo: BeatAnalysisResult,
    totalDuration: number
  ): number[] {
    // 可用于歌词的时间（排除偏移）
    const availableDuration = totalDuration - beatInfo.offset

    // 计算每行的字符数权重
    const charCounts = lines.map(line => line.length)
    const totalChars = charCounts.reduce((sum, count) => sum + count, 0)

    // 按字符数分配时间，但确保至少2拍
    const minDuration = beatInfo.beatInterval * 2

    return charCounts.map(charCount => {
      const proportionalDuration = (charCount / totalChars) * availableDuration
      return Math.max(minDuration, proportionalDuration)
    })
  }

  /**
   * 将时间对齐到最近的节拍点
   */
  private alignToBeat(time: number, beatInterval: number): number {
    if (!this.config.alignToBeats) {
      return time
    }

    const nearestBeat = Math.round(time / beatInterval) * beatInterval
    return nearestBeat
  }

  /**
   * 为一行歌词生成 words 数组
   */
  private generateWords(
    line: string,
    startTime: number,
    duration: number
  ): LyricWord[] {
    const words: LyricWord[] = []

    // 中文按字符分割，英文按空格分割
    const segments = this.splitIntoWords(line)
    const wordDuration = Math.max(this.config.minWordDuration, duration / segments.length)

    segments.forEach((segment, index) => {
      words.push({
        text: segment,
        startTime: startTime + index * wordDuration,
        endTime: startTime + (index + 1) * wordDuration,
      })
    })

    // 确保最后一个 word 的 endTime 等于行的 endTime
    if (words.length > 0) {
      words[words.length - 1].endTime = startTime + duration
    }

    return words
  }

  /**
   * 将文本分割为词/字符
   */
  private splitIntoWords(text: string): string[] {
    // 检测是否包含中文
    const hasChinese = /[\u4e00-\u9fa5]/.test(text)

    if (hasChinese) {
      // 中文：每个字符作为一个 word
      return text.split('')
    } else {
      // 英文：按空格分割
      return text.split(/\s+/).filter(w => w.length > 0)
    }
  }
}

/**
 * 创建时间戳映射器实例
 */
export function createTimestampMapper(config?: Partial<TimestampMappingConfig>): TimestampMapper {
  return new TimestampMapper(config)
}
```

**Step 4: 运行测试确认通过**

Run: `npm test src/lib/audio/__tests__/timestamp-mapper.test.ts`
Expected: PASS - all tests pass

**Step 5: Commit TimestampMapper**

```bash
git add src/lib/audio/timestamp-mapper.ts src/lib/audio/__tests__/timestamp-mapper.test.ts
git commit -m "feat: 实现 TimestampMapper 时间戳映射器"
```

---

## Task 4: 创建音频工具模块入口

**Files:**
- Create: `src/lib/audio/index.ts`

**Step 1: 创建导出文件**

```typescript
// src/lib/audio/index.ts

export * from './types'
export * from './beat-detector'
export * from './timestamp-mapper'
```

**Step 2: Commit**

```bash
git add src/lib/audio/index.ts
git commit -m "feat: 创建音频模块入口"
```

---

## Task 5: 更新 VideoSynthesizer 集成节拍检测

**Files:**
- Modify: `src/lib/ffmpeg/video-synthesizer.ts`

**Step 1: 导入音频模块**

在文件顶部添加导入：

```typescript
// src/lib/ffmpeg/video-synthesizer.ts
// 在现有导入后添加：

import {
  BeatDetector,
  TimestampMapper,
  BeatAnalysisResult,
} from '../audio'
import { LyricLineWithWords } from '../effects/types'
```

**Step 2: 添加节拍检测私有方法**

在 VideoSynthesizer 类中添加：

```typescript
// src/lib/ffmpeg/video-synthesizer.ts
// 在 VideoSynthesizer 类中添加：

/**
 * 分析音频节拍
 */
private async analyzeBeat(audioUrl: string): Promise<BeatAnalysisResult> {
  console.log('[VideoSynthesizer] 开始分析音频节拍...')

  try {
    // 获取音频数据
    const response = await fetch(audioUrl)
    const arrayBuffer = await response.arrayBuffer()

    // 使用节拍检测器分析
    const detector = new BeatDetector({ debug: this.config.debug })
    const beatInfo = await detector.analyze(arrayBuffer)

    console.log(`[VideoSynthesizer] 节拍分析完成: BPM=${beatInfo.bpm}, offset=${beatInfo.offset}ms`)

    return beatInfo
  } catch (error) {
    console.error('[VideoSynthesizer] 节拍分析失败:', error)
    // 返回默认值，确保流程继续
    return {
      bpm: 120,
      offset: 0,
      beatInterval: 500,
      confidence: 0.5,
    }
  }
}

/**
 * 将纯文本歌词转换为带时间戳的歌词
 */
private mapLyricsToTimestamps(
  lyrics: string,
  beatInfo: BeatAnalysisResult,
  audioDuration: number
): LyricLineWithWords[] {
  const mapper = new TimestampMapper({
    alignToBeats: true,
    generateWords: true,
    minWordDuration: 100,
  })

  return mapper.mapLyricsToBeats(lyrics, beatInfo, audioDuration)
}
```

**Step 3: 更新 synthesize 方法**

找到 `synthesize` 方法，修改为：

```typescript
// src/lib/ffmpeg/video-synthesizer.ts
// 修改 synthesize 方法：

async synthesize(
  videoFile: File,
  audioUrl: string,
  lyrics: string, // 注意：这里改为 string，因为我们需要处理纯文本
  onProgress?: (progress: number) => void
): Promise<Blob> {
  console.log('[VideoSynthesizer] 开始视频合成流程...')

  try {
    // 1. 加载 FFmpeg
    onProgress?.(5)
    await this.loadFFmpeg()

    // 2. 获取音频时长和分析节拍
    onProgress?.(10)
    const audioDuration = await this.getAudioDuration(audioUrl)

    // 新增：分析节拍
    onProgress?.(15)
    const beatInfo = await this.analyzeBeat(audioUrl)

    // 3. 将纯文本歌词转换为带时间戳的歌词
    onProgress?.(20)
    const syncedLyrics = this.mapLyricsToTimestamps(lyrics, beatInfo, audioDuration)

    // 4. 生成字幕文件
    onProgress?.(25)
    await this.writeSubtitleFile(syncedLyrics)

    // 5. 写入输入文件
    onProgress?.(30)
    await this.writeInputFiles(videoFile, audioUrl)

    // 6. 加载字体
    onProgress?.(35)
    await this.loadFonts()

    // 7. 执行 FFmpeg 命令
    onProgress?.(40)
    const outputBlob = await this.executeFFmpegCommand(onProgress)

    // 8. 清理
    onProgress?.(95)
    await this.cleanup()

    onProgress?.(100)
    console.log('[VideoSynthesizer] 视频合成完成')

    return outputBlob
  } catch (error) {
    console.error('[VideoSynthesizer] 合成失败:', error)
    throw error
  }
}
```

**Step 4: 更新 writeSubtitleFile 方法**

修改为接收 LyricLineWithWords[]：

```typescript
// src/lib/ffmpeg/video-synthesizer.ts

/**
 * 写入字幕文件
 */
private async writeSubtitleFile(lyrics: LyricLineWithWords[]): Promise<void> {
  // 使用 EffectsConfigEngine 生成 ASS 字幕
  const engine = new EffectsConfigEngine(this.config.effectsConfig)
  const renderedConfig = engine.render(lyrics, 'subs.ass')

  // 写入虚拟文件系统
  await this.ffmpeg!.writeFile('subs.ass', renderedConfig.assContent)

  console.log('[VideoSynthesizer] 字幕文件已生成')
}
```

**Step 5: Commit VideoSynthesizer 修改**

```bash
git add src/lib/ffmpeg/video-synthesizer.ts
git commit -m "feat: VideoSynthesizer 集成节拍检测和时间戳映射"
```

---

## Task 6: 更新 Zustand Store 添加节拍状态

**Files:**
- Modify: `src/stores/video-creation-store.ts`

**Step 1: 添加节拍状态类型**

在文件中添加：

```typescript
// src/stores/video-creation-store.ts

import { BeatAnalysisResult } from '@/lib/audio/types'

// 在 VideoCreationState 接口中添加：
interface VideoCreationState {
  // ... 现有字段

  // 新增：节拍信息
  beatInfo: BeatAnalysisResult | null
  isAnalyzingBeat: boolean
}

// 在 VideoCreationActions 接口中添加：
interface VideoCreationActions {
  // ... 现有方法

  // 新增：节拍分析方法
  setBeatInfo: (beatInfo: BeatAnalysisResult | null) => void
  setIsAnalyzingBeat: (isAnalyzing: boolean) => void
}
```

**Step 2: 更新初始状态和 actions**

```typescript
// src/stores/video-creation-store.ts

export const useVideoCreationStore = create<VideoCreationState & VideoCreationActions>((set) => ({
  // ... 现有初始状态

  // 新增
  beatInfo: null,
  isAnalyzingBeat: false,

  // ... 现有 actions

  // 新增
  setBeatInfo: (beatInfo) => set({ beatInfo }),
  setIsAnalyzingBeat: (isAnalyzingBeat) => set({ isAnalyzingBeat }),
}))
```

**Step 3: Commit Store 修改**

```bash
git add src/stores/video-creation-store.ts
git commit -m "feat: VideoCreation Store 添加节拍分析状态"
```

---

## Task 7: 更新 UI 显示分析进度

**Files:**
- Modify: `src/components/video-creation/VideoPreview.tsx` (或类似的视频预览组件)

**Step 1: 添加节拍分析进度提示**

找到视频合成相关组件，添加状态显示：

```typescript
// 在视频合成组件中

import { useVideoCreationStore } from '@/stores/video-creation-store'

export function VideoPreview() {
  const { isAnalyzingBeat, beatInfo } = useVideoCreationStore()

  return (
    <div>
      {/* 现有内容 */}

      {/* 新增：显示节拍分析状态 */}
      {isAnalyzingBeat && (
        <div className="text-sm text-gray-500">
          正在分析音乐节拍...
        </div>
      )}

      {/* 新增：显示节拍信息 */}
      {beatInfo && (
        <div className="text-xs text-gray-400">
          BPM: {beatInfo.bpm} | 置信度: {(beatInfo.confidence * 100).toFixed(0)}%
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit UI 修改**

```bash
git add src/components/video-creation/VideoPreview.tsx
git commit -m "feat: UI 添加节拍分析进度显示"
```

---

## Task 8: 端到端测试

**Files:**
- Create: `src/lib/audio/__tests__/integration.test.ts`

**Step 1: 编写集成测试**

```typescript
// src/lib/audio/__tests__/integration.test.ts

import { BeatDetector } from '../beat-detector'
import { TimestampMapper } from '../timestamp-mapper'
import { BeatAnalysisResult } from '../types'

describe('Beat Detection Integration', () => {
  it('should integrate beat detection with timestamp mapping', async () => {
    // 模拟节拍信息
    const beatInfo: BeatAnalysisResult = {
      bpm: 120,
      offset: 0,
      beatInterval: 500,
      confidence: 0.9,
    }

    const mapper = new TimestampMapper()
    const lyrics = `这是第一句歌词
这是第二句歌词
这是第三句歌词`

    const duration = 9000 // 9秒

    const result = mapper.mapLyricsToBeats(lyrics, beatInfo, duration)

    // 验证结果
    expect(result.length).toBe(3)

    // 验证时间对齐
    result.forEach((line, index) => {
      expect(line.startTime % beatInfo.beatInterval).toBeLessThan(50)
      expect(line.words).toBeDefined()
      expect(line.words!.length).toBeGreaterThan(0)

      console.log(`Line ${index + 1}: "${line.text}" (${line.startTime}ms - ${line.endTime}ms)`)
      line.words!.forEach(word => {
        console.log(`  Word: "${word.text}" (${word.startTime}ms - ${word.endTime}ms)`)
      })
    })
  })

  it('should handle various BPM ranges', () => {
    const mapper = new TimestampMapper()
    const lyrics = '测试歌词'

    const testBpms = [60, 90, 120, 140, 180]

    testBpms.forEach(bpm => {
      const beatInfo: BeatAnalysisResult = {
        bpm,
        offset: 0,
        beatInterval: 60000 / bpm,
        confidence: 0.9,
      }

      const result = mapper.mapLyricsToBeats(lyrics, beatInfo, 5000)

      expect(result.length).toBe(1)
      expect(result[0].words).toBeDefined()
    })
  })
})
```

**Step 2: 运行集成测试**

Run: `npm test src/lib/audio/__tests__/integration.test.ts`
Expected: PASS

**Step 3: Commit 集成测试**

```bash
git add src/lib/audio/__tests__/integration.test.ts
git commit -m "test: 添加节拍检测集成测试"
```

---

## Task 9: 修复字体加载问题

**Files:**
- Modify: `src/lib/ffmpeg/video-synthesizer.ts`

**Step 1: 验证字体加载逻辑**

找到 `loadFonts` 方法，确保：

```typescript
// src/lib/ffmpeg/video-synthesizer.ts

/**
 * 加载字体到虚拟文件系统
 */
private async loadFonts(): Promise<void> {
  console.log('[VideoSynthesizer] 开始加载字体...')

  const fonts = [
    {
      name: 'NotoSansSC-Regular.otf',
      url: 'https://cdn.jsdelivr.net/npm/@aspect-ratio/noto-sans-sc@1.0.0/files/NotoSansSC-Regular.otf',
    },
  ]

  for (const font of fonts) {
    try {
      console.log(`[VideoSynthesizer] 加载字体: ${font.name}`)

      const response = await fetch(font.url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const fontData = await response.arrayBuffer()
      await this.ffmpeg!.writeFile(font.name, new Uint8Array(fontData))

      console.log(`[VideoSynthesizer] 字体加载成功: ${font.name}`)
    } catch (error) {
      console.error(`[VideoSynthesizer] 字体加载失败: ${font.name}`, error)
      // 继续执行，使用默认字体
    }
  }
}
```

**Step 2: 更新 ASS 字幕生成使用加载的字体**

确保 subtitle-effects.ts 中的字体名称与加载的字体匹配：

```typescript
// src/lib/effects/subtitle-effects.ts

export const DEFAULT_SUBTITLE_CONFIG: SubtitleEffectConfig = {
  // ...
  fontFamily: 'Noto Sans SC', // 确保与加载的字体名称一致
  // ...
}
```

**Step 3: Commit 字体修复**

```bash
git add src/lib/ffmpeg/video-synthesizer.ts src/lib/effects/subtitle-effects.ts
git commit -m "fix: 验证和修复字体加载逻辑"
```

---

## Task 10: 最终验证和文档更新

**Step 1: 运行完整测试套件**

Run: `npm test`
Expected: All tests pass

**Step 2: 运行 lint 检查**

Run: `npm run lint`
Expected: No errors

**Step 3: 更新 README**

在项目 README 中添加节拍同步功能说明：

```markdown
## 节拍同步功能

视频合成支持自动节拍检测和字幕同步：

- 使用 web-audio-beat-detector 分析音频 BPM
- 自动将歌词对齐到节拍点
- 为每个字符/词生成时间戳
- 支持所有 7 种字幕特效

### 支持的字幕特效

- **增强卡拉OK (karaoke-plus)**: 逐字高亮配合光泽流动
- **打击效果 (punch)**: 每个词带缩放冲击
- **3D弹跳 (bounce-3d)**: 3D旋转弹跳效果
- **故障文字 (glitch-text)**: 文字抖动配色彩分离
- **霓虹脉冲 (neon-pulse)**: 霓虹呼吸灯效果
- **波浪 (wave)**: 文字波浪起伏
- **爆炸 (explosion)**: 文字爆炸出现
```

**Step 4: 最终 Commit**

```bash
git add README.md
git commit -m "docs: 更新 README 添加节拍同步功能说明"
```

---

## 完成标准

- [ ] web-audio-beat-detector 成功安装
- [ ] BeatDetector 类通过所有测试
- [ ] TimestampMapper 类通过所有测试
- [ ] VideoSynthesizer 成功集成节拍检测
- [ ] Zustand Store 正确管理节拍状态
- [ ] UI 显示分析进度
- [ ] 字幕特效与音乐节拍同步
- [ ] 所有 7 种字幕特效正常工作
- [ ] 字体正确加载
- [ ] 所有测试通过
- [ ] Lint 无错误

## 预计时间

- Task 1-4: 2-3 小时（核心组件）
- Task 5-7: 2-3 小时（集成）
- Task 8-10: 1-2 小时（测试和优化）

**总计: 5-8 小时**
