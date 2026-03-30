/**
 * 预生成管理 API（Admin）
 *
 * POST /api/admin/pregenerate   → 启动/停止预生成
 * GET  /api/admin/pregenerate   → 查看进度
 * GET  /api/admin/pregenerate?action=songs → 热歌列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, checkRateLimit } from '@/lib/middleware/auth'
import { getPregenerateService } from '@/lib/services/pregenerate/pregenerate-service'
import { getHotSongList } from '@/lib/services/pregenerate/hot-songs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/pregenerate
 */
export const POST = withAuth(async (request: NextRequest) => {
  // Admin 端点添加 origin 检查（防 CSRF）
  const rateLimit = checkRateLimit('pregenerate:admin', 10, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { code: 429, message: '请求过于频繁' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const action = body.action as string

    const service = getPregenerateService()

    switch (action) {
      case 'start': {
        const state = await service.start()
        return NextResponse.json({
          code: 0,
          data: {
            status: state.status,
            message: state.message,
          },
        })
      }

      case 'stop': {
        const state = service.stop()
        return NextResponse.json({
          code: 0,
          data: {
            status: state.status,
            message: state.message,
          },
        })
      }

      default:
        return NextResponse.json(
          { code: 400, message: 'action 必须是 start 或 stop' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[PregenAPI] POST error:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '操作失败' },
      { status: 500 }
    )
  }
})

/**
 * GET /api/admin/pregenerate
 */
export const GET = withAuth(async (request: NextRequest) => {
  // Admin 端点 origin 检查已由 withAuth 处理
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // 热歌列表
  if (action === 'songs') {
    const songs = getHotSongList()
    return NextResponse.json({
      code: 0,
      data: {
        songs,
        total: songs.length,
      },
    })
  }

  // 默认：返回进度状态
  const service = getPregenerateService()
  const state = service.getState()

  return NextResponse.json({
    code: 0,
    data: {
      status: state.status,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      totalJobs: state.totalJobs,
      completedJobs: state.completedJobs,
      skippedJobs: state.skippedJobs,
      failedJobs: state.failedJobs,
      currentSong: state.currentSong,
      currentDialect: state.currentDialect,
      message: state.message,
    },
  })
})
