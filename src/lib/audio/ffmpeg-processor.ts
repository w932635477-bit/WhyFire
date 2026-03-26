/**
 * FFmpeg 音频处理器
 * 使用 FFmpeg 进行时间拉伸、混音等音频处理
 *
 * 功能：
 * 1. timeStretch - 时间拉伸（不改变音调）
 * 2. mixTracks - 混音合成（人声 + BGM）
 * 3. addEffects - 后处理效果（混响、压缩）
 * 4. process - 综合处理入口
 *
 * 依赖: FFmpeg 4.0+
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

const execAsync = promisify(exec)

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 混音配置
 */
export interface MixConfig {
  /** 人声音量 (0 - 2.0)，默认 1.0 */
  vocalVolume?: number
  /** BGM 音量 (0 - 2.0)，默认 0.4 */
  bgmVolume?: number
  /** 是否循环 BGM 以匹配人声时长 */
  loopBgm?: boolean
}

/**
 * 后处理效果配置
 */
export interface EffectsConfig {
  /** 混响 */
  reverb?: {
    enabled: boolean
    /** 混响量 (0 - 1.0) */
    amount?: number
  }
  /** 压缩器 */
  compressor?: {
    enabled: boolean
    /** 阈值 (dB) */
    threshold?: number
    /** 压缩比 */
    ratio?: number
  }
  /** 标准化音量 */
  normalize?: boolean
}

/**
 * 音频处理选项
 */
export interface AudioProcessOptions {
  /** 时间拉伸因子 (0.5 - 2.0)，>1 拉伸，<1 压缩 */
  timeStretchFactor?: number
  /** BGM 音频数据 */
  bgmBuffer?: Buffer
  /** 混音配置 */
  mixConfig?: MixConfig
  /** 后处理效果 */
  effects?: EffectsConfig
  /** 输出格式 */
  outputFormat?: 'mp3' | 'wav'
  /** 输出采样率 */
  sampleRate?: number
}

/**
 * 音频处理结果
 */
export interface AudioProcessResult {
  /** 处理后的音频数据 */
  audioBuffer: Buffer
  /** 原始时长 (秒) */
  originalDuration: number
  /** 处理后时长 (秒) */
  processedDuration: number
  /** 实际应用的拉伸因子 */
  appliedStretchFactor: number
  /** 输出格式 */
  format: string
}

/**
 * FFmpeg 处理器配置
 */
interface FFmpegProcessorConfig {
  /** FFmpeg 可执行文件路径 */
  ffmpegPath: string
  /** FFprobe 可执行文件路径 */
  ffprobePath: string
  /** 临时文件目录 */
  tempDir: string
  /** 处理超时 (ms) */
  timeout: number
  /** 是否输出详细日志 */
  debug: boolean
}

// ============================================================================
// FFmpeg 处理器类
// ============================================================================

/**
 * FFmpeg 音频处理器
 * 使用 FFmpeg 命令行工具进行音频处理
 */
export class FFmpegProcessor {
  private config: FFmpegProcessorConfig

  constructor(config?: Partial<FFmpegProcessorConfig>) {
    this.config = {
      ffmpegPath: config?.ffmpegPath || 'ffmpeg',
      ffprobePath: config?.ffprobePath || 'ffprobe',
      tempDir: config?.tempDir || tmpdir(),
      timeout: config?.timeout || 120000, // 2 分钟
      debug: config?.debug || false,
    }
  }

