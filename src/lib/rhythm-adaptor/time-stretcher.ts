/**
 * 时间拉伸器
 * 高质量时间拉伸，保持音质
 *
 * SECURITY: 使用 safeExec 替代 execSync 防止命令注入
 */

import path from 'path'
import fs from 'fs/promises'
import { safeExec, validatePath } from '../utils/safe-exec'
import type { TimeStretchOptions } from './types'

/**
 * 时间拉伸器配置
 */
interface TimeStretcherConfig {
  tempDir: string
  timeout: number
}

/**
 * 时间拉伸器
 * 使用 rubberband 或 ffmpeg 进行时间拉伸
 */
export class TimeStretcher {
  private config: TimeStretcherConfig

  constructor(config?: Partial<TimeStretcherConfig>) {
    this.config = {
      tempDir: config?.tempDir || process.env.STRETCH_TEMP_DIR || '/tmp/dialect-rap/stretch',
      timeout: config?.timeout || 60000,
    }
  }

  /**
   * 拉伸音频
   */
  async stretch(options: TimeStretchOptions): Promise<string> {
    const {
      inputPath,
      outputPath,
      ratio,
      mode = 'high_quality',
      preservePitch = true,
    } = options

    // 安全验证
    if (!validatePath(inputPath)) {
      throw new Error('Invalid input path')
    }
    if (!validatePath(outputPath)) {
      throw new Error('Invalid output path')
    }

    // 确保输出目录存在
    await fs.mkdir(path.dirname(outputPath), { recursive: true })

    if (mode === 'high_quality') {
      return this.stretchWithRubberband(inputPath, outputPath, ratio, preservePitch)
    } else {
      return this.stretchWithFfmpeg(inputPath, outputPath, ratio, preservePitch)
    }
  }

  /**
   * 使用 Rubberband 进行高质量拉伸
   * 需要安装 rubberband-cli
   * SECURITY: 使用 spawn 安全执行
   */
  private async stretchWithRubberband(
    inputPath: string,
    outputPath: string,
    ratio: number,
    preservePitch: boolean
  ): Promise<string> {
    try {
      // rubberband 的 --time 参数指定拉伸后的时长比例
      const timeRatio = 1 / ratio // 反转：ratio > 1 表示加速，< 1 表示减速

      // SECURITY: 使用数组参数，不通过 shell 解释
      const args = [
        '--time', timeRatio.toString(),
        '--fine',  // 使用高质量模式
        '--formant', // 保持共振峰
        '--channels', '1', // 单声道
      ]

      if (preservePitch) {
        args.push('--pitch-hunting')
      }

      args.push(inputPath, outputPath)

      const result = await safeExec('rubberband', args, {
        timeout: this.config.timeout,
      })

      if (!result.success) {
        throw new Error(result.stderr)
      }

      return outputPath
    } catch (error) {
      console.warn('[TimeStretcher] Rubberband failed, falling back to ffmpeg')
      return this.stretchWithFfmpeg(inputPath, outputPath, ratio, preservePitch)
    }
  }

  /**
   * 使用 ffmpeg atempo 滤镜进行拉伸
   * 作为备用方案，质量较低但更通用
   * SECURITY: 使用 spawn 安全执行
   */
  private async stretchWithFfmpeg(
    inputPath: string,
    outputPath: string,
    ratio: number,
    preservePitch: boolean
  ): Promise<string> {
    // ffmpeg atempo 只支持 0.5 - 2.0 的范围
    // 如果超出范围，需要多次应用
    const atempoFilters = this.calculateAtempoFilters(ratio)
    const filterString = atempoFilters.map(r => `atempo=${r}`).join(',')

    // SECURITY: 使用数组参数
    const args = ['-y', '-i', inputPath]

    if (!preservePitch) {
      args.push('-af', 'asetrate=44100')
    }

    args.push('-af', filterString, outputPath)

    const result = await safeExec('ffmpeg', args, {
      timeout: this.config.timeout,
    })

    if (!result.success) {
      throw new Error(`FFmpeg stretch failed: ${result.stderr}`)
    }

    return outputPath
  }

  /**
   * 计算 atempo 滤镜参数
   * ffmpeg atempo 只支持 0.5 - 2.0
   */
  private calculateAtempoFilters(ratio: number): number[] {
    const filters: number[] = []
    let remaining = ratio

    while (remaining > 2.0) {
      filters.push(2.0)
      remaining /= 2.0
    }
    while (remaining < 0.5) {
      filters.push(0.5)
      remaining /= 0.5
    }
    filters.push(Math.round(remaining * 100) / 100)

    return filters
  }

  /**
   * 批量拉伸
   */
  async stretchBatch(
    segments: Array<{
      inputPath: string
      outputPath: string
      ratio: number
    }>
  ): Promise<string[]> {
    const results: string[] = []

    for (const segment of segments) {
      const result = await this.stretch({
        inputPath: segment.inputPath,
        outputPath: segment.outputPath,
        ratio: segment.ratio,
      })
      results.push(result)
    }

    return results
  }

  /**
   * 拉伸并拼接
   * 将多个音频片段拉伸后按顺序拼接
   * SECURITY: 使用 spawn 安全执行
   */
  async stretchAndConcat(
    segments: Array<{
      inputPath: string
      ratio: number
      startTime: number
    }>,
    outputPath: string,
    totalDuration: number
  ): Promise<string> {
    const tempDir = path.join(this.config.tempDir, Date.now().toString())
    await fs.mkdir(tempDir, { recursive: true })

    // 1. 拉伸每个片段
    const stretchedFiles: string[] = []
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const stretchedPath = path.join(tempDir, `segment_${i}.wav`)
      await this.stretch({
        inputPath: segment.inputPath,
        outputPath: stretchedPath,
        ratio: segment.ratio,
      })
      stretchedFiles.push(stretchedPath)
    }

    // 2. 创建静音基底
    const silentBase = path.join(tempDir, 'silent_base.wav')
    await safeExec('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', 'anullsrc=r=44100:cl=mono',
      '-t', (totalDuration / 1000).toString(),
      silentBase,
    ])

    // 3. 将每个片段放到正确位置
    // 这里简化处理，实际项目中需要更复杂的 filter_complex
    const inputArgs: string[] = ['-i', silentBase]
    stretchedFiles.forEach(f => {
      inputArgs.push('-i', f)
    })

    const filterParts = stretchedFiles.map((_, i) => {
      const startTime = segments[i].startTime / 1000
      return `[${i + 1}:a]adelay=${Math.round(startTime * 1000)}|${Math.round(startTime * 1000)}[a${i}]`
    })

    const mixInputs = ['[0:a]', ...stretchedFiles.map((_, i) => `[a${i}]`)].join('')
    const mixFilter = `${mixInputs}amix=inputs=${stretchedFiles.length + 1}:duration=first[out]`

    const args = [
      '-y',
      ...inputArgs,
      '-filter_complex', `${filterParts.join(';')};${mixFilter}`,
      '-map', '[out]',
      outputPath,
    ]

    await safeExec('ffmpeg', args, {
      timeout: this.config.timeout,
    })

    // 4. 清理临时文件
    await fs.rm(tempDir, { recursive: true, force: true })

    return outputPath
  }
}

// 单例实例
let stretcherInstance: TimeStretcher | null = null

/**
 * 获取时间拉伸器实例
 */
export function getTimeStretcher(): TimeStretcher {
  if (!stretcherInstance) {
    stretcherInstance = new TimeStretcher()
  }
  return stretcherInstance
}
