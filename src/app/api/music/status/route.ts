/**
 * 音乐任务状态查询 API（已废弃）
 * GET /api/music/status?taskId=xxx
 *
 * 注意：CosyVoice 3 是同步生成，不需要轮询任务状态
 * 此路由保留用于向后兼容
 */

import { NextRequest, NextResponse } from 'next/server'

interface MusicStatusResponse {
  code: number
  data: {
    taskId: string
    status: 'completed' | 'failed' | 'processing'
    error?: string
  }
  message?: string
}

/**
 * GET /api/music/status?taskId=xxx
 * 查询音乐生成任务状态
 *
 * @deprecated CosyVoice 3 同步生成，此 API 保留用于向后兼容
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<MusicStatusResponse>> {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json({
      code: 400,
      data: {
        taskId: '',
        status: 'failed',
        error: '缺少必填参数: taskId',
      },
      message: '缺少必填参数: taskId',
    }, { status: 400 })
  }

  // CosyVoice 是同步生成，直接返回完成状态
  return NextResponse.json({
    code: 0,
    data: {
      taskId,
      status: 'completed',
    },
  })
}
