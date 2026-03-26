/**
 * Rhythm Adaptor - 节奏适配器
 * 将连续的 TTS 语音转换为有节奏的 Rap
 *
 * 核心功能：
 * 1. segmentSyllables - 音节切分（中文按字符，英文按单词）
 * 2. alignToBeats - 节拍对齐（将音节映射到 BPM 网格）
 * 3. stretchTiming - 时间拉伸（调整音节时长以适应节奏）
 * 4. adapt - 综合处理入口
 */

import type { BeatAnalysisResult } from './types'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 音节
 */
export interface Syllable {
  /** 音节文本 */
  text: string
  /** 原始文本中的起始索引 */
  startIndex: number
  /** 原始文本中的结束索引 */
  endIndex: number
  /** 是否是标点（用于停顿判断） */
  isPunctuation?: boolean
}

/**
 * 对齐后的音节
 */
export interface AlignedSyllable extends Syllable {
  /** 开始时间 (ms) */
  startTime: number
  /** 结束时间 (ms) */
  endTime: number
  /** 持续时间 (ms) */
  duration: number
  /** 对应的节拍索引 */
  beatIndex: number
}

/**
 * Adapt 结果
 */
export interface AdaptResult {
  /** 对齐后的音节数组 */
  syllables: AlignedSyllable[]
  /** 总时长 (ms) */
  totalDuration: number
  /** 使用的节拍信息 */
  beatInfo: BeatAnalysisResult
  /** 原始文本行（如果有多行） */
  lines?: AdaptResult[]
}

/**
 * Rhythm Adaptor 配置
 */
export interface RhythmAdaptorConfig {
  /** 每个音节的最小时长 (ms) */
  minSyllableDuration: number
  /** 每个音节的最大时长 (ms) */
  maxSyllableDuration: number
  /** 是否对齐到节拍 */
  alignToBeats: boolean
  /** 标点符号的停顿时长 (ms) */
  punctuationPause: number
  /** 是否输出详细日志 */
  debug: boolean
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_CONFIG: RhythmAdaptorConfig = {
  minSyllableDuration: 100,  // 最小 100ms
  maxSyllableDuration: 800,  // 最大 800ms
  alignToBeats: true,
  punctuationPause: 150,     // 标点停顿 150ms
  debug: false,
}

// ============================================================================
// 中文标点符号
// ============================================================================

const CHINESE_PUNCTUATION = new Set([
  '\u3001', '\u3002', '\uFF01', '\uFF1F', '\uFF1B', '\uFF1A', // 、。！？；：
  '\u201C', '\u201D', '\u2018', '\u2019', // ""''
  '\uFF08', '\uFF09', '\u3010', '\u3011', '\u300A', '\u300B', // （）【】《》
  '\uFF0C', '\u2026', // ，…
])

const ENGLISH_PUNCTUATION = new Set([
  ',', '.', '!', '?', ';', ':', '"', "'", '(', ')', '[', ']', '<', '>',
])

const ALL_PUNCTUATION = new Set(Array.from(CHINESE_PUNCTUATION).concat(Array.from(ENGLISH_PUNCTUATION)))

// ============================================================================
// Rhythm Adaptor 类
// ============================================================================

/**
 * 节奏适配器
 * 将歌词文本转换为节拍对齐的时间映射
 */
export class RhythmAdaptor {
  private config: RhythmAdaptorConfig