  /**
   * 检查 FFmpeg 是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync(`${this.config.ffmpegPath} -version`)
      return true
    } catch {
      return false
    }
  }

  // ==========================================================================
  // 核心功能
  // ==========================================================================

  /**
   * 时间拉伸（不改变音调）
   * 使用 FFmpeg atempo 滤镜
   *
   * @param input 输入音频数据
   * @param factor 拉伸因子 (0.5 - 2.0)
   * @returns 拉伸后的音频数据
   */
  async timeStretch(input: Buffer, factor: number): Promise<AudioProcessResult> {
    // 参数验证
    if (factor <= 0) {
      throw new Error(`timeStretch: factor must be positive, got ${factor}`)
    }

    if (factor === 1) {
      // 无需处理
      const duration = await this.getAudioDuration(input)
      return {
        audioBuffer: input,
        originalDuration: duration,
        processedDuration: duration,
        appliedStretchFactor: 1,
        format: 'mp3',
      }
    }

    // 限制拉伸范围 (atempo 限制 0.5-2.0，超过需要串联)
    const clampedFactor = Math.max(0.5, Math.min(2.0, factor))

    // 构建 atempo 滤镜链
    const atempoFilter = this.buildAtempoFilter(clampedFactor)

    if (this.config.debug) {
      console.log(`[FFmpegProcessor] timeStretch: factor=${factor}, clamped=${clampedFactor}`)
      console.log(`[FFmpegProcessor] atempo filter: ${atempoFilter}`)
    }

    // 创建临时文件
    const inputFile = join(this.config.tempDir, `input-${randomUUID()}.mp3`)
    const outputFile = join(this.config.tempDir, `output-${randomUUID()}.mp3`)

    try {
      // 写入输入文件
      await writeFile(inputFile, input)

      // 获取原始时长
      const originalDuration = await this.getAudioDuration(inputFile)

      // 执行 FFmpeg 命令
      const command = `"${this.config.ffmpegPath}" -y -i "${inputFile}" -filter:a "${atempoFilter}" -c:a libmp3lame -q:a 2 "${outputFile}"`

      if (this.config.debug) {
        console.log(`[FFmpegProcessor] Executing: ${command}`)
      }

      await execAsync(command, { timeout: this.config.timeout })

      // 读取输出文件
      const audioBuffer = await readFile(outputFile)

      // 获取处理后时长
      const processedDuration = await this.getAudioDuration(outputFile)

      return {
        audioBuffer,
        originalDuration,
        processedDuration,
        appliedStretchFactor: clampedFactor,
        format: 'mp3',
      }
    } finally {
      // 清理临时文件
      await this.cleanup([inputFile, outputFile])
    }
  }

  /**
   * 混音合成
   * 人声 + BGM 叠加，音量平衡
   *
   * @param vocal 人声音频数据
   * @param bgm BGM 音频数据
   * @param config 混音配置
   * @returns 混音后的音频数据
   */
  async mixTracks(
    vocal: Buffer,
    bgm: Buffer,
    config: MixConfig = {}
  ): Promise<AudioProcessResult> {
    const { vocalVolume = 1.0, bgmVolume = 0.4, loopBgm = true } = config

    if (this.config.debug) {
      console.log(`[FFmpegProcessor] mixTracks: vocalVolume=${vocalVolume}, bgmVolume=${bgmVolume}, loopBgm=${loopBgm}`)
    }

    // 创建临时文件
    const vocalFile = join(this.config.tempDir, `vocal-${randomUUID()}.mp3`)
    const bgmFile = join(this.config.tempDir, `bgm-${randomUUID()}.mp3`)
    const outputFile = join(this.config.tempDir, `mix-${randomUUID()}.mp3`)

    try {
      // 写入输入文件
      await writeFile(vocalFile, vocal)
      await writeFile(bgmFile, bgm)

      // 获取时长信息
      const vocalDuration = await this.getAudioDuration(vocalFile)
      const bgmDuration = await this.getAudioDuration(bgmFile)

      // 构建 amix 滤镜
      // 输入顺序: 0 = vocal, 1 = bgm
      let filterComplex: string

      if (loopBgm && bgmDuration < vocalDuration) {
        // 需要循环 BGM：使用 -stream_loop 循环 BGM 输入
        // 注意: stream_loop 放在 -i 之前
        const loopsNeeded = Math.ceil(vocalDuration / bgmDuration)

        const command = `"${this.config.ffmpegPath}" -y -i "${vocalFile}" -stream_loop ${loopsNeeded} -i "${bgmFile}" -filter_complex "[0:a]volume=${vocalVolume}[v];[1:a]volume=${bgmVolume},atrim=0:${vocalDuration.toFixed(2)}[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2" -c:a libmp3lame -q:a 2 "${outputFile}"`

        if (this.config.debug) {
          console.log(`[FFmpegProcessor] Executing: ${command}`)
        }

        await execAsync(command, { timeout: this.config.timeout })

        // 读取输出文件
        const audioBuffer = await readFile(outputFile)
        const processedDuration = await this.getAudioDuration(outputFile)

        return {
          audioBuffer,
          originalDuration: vocalDuration,
          processedDuration,
          appliedStretchFactor: 1,
          format: 'mp3',
        }
      }

      // 普通混音（无需循环）
      filterComplex = `[0:a]volume=${vocalVolume}[v];[1:a]volume=${bgmVolume}[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2`

      const command = `"${this.config.ffmpegPath}" -y -i "${vocalFile}" -i "${bgmFile}" -filter_complex "${filterComplex}" -c:a libmp3lame -q:a 2 "${outputFile}"`

      if (this.config.debug) {
        console.log(`[FFmpegProcessor] Executing: ${command}`)
      }

      await execAsync(command, { timeout: this.config.timeout })

      // 读取输出文件
      const audioBuffer = await readFile(outputFile)
      const processedDuration = await this.getAudioDuration(outputFile)

      return {
        audioBuffer,
        originalDuration: vocalDuration,
        processedDuration,
        appliedStretchFactor: 1,
        format: 'mp3',
      }
    } finally {
      // 清理临时文件
      await this.cleanup([vocalFile, bgmFile, outputFile])
    }
  }

