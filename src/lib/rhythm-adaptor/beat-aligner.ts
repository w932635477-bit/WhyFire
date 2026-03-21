/**
 * 节拍对齐器
 * 根据 BPM 将音节对齐到拍子
 */

import type { Syllable, BeatAlignment, BeatAlignResult, RhythmConfig } from './types'

/**
 * 节拍对齐器
 */
export class BeatAligner {
  /**
   * 将音节对齐到节拍网格
   */
  align(syllables: Syllable[], config: RhythmConfig): BeatAlignResult {
    const {
      bpm,
      subdivision = 1,
      enableHumanization = true,
      humanizeRange = 20,
    } = config

    // 计算每拍时长（毫秒）
    const beatDuration = (60 / bpm) * 1000

    // 计算细粒度时长
    const gridDuration = beatDuration / subdivision

    // 总音节数
    const syllableCount = syllables.length

    // 计算需要的节拍数
    const beatCount = Math.ceil((syllableCount * gridDuration) / beatDuration)

    // 对齐每个音节
    const alignments: BeatAlignment[] = []
    let currentTime = 0

    for (let i = 0; i < syllables.length; i++) {
      const syllable = syllables[i]

      // 计算目标位置
      const beatIndex = Math.floor(currentTime / beatDuration)
      const beatPosition = (currentTime % beatDuration) / beatDuration

      // 计算拉伸比例
      const targetDuration = gridDuration
      const stretchRatio = targetDuration / syllable.duration

      // 人性化偏移
      let humanizeOffset = 0
      if (enableHumanization) {
        humanizeOffset = this.randomOffset(humanizeRange)
      }

      alignments.push({
        targetStartTime: currentTime + humanizeOffset,
        targetEndTime: currentTime + targetDuration + humanizeOffset,
        syllableIndex: i,
        beatIndex,
        beatPosition,
        stretchRatio,
        humanizeOffset,
      })

      currentTime += targetDuration
    }

    return {
      alignments,
      totalDuration: currentTime,
      bpm,
      beatCount,
    }
  }

  /**
   * 智能对齐（考虑重音和韵律）
   */
  smartAlign(
    syllables: Syllable[],
    config: RhythmConfig,
    accentPositions?: number[] // 重音位置（0-indexed）
  ): BeatAlignResult {
    const {
      bpm,
      enableHumanization = true,
      humanizeRange = 20,
    } = config

    const beatDuration = (60 / bpm) * 1000

    // 如果没有指定重音位置，尝试自动检测
    const accents = accentPositions || this.detectAccents(syllables)

    // 对齐逻辑
    const alignments: BeatAlignment[] = []
    let currentTime = 0

    for (let i = 0; i < syllables.length; i++) {
      const syllable = syllables[i]
      const isAccented = accents.includes(i)

      // 重音音节对齐到拍点
      let targetDuration: number
      if (isAccented) {
        // 重音音节放在拍点
        targetDuration = beatDuration
        // 四舍五入到最近的拍点
        currentTime = Math.round(currentTime / beatDuration) * beatDuration
      } else {
        // 非重音音节均匀分布
        targetDuration = beatDuration / 2
      }

      const stretchRatio = targetDuration / syllable.duration
      const beatIndex = Math.floor(currentTime / beatDuration)
      const beatPosition = (currentTime % beatDuration) / beatDuration

      let humanizeOffset = 0
      if (enableHumanization) {
        // 重音音节偏移较小
        const range = isAccented ? humanizeRange / 2 : humanizeRange
        humanizeOffset = this.randomOffset(range)
      }

      alignments.push({
        targetStartTime: currentTime + humanizeOffset,
        targetEndTime: currentTime + targetDuration + humanizeOffset,
        syllableIndex: i,
        beatIndex,
        beatPosition,
        stretchRatio,
        humanizeOffset,
      })

      currentTime += targetDuration
    }

    return {
      alignments,
      totalDuration: currentTime,
      bpm,
      beatCount: Math.ceil(currentTime / beatDuration),
    }
  }

  /**
   * 检测重音位置
   * 基于能量和音高变化
   */
  private detectAccents(syllables: Syllable[]): number[] {
    const accents: number[] = []

    for (let i = 0; i < syllables.length; i++) {
      const syllable = syllables[i]

      // 基于能量检测
      if (syllable.energy && syllable.energy > 0.7) {
        accents.push(i)
        continue
      }

      // 每隔固定间隔添加重音（简化方案）
      // 实际应该基于韵律分析
      if (i % 4 === 0) {
        accents.push(i)
      }
    }

    return accents
  }

  /**
   * 生成随机偏移
   */
  private randomOffset(range: number): number {
    // 使用正态分布，范围在 [-range, range]
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return z * (range / 3) // 3σ 覆盖 99.7%
  }

  /**
   * 计算最佳 BPM
   * 基于音节密度和能量分布
   */
  suggestBpm(syllables: Syllable[], totalDuration: number): number {
    // 计算音节密度（音节/秒）
    const density = syllables.length / (totalDuration / 1000)

    // 根据密度推荐 BPM
    // 假设每拍 1-2 个音节
    const suggestedBpm = Math.round(density * 30)

    // 限制在合理范围
    return Math.max(60, Math.min(180, suggestedBpm))
  }
}

// 单例实例
let alignerInstance: BeatAligner | null = null

/**
 * 获取节拍对齐器实例
 */
export function getBeatAligner(): BeatAligner {
  if (!alignerInstance) {
    alignerInstance = new BeatAligner()
  }
  return alignerInstance
}
