/**
 * 音乐任务状态查询 API
 * GET /api/music/status?taskId=xxx
 * 查询 MiniMax 音乐生成任务状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMiniMaxClient } from '@/lib/minimax/client'
import type { MusicStatusRouteResponse } from '@/lib/minimax/types'
import { MiniMaxError } from '@/lib/minimax/types'

/**
 * GET /api/music/status?taskId=xxx
 * 查询音乐生成任务状态
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<MusicStatusRouteResponse>> {
  try {
    // 获取 taskId 参数
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    // 验证必填参数
    if (!taskId) {
      return NextResponse.json(
        {
          code: 400,
          data: {
            taskId: '',
            status: 'failed',
            error: '缺少必填参数: taskId',
          },
          message: '缺少必填参数: taskId',
        },
        { status: 400 }
      )
    }

    // 获取 MiniMax 客户端
    const client = getMiniMaxClient()

    // 查询任务状态
    const result = await client.getTaskStatus(taskId)

    console.log(
      `[API] 任务状态查询: taskId=${taskId}, status=${result.status}`
    )

    // 返回成功响应
    return NextResponse.json({
      code: 0,
      data: result,
    })
  } catch (error) {
    console.error('[API] 任务状态查询失败:', error)

    // 判断错误类型并返回相应消息
    let errorMessage = '任务状态查询失败,请稍后重试'
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
        data: {
          taskId: '',
          status: 'failed',
          error: errorMessage,
        },
        message: errorMessage,
      },
      { status: statusCode }
    )
  }
}
