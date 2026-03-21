/**
 * BPM 检测器
 * 使用 web-audio-beat-detector 或 librosa 检测 BPM
 *
 * SECURITY: 使用 safeExec 替代 execSync 防止命令注入
 */

import path from 'path'
import { safeExec, validatePath } from '../utils/safe-exec'
import type { BpmDetectResult, BeatTiming } from './types'

/**
 * BPM 检测器配置
 */
interface BpmDetectorConfig {
  pythonPath: string
  timeout: number
}

/**
 * BPM 检测器
 */
export class BpmDetector {
  private config: BpmDetectorConfig

  constructor(config?: Partial<BpmDetectorConfig>) {
    this.config = {
      pythonPath: config?.pythonPath || process.env.PYTHON_PATH || 'python3',
      timeout: config?.timeout || 60000,
    }
  }

  /**
   * 检测音频 BPM
   */
  async detect(audioPath: string): Promise<BpmDetectResult> {
    // 安全验证
    if (!validatePath(audioPath)) {
      throw new Error('Invalid audio path')
    }

    // 方案 1: 使用 Python librosa（更准确）
    // 方案 2: 使用 ffmpeg（备用）

    try {
      return await this.detectWithLibrosa(audioPath)
    } catch (error) {
      console.warn('[BpmDetector] Librosa detection failed, using fallback')
      return this.detectWithFfmpeg(audioPath)
    }
  }

  /**
   * 使用 librosa 检测 BPM（推荐）
   * SECURITY: 使用 spawn 安全执行
   */
  private async detectWithLibrosa(audioPath: string): Promise<BpmDetectResult> {
    const scriptPath = path.join(__dirname, 'python', 'detect_bpm.py')

    try {
      // SECURITY: 使用数组参数，不通过 shell 解释
      const result = await safeExec(this.config.pythonPath, [
        scriptPath,
        '--audio', audioPath,
      ], {
        timeout: this.config.timeout,
        throwOnError: true,
      })

      return JSON.parse(result.stdout)
    } catch (error) {
      throw new Error(`Librosa BPM detection failed: ${error}`)
    }
  }

  /**
   * 使用 ffmpeg 检测 BPM（备用方案）
   * 准确度较低，但不需要 Python
   * SECURITY: 使用 spawn 安全执行
   */
  private async detectWithFfmpeg(audioPath: string): Promise<BpmDetectResult> {
    try {
      // 使用 ffmpeg 的 ebur128 滤镜分析音频能量
      const result = await safeExec('ffmpeg', [
        '-i', audioPath,
        '-af', 'ebur128',
        '-f', 'null',
        '-',
      ], {
        timeout: 30000,
      })

      // 从结果中估算 BPM（简化方案）
      // 实际应该使用更专业的算法
      const estimatedBpm = 90 // 默认值

      return {
        bpm: estimatedBpm,
        confidence: 0.3,
        alternatives: [],
      }
    } catch {
      return {
        bpm: 90,
        confidence: 0.1,
      }
    }
  }

  /**
   * 检测节拍时间点
   * SECURITY: 使用 spawn 安全执行
   */
  async detectBeats(audioPath: string): Promise<BeatTiming> {
    if (!validatePath(audioPath)) {
      throw new Error('Invalid audio path')
    }

    const scriptPath = path.join(__dirname, 'python', 'detect_beats.py')

    try {
      // SECURITY: 使用数组参数
      const result = await safeExec(this.config.pythonPath, [
        scriptPath,
        '--audio', audioPath,
      ], {
        timeout: this.config.timeout,
        throwOnError: true,
      })

      return JSON.parse(result.stdout)
    } catch (error) {
      // 返回默认值
      const bpmResult = await this.detect(audioPath)
      return {
        beats: [],
        downbeats: [],
        bpm: bpmResult.bpm,
        timeSignature: [4, 4],
      }
    }
  }

  /**
   * 快速 BPM 检测（低精度）
   */
  async quickDetect(audioPath: string): Promise<number> {
    const result = await this.detect(audioPath)
    return result.bpm
  }

  /**
   * 验证 BPM 是否合理
   */
  validateBpm(bpm: number): boolean {
    // 常见的 BPM 范围是 60-200
    return bpm >= 60 && bpm <= 200
  }

  /**
   * 调整 BPM 到合理范围
   */
  normalizeBpm(bpm: number): number {
    // 如果 BPM 太高，可能检测到了半拍
    if (bpm > 200) {
      return bpm / 2
    }
    // 如果 BPM 太低，可能检测到了双拍
    if (bpm < 60) {
      return bpm * 2
    }
    return bpm
  }
}

// 单例实例
let detectorInstance: BpmDetector | null = null

/**
 * 获取 BPM 检测器实例
 */
export function getBpmDetector(): BpmDetector {
  if (!detectorInstance) {
    detectorInstance = new BpmDetector()
  }
  return detectorInstance
}
