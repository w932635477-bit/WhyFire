/**
 * 音频质量检测器
 * 检测上传音频的质量
 */

import { execSync } from 'child_process'
import fs from 'fs/promises'
import type { AudioQualityResult } from './types'

/**
 * 质量检测配置
 */
interface QualityCheckerConfig {
  minDuration: number      // 最小时长（秒）
  minVolume: number        // 最小音量（dB）
  minSnr: number           // 最小信噪比（dB）
}

/**
 * 音频质量检测器
 */
export class AudioQualityChecker {
  private config: QualityCheckerConfig

  constructor(config?: Partial<QualityCheckerConfig>) {
    this.config = {
      minDuration: config?.minDuration || 60,    // 至少1分钟
      minVolume: config?.minVolume || -40,       // 音量不能太低
      minSnr: config?.minSnr || 10,              // 信噪比至少 10dB
    }
  }

  /**
   * 检测音频质量
   */
  async check(audioPath: string): Promise<AudioQualityResult> {
    const issues: string[] = []
    let score = 1.0
    let duration = 0
    let snr: number | undefined
    let volumeLevel: number | undefined
    let isSilent = false

    try {
      // 获取音频基本信息
      const probeResult = execSync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${audioPath}"`,
        { encoding: 'utf-8' }
      )

      const info = JSON.parse(probeResult)
      duration = parseFloat(info.format.duration) || 0

      // 检查时长
      if (duration < this.config.minDuration) {
        issues.push(`音频时长不足，建议至少 ${this.config.minDuration} 秒`)
        score *= Math.max(0.3, duration / this.config.minDuration)
      }

      // 检测音量
      const volumeResult = await this.detectVolume(audioPath)
      volumeLevel = volumeResult.meanVolume

      if (volumeLevel < this.config.minVolume) {
        issues.push('音量过低，请提高录音音量或在安静环境录制')
        score *= Math.max(0.5, (volumeLevel + 60) / 20)
      }

      // 检测静音
      if (volumeResult.silentRatio > 0.5) {
        isSilent = true
        issues.push('音频包含大量静音段，请确保录音内容完整')
        score *= 0.5
      }

      // 估算信噪比
      snr = this.estimateSNR(volumeResult)
      if (snr < this.config.minSnr) {
        issues.push('音频信噪比过低，可能存在背景噪音')
        score *= Math.max(0.5, snr / this.config.minSnr)
      }

      // 检查采样率和声道
      const audioStream = info.streams?.find((s: any) => s.codec_type === 'audio')
      if (audioStream) {
        const sampleRate = parseInt(audioStream.sample_rate) || 0
        if (sampleRate < 16000) {
          issues.push('采样率过低，建议使用 44100Hz 或更高')
          score *= 0.8
        }
      }

    } catch (error) {
      console.warn('[AudioQualityChecker] Detection failed:', error)
      issues.push('无法检测音频质量')
      score = 0.5
    }

    // 最终评分限制在 0-1 之间
    score = Math.max(0, Math.min(1, score))

    return {
      score,
      duration,
      issues,
      snr,
      volumeLevel,
      isSilent,
    }
  }

  /**
   * 检测音量
   */
  private async detectVolume(audioPath: string): Promise<{
    meanVolume: number
    maxVolume: number
    silentRatio: number
  }> {
    try {
      // 获取音量统计
      const result = execSync(
        `ffmpeg -i "${audioPath}" -af "volumedetect" -f null /dev/null 2>&1`,
        { encoding: 'utf-8' }
      )

      // 解析 mean_volume 和 max_volume
      const meanMatch = result.match(/mean_volume: ([-\d.]+)/)
      const maxMatch = result.match(/max_volume: ([-\d.]+)/)

      const meanVolume = meanMatch ? parseFloat(meanMatch[1]) : -30
      const maxVolume = maxMatch ? parseFloat(maxMatch[1]) : -20

      // 计算静音比例（简化估算）
      // 如果 mean_volume 非常低，说明有很多静音
      const silentRatio = meanVolume < -50 ? 0.7 : (meanVolume < -40 ? 0.3 : 0.1)

      return {
        meanVolume,
        maxVolume,
        silentRatio,
      }
    } catch {
      return {
        meanVolume: -30,
        maxVolume: -20,
        silentRatio: 0,
      }
    }
  }

  /**
   * 估算信噪比
   */
  private estimateSNR(volumeResult: { meanVolume: number; maxVolume: number }): number {
    // 简化估算：使用 max 和 mean 的差值作为信噪比的近似
    // 实际项目中应该使用更专业的算法
    const dynamicRange = volumeResult.maxVolume - volumeResult.meanVolume
    // 动态范围越大，信噪比越好
    return Math.max(0, dynamicRange + 20)
  }

  /**
   * 快速检查音频是否有效
   */
  async quickCheck(audioPath: string): Promise<{ valid: boolean; message: string }> {
    try {
      // 检查文件是否存在
      await fs.access(audioPath)

      // 快速获取时长
      const result = execSync(
        `ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
        { encoding: 'utf-8' }
      )

      const duration = parseFloat(result.trim())

      if (isNaN(duration) || duration < 10) {
        return { valid: false, message: '音频时长不足' }
      }

      return { valid: true, message: '音频有效' }
    } catch (error) {
      return { valid: false, message: '无效的音频文件' }
    }
  }

  /**
   * 获取推荐的录制参数
   */
  getRecommendedSettings(): {
    minDuration: number
    sampleRate: number
    channels: number
    format: string
    tips: string[]
  } {
    return {
      minDuration: this.config.minDuration,
      sampleRate: 44100,
      channels: 1,
      format: 'wav',
      tips: [
        '请在安静环境中录制',
        '距离麦克风保持 10-20cm',
        '说话清晰，语速适中',
        '避免背景音乐或噪音',
        '建议录制 1-2 分钟',
      ],
    }
  }
}

// 单例实例
let checkerInstance: AudioQualityChecker | null = null

/**
 * 获取音频质量检测器实例
 */
export function getAudioQualityChecker(): AudioQualityChecker {
  if (!checkerInstance) {
    checkerInstance = new AudioQualityChecker()
  }
  return checkerInstance
}
