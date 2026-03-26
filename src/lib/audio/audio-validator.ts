/**
 * 音频文件验证工具
 *
 * 功能：
 * 1. 验证音频时长（1-30 秒）
 * 2. 验证文件类型
 * 3. 提取音频元数据
 */

import { parseBuffer } from 'music-metadata'
import type { IAudioMetadata } from 'music-metadata'

// ============================================================================
// 类型定义
// ============================================================================

export interface AudioValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 音频时长（秒） */
  duration: number
  /** 音频格式 */
  format?: string
  /** 采样率 */
  sampleRate?: number
  /** 声道数 */
  channels?: number
  /** 比特率 */
  bitrate?: number
  /** 错误信息 */
  error?: string
}

export interface AudioValidationOptions {
  /** 最小时长（秒） */
  minDuration?: number
  /** 最大时长（秒） */
  maxDuration?: number
  /** 允许的格式 */
  allowedFormats?: string[]
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_OPTIONS: Required<AudioValidationOptions> = {
  minDuration: 1,
  maxDuration: 30,
  allowedFormats: ['mp3', 'wav', 'webm', 'ogg', 'm4a', 'flac', 'aac'],
}

// ============================================================================
// 验证函数
// ============================================================================

/**
 * 验证音频文件
 *
 * @param buffer 音频文件 Buffer
 * @param mimeType MIME 类型
 * @param filename 文件名
 * @param options 验证选项
 * @returns 验证结果
 *
 * @example
 * ```ts
 * const result = await validateAudioFile(buffer, 'audio/mpeg', 'test.mp3')
 * if (!result.valid) {
 *   throw new Error(result.error)
 * }
 * console.log(`Duration: ${result.duration}s`)
 * ```
 */
export async function validateAudioFile(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  options: AudioValidationOptions = {}
): Promise<AudioValidationResult> {
  const config = { ...DEFAULT_OPTIONS, ...options }

  try {
    // 1. 检查文件扩展名
    const ext = filename.split('.').pop()?.toLowerCase()
    if (!ext || !config.allowedFormats.includes(ext)) {
      return {
        valid: false,
        duration: 0,
        error: `不支持的音频格式: ${ext}。支持的格式: ${config.allowedFormats.join(', ')}`,
      }
    }

    // 2. 检查 MIME 类型
    const validMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/webm',
      'audio/ogg',
      'audio/mp4',
      'audio/x-m4a',
      'audio/flac',
      'audio/aac',
    ]

    if (!validMimeTypes.includes(mimeType)) {
      return {
        valid: false,
        duration: 0,
        error: `不支持的 MIME 类型: ${mimeType}`,
      }
    }

    // 3. 解析音频元数据
    let metadata: IAudioMetadata
    try {
      metadata = await parseBuffer(buffer, { mimeType })
    } catch (parseError) {
      // 如果解析失败，可能是格式不支持或文件损坏
      console.error('[AudioValidator] Metadata parse error:', parseError)
      return {
        valid: false,
        duration: 0,
        error: '无法解析音频文件，可能文件已损坏或格式不支持',
      }
    }

    // 4. 提取时长
    const duration = metadata.format.duration || 0

    if (duration === 0) {
      return {
        valid: false,
        duration: 0,
        error: '无法获取音频时长',
      }
    }

    // 5. 验证时长范围
    if (duration < config.minDuration) {
      return {
        valid: false,
        duration,
        error: `音频时长太短: ${duration.toFixed(1)}秒，最小需要 ${config.minDuration} 秒`,
      }
    }

    if (duration > config.maxDuration) {
      return {
        valid: false,
        duration,
        error: `音频时长太长: ${duration.toFixed(1)}秒，最大允许 ${config.maxDuration} 秒`,
      }
    }

    // 6. 提取其他元数据
    const format = metadata.format.container || ext
    const sampleRate = metadata.format.sampleRate
    const channels = metadata.format.numberOfChannels
    const bitrate = metadata.format.bitrate

    // 7. 返回验证成功结果
    return {
      valid: true,
      duration,
      format,
      sampleRate,
      channels,
      bitrate,
    }
  } catch (error) {
    console.error('[AudioValidator] Validation error:', error)
    return {
      valid: false,
      duration: 0,
      error: error instanceof Error ? error.message : '音频验证失败',
    }
  }
}

/**
 * 快速验证音频时长（不检查其他元数据）
 *
 * @param buffer 音频文件 Buffer
 * @returns 时长（秒）或 0（失败时）
 */
export async function getAudioDuration(buffer: Buffer): Promise<number> {
  try {
    const metadata = await parseBuffer(buffer)
    return metadata.format.duration || 0
  } catch {
    return 0
  }
}

/**
 * 检查音频文件是否为有效的参考音频
 * 参考音频要求：
 * - 时长: 1-30 秒
 * - 格式: mp3, wav, webm, ogg, m4a, flac, aac
 * - 大小: < 10MB
 *
 * @param buffer 音频文件 Buffer
 * @param mimeType MIME 类型
 * @param filename 文件名
 * @returns 验证结果
 */
export async function validateReferenceAudio(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<AudioValidationResult> {
  // 检查文件大小
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (buffer.length > maxSize) {
    return {
      valid: false,
      duration: 0,
      error: `文件太大: ${(buffer.length / 1024 / 1024).toFixed(2)}MB，最大允许 10MB`,
    }
  }

  // 验证音频
  return validateAudioFile(buffer, mimeType, filename, {
    minDuration: 1,
    maxDuration: 30,
  })
}

/**
 * 格式化音频信息（用于日志）
 */
export function formatAudioInfo(result: AudioValidationResult): string {
  if (!result.valid) {
    return `Invalid audio: ${result.error}`
  }

  const parts = [
    `${result.duration.toFixed(1)}s`,
    result.format,
    result.sampleRate ? `${result.sampleRate}Hz` : null,
    result.channels ? `${result.channels}ch` : null,
    result.bitrate ? `${Math.round(result.bitrate / 1000)}kbps` : null,
  ]

  return parts.filter(Boolean).join(', ')
}
