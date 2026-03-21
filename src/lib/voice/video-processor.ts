/**
 * 视频处理器
 * 处理上传的视频文件，提取音轨，使用 Demucs 分离人声
 *
 * SECURITY: 使用 safeExec 替代 execSync 防止命令注入
 */

import path from 'path'
import fs from 'fs/promises'
import { safeExec, safeFfprobe, validatePath } from '../utils/safe-exec'
import type { VideoProcessResult, AudioQualityResult } from './types'

/**
 * 视频处理器配置
 */
interface VideoProcessorConfig {
  tempDir: string
  pythonPath: string
  timeout: number
}

/**
 * 视频处理器
 * 流程：提取音轨 -> 人声分离 -> 质量检测
 */
export class VideoProcessor {
  private config: VideoProcessorConfig

  constructor(config?: Partial<VideoProcessorConfig>) {
    this.config = {
      tempDir: config?.tempDir || process.env.VIDEO_TEMP_DIR || '/tmp/dialect-rap/video',
      pythonPath: config?.pythonPath || process.env.PYTHON_PATH || 'python3',
      timeout: config?.timeout || 300000, // 5分钟
    }
  }

  /**
   * 处理上传的视频文件
   * 流程：提取音轨 → 人声分离 → 质量检测
   */
  async process(videoPath: string): Promise<VideoProcessResult> {
    // 安全验证
    if (!validatePath(videoPath)) {
      throw new Error('Invalid video path')
    }

    const taskId = Date.now().toString()

    // 确保临时目录存在
    await fs.mkdir(this.config.tempDir, { recursive: true })

    // Step 1: 提取音轨
    console.log('[VideoProcessor] Extracting audio track...')
    const audioTrackPath = await this.extractAudio(videoPath, taskId)

    // Step 2: 人声分离（使用 Demucs）
    console.log('[VideoProcessor] Separating vocals...')
    const vocalsPath = await this.separateVocals(audioTrackPath, taskId)

    // Step 3: 质量检测
    console.log('[VideoProcessor] Validating audio quality...')
    const quality = await this.validateQuality(vocalsPath)

    const issues: string[] = []

    if (quality.score < 0.5) {
      issues.push('音频质量不足，请确保视频中无背景音乐或噪音')
    }

    if (quality.duration < 60) {
      issues.push('视频时长不足，请上传至少1分钟的视频')
    }

    return {
      audioPath: vocalsPath,
      duration: quality.duration,
      quality: quality.score,
      issues,
    }
  }

  /**
   * 从视频中提取音轨
   * SECURITY: 使用 spawn 安全执行
   */
  private async extractAudio(videoPath: string, taskId: string): Promise<string> {
    const outputPath = path.join(this.config.tempDir, `${taskId}_audio.wav`)

    try {
      const result = await safeExec('ffmpeg', [
        '-y',
        '-i', videoPath,
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '44100',
        '-ac', '1',
        outputPath,
      ], {
        timeout: 60000,
        throwOnError: true,
      })

      if (!result.success) {
        throw new Error(result.stderr)
      }
    } catch (error) {
      throw new Error(`Failed to extract audio from video: ${error}`)
    }

    // 验证文件是否存在
    await fs.access(outputPath)
    return outputPath
  }

  /**
   * 人声分离
   * 使用 Demucs（效果更好）或 Spleeter
   * SECURITY: 使用 spawn 安全执行
   */
  private async separateVocals(audioPath: string, taskId: string): Promise<string> {
    const outputDir = path.join(this.config.tempDir, taskId)

    try {
      // 使用 Demucs 进行人声分离
      // SECURITY: 参数作为数组传递，不通过 shell 解释
      const result = await safeExec(this.config.pythonPath, [
        '-m', 'demucs',
        '--two-stems=vocals',
        '-o', outputDir,
        audioPath,
      ], {
        timeout: this.config.timeout,
      })

      if (!result.success) {
        throw new Error(result.stderr)
      }
    } catch (error) {
      // 如果 Demucs 失败，尝试使用备用方案
      console.warn('[VideoProcessor] Demucs failed, trying fallback...')
      return await this.separateVocalsFallback(audioPath, taskId)
    }

    // Demucs 输出路径
    const vocalsPath = path.join(
      outputDir,
      'htdemucs',
      path.basename(audioPath, '.wav'),
      'vocals.wav'
    )

    // 检查文件是否存在
    try {
      await fs.access(vocalsPath)
      return vocalsPath
    } catch {
      throw new Error('Vocals file not found after separation')
    }
  }