  /**
   * 添加后处理效果
   *
   * @param input 输入音频数据
   * @param effects 效果配置
   * @returns 处理后的音频数据
   */
  async addEffects(input: Buffer, effects: EffectsConfig): Promise<AudioProcessResult> {
    const filters: string[] = []

    // 混响效果
    if (effects.reverb?.enabled) {
      const amount = effects.reverb.amount ?? 0.3
      // 使用 aecho 模拟混响
      filters.push(`aecho=0.8:0.9:${1000 * amount}:${amount}`)
    }

    // 压缩器
    if (effects.compressor?.enabled) {
      const threshold = effects.compressor.threshold ?? -20
      const ratio = effects.compressor.ratio ?? 4
      filters.push(`acompressor=threshold=${threshold}dB:ratio=${ratio}`)
    }

    // 标准化
    if (effects.normalize) {
      filters.push('loudnorm')
    }

    if (filters.length === 0) {
      // 无需处理
      const duration = await this.getAudioDuration(input)
      return {
        audioBuffer: input,
        originalDuration: duration,
        processedDuration: duration,
        appliedStretchFactor: 1,
        format: 'mp3',
      }
    }

    if (this.config.debug) {
      console.log(`[FFmpegProcessor] addEffects: filters=${filters.join(',')}`)
    }

    // 创建临时文件
    const inputFile = join(this.config.tempDir, `input-${randomUUID()}.mp3`)
    const outputFile = join(this.config.tempDir, `output-${randomUUID()}.mp3`)

    try {
      await writeFile(inputFile, input)

      const originalDuration = await this.getAudioDuration(inputFile)

      const command = `"${this.config.ffmpegPath}" -y -i "${inputFile}" -filter:a "${filters.join(',')}" -c:a libmp3lame -q:a 2 "${outputFile}"`

      if (this.config.debug) {
        console.log(`[FFmpegProcessor] Executing: ${command}`)
      }

      await execAsync(command, { timeout: this.config.timeout })

      const audioBuffer = await readFile(outputFile)
      const processedDuration = await this.getAudioDuration(outputFile)

      return {
        audioBuffer,
        originalDuration,
        processedDuration,
        appliedStretchFactor: 1,
        format: 'mp3',
      }
    } finally {
      await this.cleanup([inputFile, outputFile])
    }
  }

