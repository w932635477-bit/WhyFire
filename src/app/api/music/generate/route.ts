/**
 * 音乐生成 API
 * POST /api/music/generate
 * 集成 MiniMax API 生成音乐
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMiniMaxClient } from '@/lib/minimax/client'
import type {
  MiniMaxDialect,
  MiniMaxMusicStyle,
  MusicGenerateRouteResponse,
} from '@/lib/minimax/types'
import { MiniMaxError } from '@/lib/minimax/types'

// 请求类型
interface MusicGenerateRequest {
  /** 歌词内容 */
  lyrics: string
  /** 方言: mandarin(普通话) | cantonese(粤语) */
  dialect: MiniMaxDialect
  /** 音乐风格: pop | rap | electronic */
  style: MiniMaxMusicStyle
  /** 音频时长(秒), 可选, 默认 30 秒 */
  duration?: number
}

/**
 * POST /api/music/generate
 * 创建音乐生成任务
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<MusicGenerateRouteResponse>> {
  try {
    // 解析请求体
    const body: MusicGenerateRequest = await request.json()
    const { lyrics, dialect, style, duration } = body

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

    if (!style) {
      return NextResponse.json(
        {
          code: 400,
          data: { taskId: '', status: 'failed' },
          message: '缺少必填字段: style',
        },
        { status: 400 }
      )
    }

    // 验证方言类型
    const validDialects: MiniMaxDialect[] = ['mandarin', 'cantonese']
    if (!validDialects.includes(dialect)) {
      return NextResponse.json(
        {
          code: 400,
          data: { taskId: '', status: 'failed' },
          message: `不支持的方言: ${dialect}, 支持的方言: ${validDialects.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // 验证音乐风格
    const validStyles: MiniMaxMusicStyle[] = ['pop', 'rap', 'electronic']
    if (!validStyles.includes(style)) {
      return NextResponse.json(
        {
          code: 400,
          data: { taskId: '', status: 'failed' },
          message: `不支持的音乐风格: ${style}, 支持的风格: ${validStyles.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // 获取 MiniMax 客户端
    const client = getMiniMaxClient()

    // 创建音乐生成任务
    const taskId = await client.generateMusic({
      lyrics,
      dialect,
      style,
      duration: duration || 30,
    })

    console.log(`[API] 音乐生成任务已创建: taskId=${taskId}, dialect=${dialect}, style=${style}`)

    // 返回成功响应
    return NextResponse.json({
      code: 0,
      data: {
        taskId,
        status: 'pending',
      },
    })
  } catch (error) {
    console.error('[API] 音乐生成失败:', error)

    // 判断错误类型并返回相应消息
    let errorMessage = '音乐生成失败,请稍后重试'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('MINIMAX_API_KEY')) {
        errorMessage = '服务配置错误: MINIMAX_API_KEY 未配置'
      } else if (error.message.includes('MINIMAX_GROUP_ID')) {
        errorMessage = '服务配置错误: MINIMAX_GROUP_ID 未配置'
      } else if (error instanceof MiniMaxError) {
        errorMessage = error.message
        statusCode = error.statusCode >= 500 ? 500 : 400
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
