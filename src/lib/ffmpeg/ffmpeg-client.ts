/**
 * FFmpeg.wasm 客户端封装
 * 提供视频处理能力的浏览器端实现
 *
 * 注意：FFmpeg.wasm 0.12.x 使用动态 import() 加载核心
 * 在 webpack/Next.js 环境下需要特殊处理
 */

import type {
  FFmpegLoadOptions,
  FFmpegLogMessage,
  FFmpegProgress,
  SharedArrayBufferSupport,
  VideoSynthesisOptions,
  VideoResolution,
  WriteFileOptions,
} from './types'
import { VIDEO_RESOLUTIONS } from './types'

// 动态导入 FFmpeg 和 fetchFile（避免 SSR 问题）
let FFmpegClass: any = null
let fetchFileUtil: any = null

/**
 * 动态加载 FFmpeg 模块
 */
async function loadFFmpegModule() {
  if (typeof window === 'undefined') {
    throw new Error('FFmpeg 只能在浏览器环境中使用')
  }

  if (!FFmpegClass) {
    const ffmpegModule = await import('@ffmpeg/ffmpeg')
    FFmpegClass = ffmpegModule.FFmpeg

    const utilModule = await import('@ffmpeg/util')
    fetchFileUtil = utilModule.fetchFile
  }

  return { FFmpeg: FFmpegClass, fetchFile: fetchFileUtil }
}

/**
 * FFmpeg.wasm 版本信息
 */