  /**
   * 综合处理入口
   *
   * @param input 输入音频数据
   * @param options 处理选项
   * @returns 处理结果
   */
  async process(input: Buffer, options: AudioProcessOptions = {}): Promise<AudioProcessResult> {
    const {
      timeStretchFactor,
      bgmBuffer,
      mixConfig,
      effects,
      outputFormat = 'mp3',
    } = options

    let currentBuffer = input
    let result: AudioProcessResult = {
      audioBuffer: input,
      originalDuration: 0,
      processedDuration: 0,
      appliedStretchFactor: 1,
      format: outputFormat,
    }

    // Step 1: 时间拉伸
    if (timeStretchFactor && timeStretchFactor !== 1) {
      result = await this.timeStretch(currentBuffer, timeStretchFactor)
      currentBuffer = result.audioBuffer

      if (this.config.debug) {
        console.log(`[FFmpegProcessor] After timeStretch: duration=${result.processedDuration}s`)
      }
    } else {
      result.originalDuration = await this.getAudioDuration(currentBuffer)
      result.processedDuration = result.originalDuration
    }

    // Step 2: 混音
    if (bgmBuffer) {
      const mixResult = await this.mixTracks(currentBuffer, bgmBuffer, mixConfig)
      currentBuffer = mixResult.audioBuffer
      result.audioBuffer = currentBuffer
      result.processedDuration = mixResult.processedDuration

      if (this.config.debug) {
        console.log(`[FFmpegProcessor] After mixTracks: duration=${result.processedDuration}s`)
      }
    }

    // Step 3: 后处理效果
    if (effects && (effects.reverb?.enabled || effects.compressor?.enabled || effects.normalize)) {
      const effectsResult = await this.addEffects(currentBuffer, effects)
      currentBuffer = effectsResult.audioBuffer
      result.audioBuffer = currentBuffer
      result.processedDuration = effectsResult.processedDuration

      if (this.config.debug) {
        console.log(`[FFmpegProcessor] After addEffects: duration=${result.processedDuration}s`)
      }
    }

    return result
  }

  // ==========================================================================
  // 工具方法
  // ==========================================================================

  /**
   * 获取音频时长（秒）
   */
  async getAudioDuration(input: Buffer | string): Promise<number> {
    let inputFile: string
    let shouldCleanup = false

    if (Buffer.isBuffer(input)) {
      inputFile = join(this.config.tempDir, `duration-${randomUUID()}.mp3`)
      await writeFile(inputFile, input)
      shouldCleanup = true
    } else {
      inputFile = input
    }

    try {
      const command = `"${this.config.ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputFile}"`

      const { stdout } = await execAsync(command, { timeout: 10000 })
      const duration = parseFloat(stdout.trim())

      if (isNaN(duration)) {
        throw new Error('Failed to parse audio duration')
      }

      return duration
    } finally {
      if (shouldCleanup) {
        await this.cleanup([inputFile])
      }
    }
  }

  /**
   * 检查 FFmpeg 是否可用
   */
  async checkAvailability(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const { stdout } = await execAsync(`"${this.config.ffmpegPath}" -version`, { timeout: 5000 })
      const versionMatch = stdout.match(/ffmpeg version (\S+)/)
      return {
        available: true,
        version: versionMatch ? versionMatch[1] : 'unknown',
      }
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 构建 atempo 滤镜链
   * atempo 限制 0.5-2.0，超过需要串联多个滤镜
   *
   * 注意: atempo 因子含义:
   * - factor > 1: 音频变短（加速）
   * - factor < 1: 音频变长（减速）
   *
   * 而 stretchFactor 含义:
   * - stretchFactor > 1: 时长增加
   * - stretchFactor < 1: 时长减少
   *
   * 所以需要取倒数
   */
  private buildAtempoFilter(stretchFactor: number): string {
    // atempo 因子是 stretchFactor 的倒数
    const factor = 1 / stretchFactor

    const filters: string[] = []
    let remaining = factor

    // atempo 限制 0.5-2.0
    while (remaining > 2.0) {
      filters.push('atempo=2.0')
      remaining /= 2.0
    }
    while (remaining < 0.5) {
      filters.push('atempo=0.5')
      remaining /= 0.5
    }
    if (remaining !== 1) {
      filters.push(`atempo=${remaining.toFixed(4)}`)
    }

    // 如果没有滤镜（factor=1），返回一个空滤镜
    if (filters.length === 0) {
      return 'anull'
    }

    return filters.join(',')
  }

  /**
   * 清理临时文件
   */
  private async cleanup(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await unlink(file)
      } catch {
        // 忽略删除错误
      }
    }
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let processorInstance: FFmpegProcessor | null = null

/**
 * 获取 FFmpeg 处理器单例
 */
export function getFFmpegProcessor(config?: Partial<FFmpegProcessorConfig>): FFmpegProcessor {
  if (!processorInstance || config) {
    processorInstance = new FFmpegProcessor(config)
  }
  return processorInstance
}

/**
 * 创建新的 FFmpeg 处理器实例
 */
export function createFFmpegProcessor(config?: Partial<FFmpegProcessorConfig>): FFmpegProcessor {
  return new FFmpegProcessor(config)
}
