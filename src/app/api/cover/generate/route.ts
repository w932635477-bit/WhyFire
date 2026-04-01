/**
 * 方言翻唱生成 API
 *
 * 异步模式：
 *   POST /api/cover/generate → 提交任务，立即返回 { taskId, status: 'processing' }
 *   GET  /api/cover/generate?taskId=xxx → 轮询任务状态
 *   GET  /api/cover/generate?action=services → 检查服务状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCoverGenerator, type AsyncTaskState } from '@/lib/services/cover-generator'
import { withOptionalAuth, checkRateLimit, getClientIp } from '@/lib/middleware/auth'
import { isValidPublicUrl } from '@/lib/utils/url-validator'
import type { DialectCode } from '@/types/dialect'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface CoverGenerateRequest {
  userId: string
  songUrl: string
  dialect: DialectCode
  customLyrics?: string
  brandMessage?: string
  vocalGender?: 'm' | 'f'
}

/**
 * POST /api/cover/generate
 * 提交方言翻唱任务（异步）
 */
export const POST = withOptionalAuth(async (request: NextRequest) => {
  const clientId = getClientIp(request)
  const rateLimit = checkRateLimit(`cover:${clientId}`, 3, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { code: 429, message: '翻唱生成请求过于频繁，请稍后再试' },
      { status: 429 }
    )
  }

  try {
    const body: CoverGenerateRequest = await request.json()

    // 参数验证
    if (!body.songUrl || !body.dialect) {
      return NextResponse.json(
        { code: 400, message: 'songUrl 和 dialect 不能为空' },
        { status: 400 }
      )
    }

    // SSRF 防护
    if (!isValidPublicUrl(body.songUrl)) {
      return NextResponse.json(
        { code: 400, message: 'songUrl 不是有效的公网 URL' },
        { status: 400 }
      )
    }

    // 输入长度限制（防止 LLM prompt 注入）
    if (body.brandMessage && body.brandMessage.length > 2000) {
      return NextResponse.json(
        { code: 400, message: 'brandMessage 不能超过 2000 字' },
        { status: 400 }
      )
    }
    if (body.customLyrics && body.customLyrics.length > 5000) {
      return NextResponse.json(
        { code: 400, message: 'customLyrics 不能超过 5000 字' },
        { status: 400 }
      )
    }

    console.log(`[Cover API] 翻唱请求: dialect=${body.dialect}, userId=${body.userId}`)

    const generator = getCoverGenerator()

    // 异步提交任务
    const taskId = generator.startGeneration({
      userId: body.userId || `cover-${Date.now()}`,
      songUrl: body.songUrl,
      dialect: body.dialect,
      customLyrics: body.customLyrics,
      brandMessage: body.brandMessage,
      vocalGender: body.vocalGender,
    })

    return NextResponse.json({
      code: 0,
      data: {
        taskId,
        status: 'processing',
        step: 'submitting',
        stepName: '提交任务',
        progress: 0,
        message: '正在提交翻唱任务...',
      },
    })
  } catch (error) {
    console.error('[Cover API] 翻唱请求失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '翻唱生成失败' },
      { status: 500 }
    )
  }
})

/**
 * GET /api/cover/generate?taskId=xxx
 * 轮询翻唱任务状态
 */
export const GET = withOptionalAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // 服务状态检查
  const action = searchParams.get('action')
  if (action === 'services') {
    const generator = getCoverGenerator()
    const services = await generator.checkServices()
    return NextResponse.json({ code: 0, data: services })
  }

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
    return NextResponse.json(
      { code: 404, message: '任务不存在或已过期' },
      { status: 404 }
    )
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
    // 使用 streamAudioUrl 作为首选（V5 流式交付，比 audioUrl 早 30-50s）
    response.audioUrl = result.streamAudioUrl || result.audioUrl || ''
    response.streamAudioUrl = result.streamAudioUrl || ''
    response.audioId = result.audioId
    response.sunoTaskId = result.taskId   // SunoAPI 原始 taskId（MV 生成需要）
    response.duration = result.duration
    response.lyrics = result.lyrics
    response.dialect = result.dialect
    response.isPartial = result.isPartial || false
  }

  if (taskState.status === 'failed') {
    response.error = taskState.error
  }

  return NextResponse.json({ code: 0, data: response })
})
