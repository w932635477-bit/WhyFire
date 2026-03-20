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
   * @param beatInfo 节拍信息 (offset 单位: 秒)
   * @param audioDuration 音频总时长 (ms)
   * @returns 带时间戳的歌词数组
   */
  mapLyricsToBeats(
    plainText: string,
    beatInfo: BeatAnalysisResult,
    audioDuration: number
  ): LyricLineWithWords[] {
    // 输入验证
    if (audioDuration <= 0) {
      console.warn('[TimestampMapper] audioDuration 必须大于 0')
      return []
    }

    if (beatInfo.beatInterval <= 0) {
      console.warn('[TimestampMapper] beatInterval 必须大于 0')
      return []
    }

    // 解析歌词行
    const lines = this.parseLines(plainText)

    if (lines.length === 0) {
      return []
    }

    // 将 offset 从秒转换为毫秒
    const offsetMs = beatInfo.offset * 1000

    // 计算每行的时长
    const lineDurations = this.calculateLineDurations(lines, beatInfo, audioDuration)

    // 为每行生成时间戳和 words 数组
    const results: LyricLineWithWords[] = []
    let currentTime = offsetMs // 从偏移量开始

    lines.forEach((line, index) => {
      const duration = lineDurations[index]
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
    const offsetMs = beatInfo.offset * 1000
    const availableDuration = totalDuration - offsetMs

    // 防止负数或零
    if (availableDuration <= 0) {
      console.warn('[TimestampMapper] 可用时长不足')
      // 每行分配相同时间（2拍）
      return lines.map(() => beatInfo.beatInterval * 2)
    }

    const charCounts = lines.map(line => line.length)
    const totalChars = charCounts.reduce((sum, count) => sum + count, 0)

    // 防止除零
    if (totalChars === 0) {
      return lines.map(() => availableDuration / lines.length)
    }

    // 计算每行时长
    const minDuration = beatInfo.beatInterval * 2
    const rawDurations = charCounts.map(charCount => {
      const proportionalDuration = (charCount / totalChars) * availableDuration
      return Math.max(minDuration, proportionalDuration)
    })

    // 检查是否超出可用时长，需要按比例缩放
    const totalRawDuration = rawDurations.reduce((sum, d) => sum + d, 0)
    if (totalRawDuration > availableDuration) {
      const scale = availableDuration / totalRawDuration
      return rawDurations.map(d => d * scale)
    }

    return rawDurations
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