const FFMPEG_CORE_VERSION = '0.12.10'
const FFMPEG_CORE_CDN_URL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`

/**
 * FFmpeg 客户端类
 * 封装 FFmpeg.wasm 的加载、文件操作和命令执行
 */
export class FFmpegClient {
  private ffmpeg: any = null
  private loaded = false
  private loading = false
  private multiThread = false
  private progressCallback: ((progress: FFmpegProgress) => void) | null = null

  /**
   * 检测 SharedArrayBuffer 支持
   */
  static checkSharedArrayBufferSupport(): SharedArrayBufferSupport {
    if (typeof window === 'undefined') {
      return {
        supported: false,
        reason: '不在浏览器环境中',
        suggestion: '请在浏览器中使用 FFmpeg.wasm',
      }
    }

    if (typeof SharedArrayBuffer === 'undefined') {
      return {
        supported: false,
        reason: 'SharedArrayBuffer 不可用',
        suggestion:
          '需要服务器设置 Cross-Origin-Opener-Policy: same-origin 和 Cross-Origin-Embedder-Policy: require-corp 响应头',
      }
    }

    const isSecureContext = window.isSecureContext
    if (!isSecureContext) {
      return {
        supported: false,
        reason: '不在安全上下文中',
        suggestion: '请使用 HTTPS 或 localhost',
      }
    }

    return { supported: true, reason: '', suggestion: '' }
  }

  /**
   * 检测是否支持多线程
   */
  static async checkMultiThreadSupport(): Promise<boolean> {
    const support = this.checkSharedArrayBufferSupport()
    if (!support.supported) {
      console.warn(`[FFmpeg] SharedArrayBuffer 不支持: ${support.reason}`)
      console.warn(`[FFmpeg] 建议: ${support.suggestion}`)
      return false
    }
    return true
  }

  /**
   * 加载 FFmpeg.wasm
   */
  async load(options: FFmpegLoadOptions = {}): Promise<void> {
    if (this.loaded) {
      console.log('[FFmpeg] 已经加载完成')
      return
    }

    if (this.loading) {
      console.log('[FFmpeg] 正在加载中...')
      while (this.loading) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      return
    }

    this.loading = true

    try {
      const { onProgress, onLog, multiThread: useMultiThread = false } = options

      // 检测多线程支持（默认不使用多线程以避免复杂性）
      const supportsMultiThread = useMultiThread
        ? await FFmpegClient.checkMultiThreadSupport()
        : false
      this.multiThread = supportsMultiThread

      console.log(`[FFmpeg] 使用${supportsMultiThread ? '多线程' : '单线程'}模式`)

      // 动态加载 FFmpeg 模块
      const { FFmpeg, fetchFile } = await loadFFmpegModule()

      // 创建 FFmpeg 实例
      this.ffmpeg = new FFmpeg()

      // 设置日志回调
      if (onLog) {
        this.ffmpeg.on('log', ({ type, message }: { type: string; message: string }) => {
          onLog({ type, message })
        })
      }

      // 设置进度回调
      this.ffmpeg.on('progress', ({ progress, time }: { progress: number; time: number }) => {
        const progressData: FFmpegProgress = {
          ratio: progress,
          time,
        }
        this.progressCallback?.(progressData)
      })

      console.log('[FFmpeg] 开始加载核心...')

      // 使用 UMD 版本从 CDN 加载（绕过 webpack 的 ESM import 拦截）
      const coreURL = `${FFMPEG_CORE_CDN_URL}/ffmpeg-core.js`
      const wasmURL = `${FFMPEG_CORE_CDN_URL}/ffmpeg-core.wasm`

      onProgress?.(0.3)

      console.log('[FFmpeg] coreURL:', coreURL)
      console.log('[FFmpeg] wasmURL:', wasmURL)

      // 加载 FFmpeg 核心
      await this.ffmpeg.load({
        coreURL,
        wasmURL,
      })

      this.loaded = true
      onProgress?.(1.0)
      console.log('[FFmpeg] 加载完成')
    } catch (error) {
      console.error('[FFmpeg] 加载失败:', error)
      this.loaded = false
      throw new Error(
        `FFmpeg 加载失败: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      this.loading = false
    }
  }

  /**
   * 检查是否已加载
   */
  isLoaded(): boolean {
    return this.loaded
  }

  /**
   * 检查是否正在加载
   */
  isLoading(): boolean {
    return this.loading
  }

  /**
   * 检查是否使用多线程模式
   */
  isMultiThread(): boolean {
    return this.multiThread
  }

  /**
   * 设置进度回调
   */
  onProgress(callback: (progress: FFmpegProgress) => void): void {
    this.progressCallback = callback
  }

  /**
   * 写入文件到虚拟文件系统
   */
  async writeFile(
    filename: string,
    data: Uint8Array | Blob | string,
    options: WriteFileOptions = {}
  ): Promise<void> {
    if (!this.ffmpeg || !this.loaded) {
      throw new Error('FFmpeg 未加载')
    }

    const { overwrite = true } = options

    // 检查文件是否已存在
    if (!overwrite) {
      try {
        await this.ffmpeg.readFile(filename)
        console.warn(`[FFmpeg] 文件 ${filename} 已存在，跳过写入`)
        return
      } catch {
        // 文件不存在，继续写入
      }
    }

    let fileData: Uint8Array

    if (typeof data === 'string') {
      fileData = new TextEncoder().encode(data)
    } else if (data instanceof Blob) {
      const { fetchFile } = await loadFFmpegModule()
      fileData = await fetchFile(data)
    } else {
      fileData = data
    }

    await this.ffmpeg.writeFile(filename, fileData)
    console.log(`[FFmpeg] 文件 ${filename} 写入完成，大小: ${fileData.length} bytes`)
  }

  /**
   * 从虚拟文件系统读取文件
   */
  async readFile(filename: string): Promise<Uint8Array> {
    if (!this.ffmpeg || !this.loaded) {
      throw new Error('FFmpeg 未加载')
    }

    const data = await this.ffmpeg.readFile(filename)
    const uint8Data = data instanceof Uint8Array ? data : new TextEncoder().encode(data)
    console.log(`[FFmpeg] 文件 ${filename} 读取完成，大小: ${uint8Data.length} bytes`)
    return uint8Data
  }

  /**
   * 从虚拟文件系统读取文件为 Blob
   */
  async readFileAsBlob(filename: string, mimeType: string = 'video/mp4'): Promise<Blob> {
    const data = await this.readFile(filename)
    const arrayBuffer = new ArrayBuffer(data.length)
    const view = new Uint8Array(arrayBuffer)
    view.set(data)
    return new Blob([arrayBuffer], { type: mimeType })
  }

  /**
   * 从虚拟文件系统读取文件为 Object URL
   */
  async readFileAsObjectURL(filename: string, mimeType?: string): Promise<string> {
    const blob = await this.readFileAsBlob(filename, mimeType)
    return URL.createObjectURL(blob)
  }

  /**
   * 删除虚拟文件系统中的文件
   */
  async deleteFile(filename: string): Promise<void> {
    if (!this.ffmpeg || !this.loaded) {
      throw new Error('FFmpeg 未加载')
    }

    await this.ffmpeg.deleteFile(filename)
    console.log(`[FFmpeg] 文件 ${filename} 已删除`)
  }

  /**
   * 执行 FFmpeg 命令
   */
  async exec(args: string[], timeout: number = 5 * 60 * 1000): Promise<void> {
    if (!this.ffmpeg || !this.loaded) {
      throw new Error('FFmpeg 未加载')
    }

    console.log(`[FFmpeg] 执行命令: ffmpeg ${args.join(' ')}`)

    const startTime = Date.now()

    try {
      await Promise.race([
        this.ffmpeg.exec(args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('FFmpeg 执行超时')), timeout)
        ),
      ])

      const duration = Date.now() - startTime
      console.log(`[FFmpeg] 命令执行完成，耗时: ${duration}ms`)
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[FFmpeg] 命令执行失败，耗时: ${duration}ms`, error)
      throw error
    }
  }

  /**
   * 合成视频和音频
   */
  async synthesizeVideo(options: VideoSynthesisOptions): Promise<string> {
    const { inputVideo, inputAudio, outputVideo, subtitleFile, resolution = '720p' } = options

    const { width, height } = VIDEO_RESOLUTIONS[resolution]

    const args: string[] = [
      '-i',
      inputVideo,
      '-i',
      inputAudio,
    ]

    const videoFilters: string[] = []

    videoFilters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`)
    videoFilters.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`)

    if (subtitleFile) {
      videoFilters.push(`subtitles=${subtitleFile}`)
    }

    if (videoFilters.length > 0) {
      args.push('-vf', videoFilters.join(','))
    }

    args.push(
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-shortest',
      '-y',
      outputVideo
    )

    await this.exec(args)
    return outputVideo
  }

  /**
   * 终止 FFmpeg 实例
   */
  async terminate(): Promise<void> {
    if (this.ffmpeg) {
      try {
        this.ffmpeg.terminate()
        console.log('[FFmpeg] 已终止')
      } catch (error) {
        console.error('[FFmpeg] 终止失败:', error)
      }
    }
    this.ffmpeg = null
    this.loaded = false
    this.loading = false
    this.progressCallback = null
  }
}

// ============================================
// 单例模式
// ============================================

let ffmpegInstance: FFmpegClient | null = null

export function getFFmpegClient(): FFmpegClient {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpegClient()
  }
  return ffmpegInstance
}

export function resetFFmpegClient(): void {
  if (ffmpegInstance) {
    ffmpegInstance.terminate().catch(console.error)
    ffmpegInstance = null
  }
}
