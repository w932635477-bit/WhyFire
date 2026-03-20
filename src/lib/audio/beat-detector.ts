// src/lib/audio/beat-detector.ts

import { analyze, guess } from 'web-audio-beat-detector'
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
   * @param audioBuffer 音频数据 (ArrayBuffer)
   * @returns 节拍分析结果
   */
  async analyze(audioBuffer: ArrayBuffer): Promise<BeatAnalysisResult> {
    try {
      if (this.config.debug) {
        console.log('[BeatDetector] 开始分析音频...')
      }

      // 解码音频数据
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      try {
        const decodedBuffer = await audioContext.decodeAudioData(audioBuffer)

        // 使用 guess 获取 bpm 和 offset（analyze 只返回 tempo 数值）
        const { bpm: rawBpm, offset } = await guess(decodedBuffer)

        // 将 BPM 限制在合理范围内
        const bpm = this.clampBpm(rawBpm)
        const beatInterval = 60000 / bpm // 每拍的时长 (ms)

        // 计算置信度（基于 BPM 的合理性）
        const confidence = this.calculateConfidence(bpm)

        if (this.config.debug) {
          console.log(`[BeatDetector] 分析完成: BPM=${bpm}, offset=${offset}s, confidence=${confidence}`)
        }

        return {
          bpm,
          offset, // 保持秒单位
          beatInterval,
          confidence,
        }
      } finally {
        // 确保 AudioContext 始终被关闭
        await audioContext.close()
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
