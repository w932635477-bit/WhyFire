/**
 * 音乐视频（MV）生成 API
 *
 * 异步模式：
 *   POST /api/cover/music-video → 提交 MV 任务，立即返回 { taskId, status: 'processing' }
 *   GET  /api/cover/music-video?taskId=xxx → 轮询 MV 任务状态
 *
 * 视频保留 15 天
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCoverGenerator, type AsyncTaskState } from '@/lib/services/cover-generator'
import { withOptionalAuth, checkRateLimit } from '@/lib/middleware/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface MusicVideoRequest {
  taskId: string
  audioId: string
  author?: string
}

export const POST = withOptionalAuth(async (request: NextRequest) => {
  const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  const rateLimit = checkRateLimit(`mv:${clientId}`, 2, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { code: 429, message: 'MV 生成请求过于频繁，请稍后再试' },
      { status: 429 }
    )
  }

  try {
    const body: MusicVideoRequest = await request.json()

    if (!body.taskId || !body.audioId) {
      return NextResponse.json(
        { code: 400, message: 'taskId 和 audioId 不能为空' },
        { status: 400 }
      )
    }

    console.log(`[MV API] MV 生成请求: taskId=${body.taskId}, audioId=${body.audioId}`)

    const generator = getCoverGenerator()

    // 异步提交 MV 任务
    const mvTaskId = generator.startMusicVideoGeneration(
      body.taskId,
      body.audioId,
      body.author,
    )

    return NextResponse.json({
      code: 0,
      data: {
        taskId: mvTaskId,
        status: 'processing',
        step: 'mv-submitting',
        stepName: '提交 MV',
        progress: 0,
        message: '正在提交 MV 生成任务...',
      },
    })
  } catch (error) {
    console.error('[MV API] MV 生成失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : 'MV 生成失败' },
      { status: 500 }
    )
  }
})

/**
 * GET /api/cover/music-video?taskId=xxx
 * 轮询 MV 任务状态
 */
export const GET = withOptionalAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { code: 400, message: 'taskId 参数不能为空' },
        { status: 400 }
      )
    }

    const generator = getCoverGenerator()
    const taskState = generator.getTaskStatus(taskId)

    if (!taskState) {
      // 兜底：尝试直接查 SunoAPI（兼容旧的 MV taskId）
      const { getSunoApiClient } = await import('@/lib/music/suno-api-client')
      const client = getSunoApiClient()
      const result = await client.getMusicVideoStatus(taskId)

      return NextResponse.json({
        code: 0,
        data: {
          taskId: result.taskId,
          videoUrl: result.videoUrl,
          status: result.status,
          error: result.error,
          step: result.status === 'completed' ? 'completed' : result.status === 'failed' ? 'failed' : 'mv-polling',
          stepName: result.status === 'completed' ? '完成' : '生成 MV',
          progress: result.status === 'completed' ? 100 : 50,
          message: result.status === 'completed' ? 'MV 生成完成' : 'MV 生成中...',
        },
      })
    }

    const response: Record<string, any> = {
      taskId: taskState.taskId,
      status: taskState.status,
      step: taskState.step,
      stepName: taskState.stepName,
      progress: taskState.progress,
      message: taskState.message,
    }

    if (taskState.status === 'completed' && taskState.result) {
      const result = taskState.result as any
      response.videoUrl = result.videoUrl
    }

    if (taskState.status === 'failed') {
      response.error = taskState.error
    }

    return NextResponse.json({ code: 0, data: response })
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '查询 MV 状态失败' },
      { status: 500 }
    )
  }
})
