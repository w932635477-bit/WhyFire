/**
 * 音乐生成 API
 * POST /api/music/generate
 * 支持所有 18 种方言
 *
 * 路由策略：
 * - 普通话/粤语/英语 → MiniMax API（支持完整音乐生成）
 * - 其他方言 → Fish Audio TTS（方言语音合成）
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateMusic, getRecommendedProvider } from '@/lib/music/music-router'
import type { DialectCode } from '@/types/dialect'
import { DIALECT_CONFIGS, DIALECT_LABELS } from '@/types/dialect'

// 增加路由超时时间（Next.js 15 支持）
export const maxDuration = 180 // 180 秒

/**
 * 音乐风格
 */
type MusicStyle = 'rap' | 'pop' | 'electronic' | 'rock' | 'chill'

// 请求类型
interface MusicGenerateRequest {
  /** 歌词内容 */
  lyrics: string
  /** 方言（支持 18 种） */
  dialect: DialectCode
  /** 音乐风格 */
  style?: MusicStyle
  /** 音频时长(秒), 可选 */
  duration?: number
  /** 音色 ID（可选，用于 Fish Audio） */
  voiceId?: string
}

// 响应类型
interface MusicGenerateResponse {
  code: number
  data: {
    taskId: string
    status: 'completed' | 'failed' | 'processing'
    audioUrl?: string
    duration?: number
    provider?: 'minimax' | 'fish_audio'
    dialect?: string
  }
  message?: string
}

/**
 * POST /api/music/generate
 * 生成方言音乐
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<MusicGenerateResponse>> {
  try {
    // 解析请求体
    const body: MusicGenerateRequest = await request.json()
    const { lyrics, dialect, style = 'rap', duration = 30, voiceId } = body

    // 验证必填字段
    if (!lyrics || lyrics.trim().length === 0) {
      return NextResponse.json(
        {
          code: 400,
          data: { taskId: '', status: 'failed' },
          message: '歌词内容不能为空',
        },
        { status: 400 }
      )
    }

    if (!dialect) {
      return NextResponse.json(
        {
          code: 400,
          data: { taskId: '', status: 'failed' },
          message: '缺少必填字段: dialect',
        },
        { status: 400 }
      )
    }

    // 验证方言是否支持
    if (!DIALECT_CONFIGS[dialect]) {
      const supportedDialects = Object.keys(DIALECT_LABELS).join(', ')
      return NextResponse.json(
        {
          code: 400,
          data: { taskId: '', status: 'failed' },
          message: `不支持的方言: ${dialect}。支持的方言: ${supportedDialects}`,
        },
        { status: 400 }
      )
    }

    // 获取推荐的服务提供商
    const provider = getRecommendedProvider(dialect)
    console.log(`[API] 方言: ${dialect} (${DIALECT_LABELS[dialect]}), 使用服务: ${provider}`)

    // 生成音乐
    const result = await generateMusic({
      lyrics,
      dialect,
      style,
      duration,
      voiceId,
    })

    // 生成任务 ID
    const taskId = `music-${Date.now()}-${Math.random().toString(36).slice(2)}`

    console.log(`[API] 音乐生成成功: taskId=${taskId}, provider=${result.provider}`)

    // 返回成功响应
    return NextResponse.json({
      code: 0,
      data: {
        taskId,
        status: 'completed',
        audioUrl: result.audioUrl,
        duration: result.duration,
        provider: result.provider,
        dialect: result.dialect,
      },
    })
  } catch (error) {
    console.error('[API] 音乐生成失败:', error)

    // 判断错误类型并返回相应消息
    let errorMessage = '音乐生成失败，请稍后重试'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('MINIMAX_API_KEY')) {
        errorMessage = '服务配置错误: MINIMAX_API_KEY 未配置'
      } else if (error.message.includes('FISH_AUDIO_API_KEY')) {
        errorMessage = '服务配置错误: FISH_AUDIO_API_KEY 未配置，无法生成方言语音'
        statusCode = 503
      } else if (error.message.includes('MINIMAX_GROUP_ID')) {
        errorMessage = '服务配置错误: MINIMAX_GROUP_ID 未配置'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        code: statusCode,
        data: { taskId: '', status: 'failed' },
        message: errorMessage,
      },
      { status: statusCode }
    )
  }
}

/**
 * GET /api/music/generate
 * 返回支持的方言列表
 */
export async function GET() {
  return NextResponse.json({
    code: 0,
    data: {
      dialects: Object.entries(DIALECT_LABELS).map(([code, name]) => ({
        code,
        name,
        provider: getRecommendedProvider(code as DialectCode),
      })),
      styles: ['rap', 'pop', 'electronic', 'rock', 'chill'],
    },
  })
}