  constructor(config: Partial<RhythmAdaptorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ==========================================================================
  // 音节切分
  // ==========================================================================

  /**
   * 将文本切分为音节
   * 中文按字符切分，英文按单词切分
   *
   * @param text 输入文本
   * @returns 音节数组
   */
  segmentSyllables(text: string): Syllable[] {
    if (!text || text.length === 0) {
      return []
    }

    const syllables: Syllable[] = []
    let i = 0

    while (i < text.length) {
      const char = text[i]

      // 跳过空格和换行
      if (char === ' ' || char === '\n' || char === '\t' || char === '\r') {
        i++
        continue
      }

      // 处理标点符号（作为停顿标记，不作为音节）
      if (ALL_PUNCTUATION.has(char)) {
        // 可以选择添加停顿标记，但这里跳过
        i++
        continue
      }

      // 检测是否是中文
      if (this.isChinese(char)) {
        syllables.push({
          text: char,
          startIndex: i,
          endIndex: i + 1,
          isPunctuation: false,
        })
        i++
      }
      // 检测是否是数字
      else if (this.isDigit(char)) {
        // 连续数字作为一个整体
        let numStr = ''
        const startIndex = i
        while (i < text.length && this.isDigit(text[i])) {
          numStr += text[i]
          i++
        }
        syllables.push({
          text: numStr,
          startIndex,
          endIndex: i,
          isPunctuation: false,
        })
      }
      // 英文或其他字符
      else {
        // 连续英文字符作为一个单词
        let word = ''
        const startIndex = i
        while (i < text.length && !this.isChinese(text[i]) && !ALL_PUNCTUATION.has(text[i]) && !this.isSpace(text[i])) {
          word += text[i]
          i++
        }
        if (word.length > 0) {
          syllables.push({
            text: word,
            startIndex,
            endIndex: i,
            isPunctuation: false,
          })
        }
      }
    }

    if (this.config.debug) {
      console.log(`[RhythmAdaptor] segmentSyllables: ${syllables.length} syllables from "${text.substring(0, 20)}..."`)
    }

    return syllables
  }

  // ==========================================================================
  // 节拍对齐
  // ==========================================================================

  /**
   * 将音节对齐到节拍网格
   *
   * @param syllables 音节数组
   * @param beatInfo 节拍信息
   * @returns 对齐后的音节数组
   */
  alignToBeats(syllables: Syllable[], beatInfo: BeatAnalysisResult): AlignedSyllable[] {
    // 输入验证
    if (syllables.length === 0) {
      return []
    }

    if (beatInfo.beatInterval <= 0 || beatInfo.bpm <= 0) {
      console.warn('[RhythmAdaptor] Invalid beat info, using defaults')
      // 使用默认值
      const defaultBeatInterval = 500 // 120 BPM
      return this.alignSyllablesToBeatGrid(syllables, { ...beatInfo, beatInterval: defaultBeatInterval, bpm: 120 })
    }

    return this.alignSyllablesToBeatGrid(syllables, beatInfo)
  }

  /**
   * 将音节对齐到节拍网格的内部实现
   */
  private alignSyllablesToBeatGrid(
    syllables: Syllable[],
    beatInfo: BeatAnalysisResult
  ): AlignedSyllable[] {
    const alignedSyllables: AlignedSyllable[] = []
    const beatInterval = beatInfo.beatInterval
    const offsetMs = beatInfo.offset * 1000 // offset 是秒，转换为毫秒

    // 估算每个音节的默认时长（基于节拍间隔）
    const defaultDuration = Math.max(
      this.config.minSyllableDuration,
      Math.min(this.config.maxSyllableDuration, beatInterval * 0.8)
    )

    let currentTime = this.alignToBeat(offsetMs, beatInterval)
    let beatIndex = 0

    for (const syllable of syllables) {
      // 将开始时间对齐到最近的节拍点
      const alignedStartTime = this.config.alignToBeats
        ? this.alignToBeat(currentTime, beatInterval)
        : currentTime

      // 计算结束时间
      const duration = defaultDuration
      const endTime = alignedStartTime + duration

      alignedSyllables.push({
        ...syllable,
        startTime: alignedStartTime,
        endTime,
        duration,
        beatIndex,
      })

      // 移动到下一个位置
      currentTime = endTime
      beatIndex++
    }

    if (this.config.debug) {
      console.log(`[RhythmAdaptor] alignToBeats: ${alignedSyllables.length} syllables aligned, beat interval: ${beatInterval}ms`)
    }

    return alignedSyllables
  }

  /**
   * 将时间对齐到最近的节拍点
   */
  private alignToBeat(time: number, beatInterval: number): number {
    if (!this.config.alignToBeats || beatInterval <= 0) {
      return time
    }
    return Math.round(time / beatInterval) * beatInterval
  }

  // ==========================================================================
  // 时间拉伸
  // ==========================================================================

  /**
   * 按比例拉伸或压缩时间
   *
   * @param syllables 对齐后的音节数组
   * @param factor 拉伸因子（>1 拉伸，<1 压缩）
   * @returns 拉伸后的音节数组
   */
  stretchTiming(syllables: AlignedSyllable[], factor: number): AlignedSyllable[] {
    // 输入验证
    if (factor <= 0) {
      throw new Error(`stretchTiming: factor must be positive, got ${factor}`)
    }

    if (factor === 1) {
      return syllables.map(s => ({ ...s }))
    }

    if (syllables.length === 0) {
      return []
    }

    const stretchedSyllables: AlignedSyllable[] = []
    let currentTime = syllables[0].startTime

    for (const syllable of syllables) {
      const newDuration = Math.max(this.config.minSyllableDuration, syllable.duration * factor)

      stretchedSyllables.push({
        ...syllable,
        startTime: currentTime,
        endTime: currentTime + newDuration,
        duration: newDuration,
      })

      currentTime += newDuration
    }

    if (this.config.debug) {
      console.log(`[RhythmAdaptor] stretchTiming: factor ${factor}, total duration: ${currentTime}ms`)
    }

    return stretchedSyllables
  }

  // ==========================================================================
  // 综合处理
  // ==========================================================================

  /**
   * 综合处理：将歌词文本转换为节拍对齐的时间映射
   *
   * @param text 歌词文本
   * @param beatInfo 节拍信息
   * @param targetDuration 目标时长 (ms)
   * @returns 处理结果
   */
  adapt(
    text: string,
    beatInfo: BeatAnalysisResult,
    targetDuration: number
  ): AdaptResult {
    // 输入验证
    if (targetDuration <= 0) {
      console.warn('[RhythmAdaptor] adapt: targetDuration must be positive')
      return {
        syllables: [],
        totalDuration: 0,
        beatInfo,
      }
    }

    if (!text || text.trim().length === 0) {
      return {
        syllables: [],
        totalDuration: 0,
        beatInfo,
      }
    }

    // 检查是否有多行
    const lines = text.split(/\n+/).filter(line => line.trim().length > 0)

    if (lines.length > 1) {
      return this.adaptMultipleLines(lines, beatInfo, targetDuration)
    }

    // 单行处理
    // Step 1: 音节切分
    const syllables = this.segmentSyllables(text)

    if (syllables.length === 0) {
      return {
        syllables: [],
        totalDuration: 0,
        beatInfo,
      }
    }

    // Step 2: 节拍对齐
    const alignedSyllables = this.alignToBeats(syllables, beatInfo)

    // Step 3: 计算当前总时长
    const currentDuration = alignedSyllables.length > 0
      ? alignedSyllables[alignedSyllables.length - 1].endTime - alignedSyllables[0].startTime
      : 0

    // Step 4: 如果需要，进行时间拉伸以适应目标时长
    let finalSyllables = alignedSyllables
    const offsetMs = beatInfo.offset * 1000
    const availableDuration = targetDuration - offsetMs

    if (currentDuration > 0 && availableDuration > 0) {
      const stretchFactor = availableDuration / currentDuration

      // 只在差异显著时才拉伸（避免微小的调整）
      if (Math.abs(stretchFactor - 1) > 0.05) {
        // 限制拉伸范围，避免过度拉伸
        const clampedFactor = Math.max(0.5, Math.min(2.0, stretchFactor))
        finalSyllables = this.stretchTiming(alignedSyllables, clampedFactor)
      }
    }

    // 计算最终总时长
    const totalDuration = finalSyllables.length > 0
      ? finalSyllables[finalSyllables.length - 1].endTime
      : 0

    if (this.config.debug) {
      console.log(`[RhythmAdaptor] adapt: ${finalSyllables.length} syllables, ${totalDuration}ms total`)
    }

    return {
      syllables: finalSyllables,
      totalDuration,
      beatInfo,
    }
  }

  /**
   * 处理多行歌词
   */
  private adaptMultipleLines(
    lines: string[],
    beatInfo: BeatAnalysisResult,
    targetDuration: number
  ): AdaptResult {
    const offsetMs = beatInfo.offset * 1000
    const availableDuration = targetDuration - offsetMs
    const durationPerLine = availableDuration / lines.length

    const lineResults: AdaptResult[] = []
    const allSyllables: AlignedSyllable[] = []
    let currentTime = offsetMs

    for (const line of lines) {
      const syllables = this.segmentSyllables(line)

      if (syllables.length === 0) continue

      // 对齐到当前时间
      const alignedSyllables: AlignedSyllable[] = []
      const defaultDuration = Math.max(
        this.config.minSyllableDuration,
        Math.min(this.config.maxSyllableDuration, beatInfo.beatInterval * 0.8)
      )

      for (const syllable of syllables) {
        const startTime = this.config.alignToBeats
          ? this.alignToBeat(currentTime, beatInfo.beatInterval)
          : currentTime

        alignedSyllables.push({
          ...syllable,
          startTime,
          endTime: startTime + defaultDuration,
          duration: defaultDuration,
          beatIndex: allSyllables.length + alignedSyllables.length,
        })

        currentTime = startTime + defaultDuration
      }

      // 计算这行的结果
      const lineTotalDuration = alignedSyllables.length > 0
        ? alignedSyllables[alignedSyllables.length - 1].endTime - alignedSyllables[0].startTime
        : 0

      lineResults.push({
        syllables: alignedSyllables,
        totalDuration: lineTotalDuration,
        beatInfo,
      })

      allSyllables.push(...alignedSyllables)

      // 行间增加一点间隔
      currentTime += beatInfo.beatInterval * 0.5
    }

    return {
      syllables: allSyllables,
      totalDuration: allSyllables.length > 0 ? allSyllables[allSyllables.length - 1].endTime : 0,
      beatInfo,
      lines: lineResults,
    }
  }

  // ==========================================================================
  // 工具方法
  // ==========================================================================

  /**
   * 检测是否是中文字符
   */
  private isChinese(char: string): boolean {
    const code = char.charCodeAt(0)
    return code >= 0x4e00 && code <= 0x9fff
  }

  /**
   * 检测是否是数字
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9'
  }

  /**
   * 检测是否是空格
   */
  private isSpace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r'
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let adaptorInstance: RhythmAdaptor | null = null

/**
 * 获取 Rhythm Adaptor 单例实例
 */
export function getRhythmAdaptor(config?: Partial<RhythmAdaptorConfig>): RhythmAdaptor {
  if (!adaptorInstance || config) {
    adaptorInstance = new RhythmAdaptor(config)
  }
  return adaptorInstance
}

/**
 * 创建新的 Rhythm Adaptor 实例
 */
export function createRhythmAdaptor(config?: Partial<RhythmAdaptorConfig>): RhythmAdaptor {
  return new RhythmAdaptor(config)
}
