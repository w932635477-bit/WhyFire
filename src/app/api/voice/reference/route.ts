/**
 * 参考音频上传 API
 *
 * 用于用户上传声音参考音频（1-30 秒）
 * Seed-VC 零样本声音克隆需要参考音频
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadToOSS, isOSSConfigured } from '@/lib/oss'
import { withOptionalAuth } from '@/lib/middleware/auth'
import { validateReferenceAudio, formatAudioInfo } from '@/lib/audio/audio-validator'

// ============================================================================
// 类型定义
// ============================================================================

interface UploadResponse {
  success: boolean
  referenceId?: string
  url?: string
  error?: string
}

// ============================================================================
// API 路由
// ============================================================================

/**
 * POST /api/voice/reference
 *
 * 上传参考音频（受认证保护）
 *
 * 认证方式：
 * - 开发环境：跳过认证
 * - 生产环境：需要 X-API-Key 或 Authorization: Bearer <token>
 *
 * Request:
 * - FormData with 'audio' field (audio file, 1-30 seconds)
 *
 * Response:
 * - success: boolean
 * - referenceId: string (用于后续 Rap 生成)
 * - url: string (OSS URL)
 */
export const POST = withOptionalAuth(async (request: NextRequest): Promise<NextResponse<UploadResponse>> => {
  try {
    // 检查 OSS 配置
    if (!isOSSConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'OSS 未配置，请联系管理员',
        },
        { status: 500 }
      )
    }

    // 解析 FormData
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        {
          success: false,
          error: '请上传音频文件',
        },
        { status: 400 }
      )
    }

    // 验证文件类型
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg']
    if (!validTypes.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|wav|webm|ogg)$/i)) {
      return NextResponse.json(
        {
          success: false,
          error: '不支持的音频格式，请上传 MP3、WAV、WebM 或 OGG 文件',
        },
        { status: 400 }
      )
    }

    // 验证文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: '文件太大，请上传 10MB 以内的音频',
        },
        { status: 400 }
      )
    }

    // 读取文件内容
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 验证音频文件（时长、格式、大小）
    console.log('[VoiceReference] Validating audio file...')
    const validation = await validateReferenceAudio(
      buffer,
      audioFile.type || 'audio/mpeg',
      audioFile.name
    )

    if (!validation.valid) {
      console.warn(`[VoiceReference] Validation failed: ${validation.error}`)
      return NextResponse.json(
        {
          success: false,
          error: validation.error || '音频文件验证失败',
        },
        { status: 400 }
      )
    }

    console.log(`[VoiceReference] Audio valid: ${formatAudioInfo(validation)}`)

    // 生成参考 ID
    const referenceId = `ref-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

    // 确定文件扩展名
    const ext = audioFile.name.split('.').pop() || 'mp3'
    const filename = `${referenceId}.${ext}`

    // 上传到 OSS
    const uploadResult = await uploadToOSS(buffer, filename, {
      folder: 'voice-references',
      contentType: audioFile.type || 'audio/mpeg',
    })

    if (!uploadResult.success || !uploadResult.url) {
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error || '上传失败',
        },
        { status: 500 }
      )
    }

    console.log(`[VoiceReference] Uploaded: ${referenceId} -> ${uploadResult.url}`)

    return NextResponse.json({
      success: true,
      referenceId,
      url: uploadResult.url,
      duration: validation.duration,
      format: validation.format,
      sampleRate: validation.sampleRate,
      channels: validation.channels,
    })
  } catch (error) {
    console.error('[VoiceReference] Upload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      },
      { status: 500 }
    )
  }
})

/**
 * GET /api/voice/reference?referenceId=xxx
 *
 * 获取参考音频信息（受认证保护）
 */
export const GET = withOptionalAuth(async (request: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url)
  const referenceId = searchParams.get('referenceId')

  if (!referenceId) {
    return NextResponse.json(
      { error: 'Missing referenceId parameter' },
      { status: 400 }
    )
  }

  // 构建可能的 OSS URL
  const bucket = process.env.OSS_BUCKET
  const region = process.env.OSS_REGION || 'oss-cn-beijing'

  if (!bucket) {
    return NextResponse.json(
      { error: 'OSS not configured' },
      { status: 500 }
    )
  }

  // 尝试不同的扩展名
  const extensions = ['mp3', 'wav', 'webm', 'ogg']
  const possibleUrls = extensions.map(
    ext => `https://${bucket}.${region}.aliyuncs.com/voice-references/${referenceId}.${ext}`
  )

  // 返回可能的 URL（客户端需要验证哪个存在）
  return NextResponse.json({
    referenceId,
    possibleUrls,
  })
})
