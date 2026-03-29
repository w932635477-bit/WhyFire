/**
 * 时间戳歌词 API
 *
 * POST /api/cover/timestamped-lyrics
 * 接收 { taskId, audioId }，调用 SunoAPI 获取逐词时间戳歌词
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSunoApiClient } from '@/lib/music/suno-api-client'
import { withOptionalAuth, checkRateLimit } from '@/lib/middleware/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = withOptionalAuth(async (request: NextRequest) => {
  const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  const rateLimit = checkRateLimit(`tslyrics:${clientId}`, 5, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { code: 429, message: '请求过于频繁，请稍后再试' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()

    if (!body.taskId || !body.audioId) {
      return NextResponse.json(
        { code: 400, message: 'taskId 和 audioId 不能为空' },
        { status: 400 }
      )
    }

    console.log(`[TimestampedLyrics API] 获取时间戳歌词: taskId=${body.taskId}, audioId=${body.audioId}`)

    const client = getSunoApiClient()

    if (!client.isConfigured()) {
      return NextResponse.json(
        { code: 500, message: 'SunoAPI 未配置' },
        { status: 500 }
      )
    }

    const result = await client.getTimestampedLyrics(body.taskId, body.audioId)

    if (!result.alignedWords || result.alignedWords.length === 0) {
      return NextResponse.json(
        { code: 404, message: '未获取到时间戳歌词数据' },
        { status: 404 }
      )
    }

    console.log(`[TimestampedLyrics API] 成功获取 ${result.alignedWords.length} 个词的时间戳`)

    return NextResponse.json({
      code: 0,
      data: {
        alignedWords: result.alignedWords,
        wordCount: result.alignedWords.length,
      },
    })
  } catch (error) {
    console.error('[TimestampedLyrics API] 获取失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '获取时间戳歌词失败' },
      { status: 500 }
    )
  }
})
