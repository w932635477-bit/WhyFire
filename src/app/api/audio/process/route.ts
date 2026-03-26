/**
 * 音频处理 API
 * POST /api/audio/process
 *
 * 功能:
 * 1. 时间拉伸 - 不改变音调的情况下调整音频时长
 * 2. 混音合成 - 人声 + BGM 叠加
 * 3. 后处理效果 - 混响、压缩、标准化
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getFFmpegProcessor,
  type AudioProcessOptions,
  type MixConfig,
  type EffectsConfig,
} from '@/lib/audio/ffmpeg-processor'

// ============================================================================
// 请求/响应类型
// ============================================================================

interface ProcessAudioRequest {
  /** 音频数据 (Base64 编码) */
  audio: string
  /** 时间拉伸因子 (0.5 - 2.0) */
  timeStretchFactor?: number
  /** BGM 数据 (Base64 编码，可选) */
  bgm?: string
  /** 混音配置 */
  mixConfig?: {
    vocalVolume?: number
    bgmVolume?: number
    loopBgm?: boolean
  }
  /** 后处理效果 */
  effects?: {
    reverb?: { enabled: boolean; amount?: number }
    compressor?: { enabled: boolean; threshold?: number; ratio?: number }
    normalize?: boolean
  }
  /** 输出格式 */
  outputFormat?: 'mp3' | 'wav'
}

interface ProcessAudioResponse {
  /** 处理后的音频 (Base64 编码) */
  audio: string
  /** 咱始时长 (秒) */
  originalDuration: number
  /** 处理后时长 (秒) */
  processedDuration: number
  /** 应用的拉伸因子 */
  appliedStretchFactor: number
  /** 格式 */
  format: string
}

interface ErrorResponse {
  error: string
  details?: string
}

// ============================================================================
// API 处理
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: ProcessAudioRequest = await request.json()

    // 验证必要参数
    if (!body.audio) {
      return NextResponse.json(
        { error: 'Missing required field: audio' } as ErrorResponse,
        { status: 400 }
      )
    }

    // 解码 Base64 音频数据
    let audioBuffer: Buffer
    try {
      audioBuffer = Buffer.from(body.audio, 'base64')
    } catch {
      return NextResponse.json(
        { error: 'Invalid audio data: must be base64 encoded' } as ErrorResponse,
        { status: 400 }
      )
    }

    // 获取 FFmpeg 处理器
    const processor = getFFmpegProcessor()

    // 检查 FFmpeg 可用性
    const availability = await processor.checkAvailability()
    if (!availability.available) {
      return NextResponse.json(
        {
          error: 'FFmpeg is not available',
          details: availability.error,
        } as ErrorResponse,
        { status: 503 }
      )
    }

    // 准备处理选项
    const options: AudioProcessOptions = {}

    if (body.timeStretchFactor !== undefined) {
      options.timeStretchFactor = body.timeStretchFactor
    }

    if (body.bgm) {
      try {
        options.bgmBuffer = Buffer.from(body.bgm, 'base64')
      } catch {
        return NextResponse.json(
          { error: 'Invalid BGM data: must be base64 encoded' } as ErrorResponse,
          { status: 400 }
        )
      }

      if (body.mixConfig) {
        options.mixConfig = body.mixConfig as MixConfig
      }
    }

    if (body.effects) {
      options.effects = body.effects as EffectsConfig
    }

    if (body.outputFormat) {
      options.outputFormat = body.outputFormat
    }

    // 执行音频处理
    console.log(`[API /audio/process] Processing audio: stretch=${body.timeStretchFactor}, hasBgm=${!!body.bgm}`)

    const result = await processor.process(audioBuffer, options)

    // 返回处理结果
    const response: ProcessAudioResponse = {
      audio: result.audioBuffer.toString('base64'),
      originalDuration: result.originalDuration,
      processedDuration: result.processedDuration,
      appliedStretchFactor: result.appliedStretchFactor,
      format: result.format,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API /audio/process] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to process audio',
        details: error instanceof Error ? error.message : 'Unknown error',
      } as ErrorResponse,
      { status: 500 }
    )
  }
}

// ============================================================================
// 健康检查
// ============================================================================

export async function GET() {
  const processor = getFFmpegProcessor()
  const availability = await processor.checkAvailability()

  return NextResponse.json({
    status: 'ok',
    ffmpeg: availability.available,
    version: availability.version,
  })
}
