/**
 * FFmpeg.wasm 客户端封装
 * 提供视频处理能力的浏览器端实现
 */

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import type {
  FFmpegLoadOptions,
  FFmpegLogMessage,
  FFmpegProgress,
  SharedArrayBufferSupport,
  VideoSynthesisOptions,
  WriteFileOptions,
} from './types'

/**
 * FFmpeg.wasm 版本信息
 */
const FFMPEG_CORE_VERSION = '0.12.6'
const FFMPEG_CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`
const FFMPEG_CORE_MT_BASE_URL = `https://unpkg.com/@ffmpeg/core-mt@${FFMPEG_CORE_VERSION}/dist/esm`

/**
 * FFmpeg 客户端类
 * 封装 FFmpeg.wasm 的加载、文件操作和命令执行
 */
export class FFmpegClient {
  private ffmpeg: FFmpeg | null = null
  private loaded = false
  private loading = false
  private multiThread = false
  private progressCallback: ((progress: FFmpegProgress) => void) | null = null

  /**
   * 检测 SharedArrayBuffer 支持
   */
  static checkSharedArrayBufferSupport(): SharedArrayBufferSupport {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined') {
      return {
        supported: false,
        reason: '不在浏览器环境中',
        suggestion: '请在浏览器中使用 FFmpeg.wasm',
      }
    }

    // 检查 SharedArrayBuffer 是否可用
    if (typeof SharedArrayBuffer === 'undefined') {
      return {
        supported: false,
        reason: 'SharedArrayBuffer 不可用',
        suggestion:
          '需要服务器设置 Cross-Origin-Opener-Policy: same-origin 和 Cross-Origin-Embedder-Policy: require-corp 响应头',
      }
    }

    // 检查是否在安全上下文（HTTPS 或 localhost）
    const isSecureContext = window.isSecureContext
    if (!isSecureContext) {
      return {
        supported: false,
        reason: '不在安全上下文中',
        suggestion: '请使用 HTTPS 或 localhost',
      }
    }

    return {
      supported: true,
    }
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
   * @param options 加载选项
   */
  async load(options: FFmpegLoadOptions = {}): Promise<void> {
    // 如果已经加载或正在加载，直接返回
    if (this.loaded) {
      console.log('[FFmpeg] 已经加载完成')
      return
    }

    if (this.loading) {
      console.log('[FFmpeg] 正在加载中...')
      // 等待加载完成
      while (this.loading) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      return
    }

    this.loading = true

    try {
      const { onProgress, onLog, multiThread: useMultiThread = true } = options

      // 检测是否支持多线程
      const supportsMultiThread = useMultiThread
        ? await FFmpegClient.checkMultiThreadSupport()
        : false
      this.multiThread = supportsMultiThread

      console.log(`[FFmpeg] 使用${supportsMultiThread ? '多线程' : '单线程'}模式`)

      // 创建 FFmpeg 实例
      this.ffmpeg = new FFmpeg()

      // 设置日志回调
      if (onLog) {
        this.ffmpeg.on('log', ({ type, message }) => {
          onLog({ type, message })
        })
      }

      // 设置进度回调
      this.ffmpeg.on('progress', ({ progress, time }) => {
        const progressData: FFmpegProgress = {
          ratio: progress,
          time,
        }
        this.progressCallback?.(progressData)
      })

      // 确定 core URL
      const baseURL = supportsMultiThread ? FFMPEG_CORE_MT_BASE_URL : FFMPEG_CORE_BASE_URL

      // 加载 FFmpeg 核心
      if (supportsMultiThread) {
        // 多线程模式
        const coreURL = options.coreURL || `${baseURL}/ffmpeg-core.js`
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        const workerURL = await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')

        onProgress?.(0.3)

        await this.ffmpeg.load({
          coreURL,
          wasmURL,
          workerURL,
        })
      } else {
        // 单线程模式
        const coreURL = options.coreURL || `${baseURL}/ffmpeg-core.js`
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')

        onProgress?.(0.3)

        await this.ffmpeg.load({
          coreURL,
          wasmURL,
        })
      }

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
   * @param filename 文件名
   * @param data 文件数据
   * @param options 选项
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
      // 字符串转 Uint8Array
      fileData = new TextEncoder().encode(data)
    } else if (data instanceof Blob) {
      // Blob 转 Uint8Array
      fileData = await fetchFile(data)
    } else {
      fileData = data
    }

    await this.ffmpeg.writeFile(filename, fileData)
    console.log(`[FFmpeg] 文件 ${filename} 写入完成，大小: ${fileData.length} bytes`)
  }

