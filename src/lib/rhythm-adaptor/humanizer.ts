/**
 * 人性化处理器
 * 添加随机微偏移，避免机械感
 */

import type { HumanizeOptions, BeatAlignment } from './types'

/**
 * 人性化处理器
 * 为 Rap 添加自然感
 */
export class Humanizer {
  private seed: number | null = null

  /**
   * 设置随机种子（用于可重复结果）
   */
  setSeed(seed: number): void {
    this.seed = seed
  }

  /**
   * 生成伪随机数
   */
  private random(): number {
    if (this.seed === null) {
      return Math.random()
    }

    // 简单的伪随机数生成
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff
    return this.seed / 0x7fffffff
  }

  /**
   * 生成正态分布随机数
   */
  private gaussianRandom(): number {
    const u1 = this.random()
    const u2 = this.random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  /**
   * 对齐结果添加人性化偏移
   */
  humanize(alignments: BeatAlignment[], options: HumanizeOptions): BeatAlignment[] {
    const { timeRange, volumeRange = 0, pitchRange = 0 } = options

    return alignments.map((alignment, index) => {
      // 时间偏移
      const timeOffset = this.gaussianRandom() * (timeRange / 3)

      // 确保不会重叠
      const maxOffset = Math.min(
        timeRange,
        index > 0 ? alignment.targetStartTime - alignments[index - 1].targetEndTime : timeRange
      )
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, timeOffset))

      return {
        ...alignment,
        humanizeOffset: clampedOffset,
        targetStartTime: alignment.targetStartTime + clampedOffset,
        targetEndTime: alignment.targetEndTime + clampedOffset,
      }
    })
  }

  /**
   * 为音节添加动态变化
   * 模拟真实演唱的音量和音高变化
   */
  addDynamics(
    alignments: BeatAlignment[],
    options: {
      volumeRange?: number
      pitchRange?: number
      accentBeats?: number[] // 需要强调的拍号
    }
  ): Array<BeatAlignment & { volume: number; pitchShift: number }> {
    const { volumeRange = 0.2, pitchRange = 1, accentBeats = [] } = options

    return alignments.map(alignment => {
      // 判断是否在重音拍上
      const isAccent = accentBeats.includes(alignment.beatIndex)

      // 音量变化
      let volume = 1.0
      if (!isAccent) {
        volume = 1.0 - this.random() * volumeRange
      } else {
        volume = 1.0 + this.random() * volumeRange * 0.5 // 重音稍微加强
      }

      // 音高变化（半音）
      const pitchShift = this.gaussianRandom() * (pitchRange / 2)

      return {
        ...alignment,
        volume,
        pitchShift,
      }
    })
  }

  /**
   * 添加自然的呼吸感
   * 在乐句之间添加微小的停顿
   */
  addBreathing(
    alignments: BeatAlignment[],
    phraseBreaks: number[] // 乐句分隔点（音节索引）
  ): BeatAlignment[] {
    const breathDuration = 50 // 呼吸间隙 50ms
    let accumulatedOffset = 0

    return alignments.map((alignment, index) => {
      // 检查是否是乐句开始
      const isPhraseStart = phraseBreaks.includes(index)

      if (isPhraseStart && index > 0) {
        accumulatedOffset += breathDuration
      }

      return {
        ...alignment,
        targetStartTime: alignment.targetStartTime + accumulatedOffset,
        targetEndTime: alignment.targetEndTime + accumulatedOffset,
      }
    })
  }

  /**
   * 自动检测乐句分隔点
   * 基于文本内容和节拍位置
   */
  detectPhraseBreaks(
    alignments: BeatAlignment[],
    syllables: string[]
  ): number[] {
    const breaks: number[] = [0] // 第一个音节总是乐句开始

    // 标点符号后的位置
    const punctuationMarks = ['，', '。', '！', '？', '、', ',', '.', '!', '?']

    for (let i = 1; i < syllables.length; i++) {
      const prevSyllable = syllables[i - 1]

      // 如果前一个音节是标点
      if (punctuationMarks.some(p => prevSyllable.includes(p))) {
        breaks.push(i)
        continue
      }

      // 如果是新的小节开始
      const prevAlignment = alignments[i - 1]
      const currentAlignment = alignments[i]
      if (currentAlignment.beatIndex > prevAlignment.beatIndex &&
          currentAlignment.beatPosition < 0.1) {
        breaks.push(i)
      }
    }

    return breaks
  }

  /**
   * 应用 swing 节奏
   * 将均匀的节奏变为不均匀的 swing 感
   */
  applySwing(
    alignments: BeatAlignment[],
    swingAmount: number = 0.1 // 0-1, 0 = no swing, 1 = heavy swing
  ): BeatAlignment[] {
    return alignments.map(alignment => {
      // 只对非拍点位置的音节应用 swing
      if (alignment.beatPosition > 0.3 && alignment.beatPosition < 0.7) {
        const swingOffset = alignment.beatPosition * swingAmount * 50
        return {
          ...alignment,
          humanizeOffset: (alignment.humanizeOffset || 0) + swingOffset,
          targetStartTime: alignment.targetStartTime + swingOffset,
          targetEndTime: alignment.targetEndTime + swingOffset,
        }
      }
      return alignment
    })
  }
}

// 单例实例
let humanizerInstance: Humanizer | null = null

/**
 * 获取人性化处理器实例
 */
export function getHumanizer(): Humanizer {
  if (!humanizerInstance) {
    humanizerInstance = new Humanizer()
  }
  return humanizerInstance
}
