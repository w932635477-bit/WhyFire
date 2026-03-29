/**
 * 翻唱歌曲/视频上传 API
 *
 * 用户上传音频或视频文件到 OSS，获取公网 URL 供后续处理
 *
 * POST /api/cover/upload
 * Body: FormData { audio: File }
 * Response: { code: 0, data: { url, objectKey } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadToOSS, isOSSConfigured } from '@/lib/oss'
import { withOptionalAuth, checkRateLimit } from '@/lib/middleware/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export const POST = withOptionalAuth(async (request: NextRequest) => {
  // 限流：每分钟 5 次上传
  const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  const rateLimit = checkRateLimit(`cover-upload:${clientId}`, 5, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { code: 429, message: '上传过于频繁，请稍后再试' },
      { status: 429 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('audio') as File | null

    if (!file) {
      return NextResponse.json(
        { code: 400, message: '请上传音频或视频文件' },
        { status: 400 }
      )
    }

    // 文件大小检查
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { code: 400, message: `文件过大，最大支持 500MB` },
        { status: 400 }
      )
    }

    // OSS 配置检查
    if (!isOSSConfigured()) {
      return NextResponse.json(
        { code: 503, message: 'OSS 未配置，请设置 OSS 环境变量' },
        { status: 503 }
      )
    }

    // 上传到 OSS
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToOSS(buffer, file.name, {
      folder: 'cover-uploads',
      contentType: file.type || 'application/octet-stream',
      timeout: 300000, // 5 分钟超时，适应大文件
    })

    if (!result.success || !result.url) {
      return NextResponse.json(
        { code: 500, message: result.error || '上传失败' },
        { status: 500 }
      )
    }

    console.log(`[Cover Upload] 文件上传成功: ${result.objectKey}`)

    return NextResponse.json({
      code: 0,
      data: {
        url: result.url,
        objectKey: result.objectKey,
      },
    })
  } catch (error) {
    console.error('[Cover Upload] 上传失败:', error)
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    )
  }
})