  /**
   * 从虚拟文件系统读取文件
   * @param filename 文件名
   * @returns 文件数据
   */
  async readFile(filename: string): Promise<Uint8Array> {
    if (!this.ffmpeg || !this.loaded) {
      throw new Error('FFmpeg 未加载')
    }

    const data = await this.ffmpeg.readFile(filename)
    // 确保返回 Uint8Array
    const uint8Data = data instanceof Uint8Array ? data : new TextEncoder().encode(data)
    console.log(`[FFmpeg] 文件 ${filename} 读取完成，大小: ${uint8Data.length} bytes`)
    return uint8Data
  }

  /**
   * 从虚拟文件系统读取文件为 Blob
   * @param filename 文件名
   * @param mimeType MIME 类型
   * @returns Blob
   */
  async readFileAsBlob(filename: string, mimeType: string = 'video/mp4'): Promise<Blob> {
    const data = await this.readFile(filename)
    // 将 Uint8Array 转换为普通数组以避免 SharedArrayBuffer 类型问题
    const arrayBuffer = new ArrayBuffer(data.length)
    const view = new Uint8Array(arrayBuffer)
    view.set(data)
    return new Blob([arrayBuffer], { type: mimeType })
  }

  /**
   * 从虚拟文件系统读取文件为 Object URL
   * @param filename 文件名
   * @param mimeType MIME 类型
   * @returns Object URL
   */
  async readFileAsObjectURL(filename: string, mimeType?: string): Promise<string> {
    const blob = await this.readFileAsBlob(filename, mimeType)
    return URL.createObjectURL(blob)
  }

  /**
   * 删除虚拟文件系统中的文件
   * @param filename 文件名
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
   * @param args 命令参数数组
   * @param timeout 超时时间（毫秒），默认 5 分钟
   */
  async exec(args: string[], timeout: number = 5 * 60 * 1000): Promise<void> {
    if (!this.ffmpeg || !this.loaded) {
      throw new Error('FFmpeg 未加载')
    }

    console.log(`[FFmpeg] 执行命令: ffmpeg ${args.join(' ')}`)

    const startTime = Date.now()

    try {
      // 使用 Promise.race 实现超时
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
   * @param options 合成选项
   */
  async synthesizeVideo(options: VideoSynthesisOptions): Promise<string> {
    const { inputVideo, inputAudio, outputVideo, subtitleFile } = options

    const args: string[] = [
      '-i',
      inputVideo,
      '-i',
      inputAudio,
      '-c:v',
      'copy', // 视频流直接复制
      '-c:a',
      'aac', // 音频编码为 AAC
      '-map',
      '0:v:0', // 使用第一个输入的视频
      '-map',
      '1:a:0', // 使用第二个输入的音频
      '-shortest', // 以最短的流为准
    ]

    // 如果有字幕文件，添加字幕
    if (subtitleFile) {
      args.push('-vf', `subtitles=${subtitleFile}`)
    }

    args.push('-y', outputVideo) // 覆盖输出文件

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

/**
 * 获取 FFmpeg 客户端单例
 */
export function getFFmpegClient(): FFmpegClient {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpegClient()
  }
  return ffmpegInstance
}

/**
 * 重置 FFmpeg 客户端单例
 */
export function resetFFmpegClient(): void {
  if (ffmpegInstance) {
    ffmpegInstance.terminate().catch(console.error)
    ffmpegInstance = null
  }
}