  /**
   * 人声分离备用方案
   * 使用 ffmpeg 的 pan 滤镜简单提取中声道（效果较差，但作为备用）
   * SECURITY: 使用 spawn 安全执行
   */
  private async separateVocalsFallback(audioPath: string, taskId: string): Promise<string> {
    const outputPath = path.join(this.config.tempDir, `${taskId}_vocals_fallback.wav`)

    const result = await safeExec('ffmpeg', [
      '-y',
      '-i', audioPath,
      '-af', 'pan=mono|c0=0.5*c0+0.5*c1',
      outputPath,
    ], {
      timeout: 60000,
      throwOnError: true,
    })

    if (!result.success) {
      throw new Error(`Fallback separation failed: ${result.stderr}`)
    }

    await fs.access(outputPath)
    return outputPath
  }

  /**
   * 音频质量检测
   * SECURITY: 使用 safeFfprobe 替代 execSync
   */
  async validateQuality(audioPath: string): Promise<AudioQualityResult> {
    const issues: string[] = []
    let score = 1.0
    let duration = 0
    let snr: number | undefined
    let volumeLevel: number | undefined
    let isSilent = false

    try {
      // SECURITY: 使用安全的 ffprobe
      const probeResult = await safeFfprobe(audioPath)

      if (!probeResult.success) {
        throw new Error(probeResult.stderr)
      }

      const info = JSON.parse(probeResult.stdout)
      duration = parseFloat(info.format?.duration) || 0

      // 检查时长
      if (duration < 30) {
        issues.push('音频时长不足30秒')
        score *= 0.5
      } else if (duration < 60) {
        issues.push('音频时长建议至少1分钟')
        score *= 0.8
      }

      // 检查音量 - 使用安全的 ffmpeg 执行
      const volumeResult = await safeExec('ffmpeg', [
        '-i', audioPath,
        '-af', 'volumedetect',
        '-f', 'null',
        '-',
      ], {
        timeout: 30000,
      })

      const volumeMatch = volumeResult.stderr.match(/mean_volume: ([-\d.]+)/)
      if (volumeMatch) {
        volumeLevel = parseFloat(volumeMatch[1])
        // mean_volume 是负数，越接近 0 越响
        if (volumeLevel < -40) {
          issues.push('音量过低，请提高录音音量')
          score *= 0.7
        }
        if (volumeLevel < -60) {
          isSilent = true
          issues.push('音频可能是静音')
          score *= 0.3
        }
      }

      // 估算信噪比（简化版）
      snr = volumeLevel ? Math.max(0, 60 + volumeLevel) : undefined

    } catch (error) {
      console.warn('[VideoProcessor] Quality detection failed:', error)
      issues.push('无法检测音频质量')
      score *= 0.8
    }

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
   * 清理临时文件
   */
  async cleanup(taskId: string): Promise<void> {
    const taskDir = path.join(this.config.tempDir, taskId)
    try {
      await fs.rm(taskDir, { recursive: true, force: true })
    } catch (error) {
      console.warn('[VideoProcessor] Cleanup failed:', error)
    }
  }
}

// 单例实例
let processorInstance: VideoProcessor | null = null

/**
 * 获取视频处理器实例
 */
export function getVideoProcessor(): VideoProcessor {
  if (!processorInstance) {
    processorInstance = new VideoProcessor()
  }
  return processorInstance
}
