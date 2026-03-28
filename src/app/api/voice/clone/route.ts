/**
 * 声音克隆 API
 * POST /api/voice/clone
 *
 * 使用 CosyVoice 声音复刻功能克隆用户声音
 *
 * 流程:
 * 1. 用户上传音频（10秒-5分钟）
 * 2. 上传音频到 OSS 获取公网 URL
 * 3. CosyVoice 创建复刻音色（需要公网 URL）
 * 4. 等待审核通过
 * 5. 返回 voice_id，可用于后续方言 TTS
 *
 * API 文档: https://help.aliyun.com/zh/model-studio/cosyvoice-clone-design-api
 *
 * 重要: CosyVoice 声音复刻 API 只支持 url 参数（公网可访问的音频 URL）
 * 不支持 audio_data（Base64 数据），所以需要先上传到 OSS
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCosyVoiceCloneClient } from '@/lib/tts/cosyvoice-clone-client'
import { uploadToOSS, isOSSConfigured } from '@/lib/oss'
import { checkRateLimit } from '@/lib/middleware/auth'
import type { DialectCode } from '@/types/dialect'

// ============================================================================
// 类型定义
// ============================================================================

interface VoiceCloneRequest {
  /** 音频 URL（推荐） */
  audioUrl?: string
  /** 音频数据（Base64） */
  audioData?: string
  /** 方言（用于后续 TTS） */
  dialect?: DialectCode
}

interface VoiceCloneResponse {
  code: number
  data: {
    voiceId?: string
    status: 'created' | 'pending' | 'completed' | 'failed'
    message?: string
  }
  message?: string
}

// ============================================================================
// API 处理
// ============================================================================

/**
 * POST /api/voice/clone
 * 克隆用户声音
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<VoiceCloneResponse>> {
  try {
    // 速率限制（声音克隆资源消耗大，限制更严格）
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    const rateLimit = checkRateLimit(`voice-clone:${clientId}`, 3, 300000)
    if (!rateLimit.allowed) {
      return NextResponse.json({
        code: 429,
        data: { status: 'failed', message: '请求过于频繁，请稍后再试' },
        message: '请求过于频繁',
      }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) }
      })
    }

    // 检查 CosyVoice 服务是否可用
    const client = getCosyVoiceCloneClient()

    if (!client.isConfigured()) {
      return NextResponse.json({
        code: 503,
        data: {
          status: 'failed',
          message: '声音克隆服务暂未启用。请设置 DASHSCOPE_API_KEY 环境变量。',
        },
        message: 'CosyVoice API 未配置',
      }, { status: 503 })
    }

    // 解析请求
    let body: VoiceCloneRequest
    let audioFile: File | Blob | null = null
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // FormData 格式
      const formData = await request.formData()
      audioFile = formData.get('audio') as File | Blob | null
      const audioUrl = formData.get('audioUrl') as string | null
      const dialect = formData.get('dialect') as DialectCode | null

      if (audioFile) {
        body = { dialect: dialect || undefined }
      } else if (audioUrl) {
        body = { audioUrl, dialect: dialect || undefined }
      } else {
        return NextResponse.json({
          code: 400,
          data: { status: 'failed' },
          message: '缺少音频文件或音频 URL',
        }, { status: 400 })
      }
    } else {
      // JSON 格式
      body = await request.json()
    }

    // 获取音频 URL（CosyVoice API 要求公网可访问的 URL）
    let audioUrl: string | undefined = body.audioUrl

    // 如果上传了音频文件，需要先上传到 OSS
    if (!audioUrl && audioFile) {
      // 检查 OSS 是否配置
      if (!isOSSConfigured()) {
        return NextResponse.json({
          code: 503,
          data: {
            status: 'failed',
            message: '声音克隆需要先配置 OSS 存储。请设置 OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET 环境变量。',
          },
          message: 'OSS 未配置',
        }, { status: 503 })
      }

      console.log('[VoiceCloneAPI] Uploading audio to OSS...')

      // 上传音频到 OSS
      const filename = audioFile instanceof File ? audioFile.name : `audio-${Date.now()}.webm`
      const uploadResult = await uploadToOSS(audioFile, filename, {
        folder: 'voice-cloning',
        contentType: audioFile.type || 'audio/webm',
      })

      if (!uploadResult.success || !uploadResult.url) {
        return NextResponse.json({
          code: 500,
          data: {
            status: 'failed',
            message: uploadResult.error || '音频上传失败',
          },
          message: uploadResult.error,
        })
      }

      audioUrl = uploadResult.url
      console.log('[VoiceCloneAPI] Audio uploaded to OSS')
    }

    // 验证参数
    if (!audioUrl) {
      return NextResponse.json({
        code: 400,
        data: { status: 'failed' },
        message: '必须提供音频文件或音频 URL',
      }, { status: 400 })
    }

    // 生成音色前缀（用户唯一标识）
    // CosyVoice API 要求: 仅允许数字和英文字母，不超过10个字符
    // 使用时间戳的36进制表示，截取最后10位确保符合要求
    const prefix = Date.now().toString(36).slice(-10).padStart(6, '0')

    console.log(`[VoiceCloneAPI] Creating voice with prefix: ${prefix}`)

    // 调用 CosyVoice 声音复刻（使用公网 URL）
    const result = await client.createVoice({
      audioUrl,
      prefix,
      targetModel: 'cosyvoice-v3-flash',
      languageHints: ['zh'],
    })

    if (!result.success) {
      return NextResponse.json({
        code: 500,
        data: {
          status: 'failed',
          message: result.error || '声音克隆失败',
        },
        message: result.error,
      })
    }

    console.log(`[VoiceCloneAPI] Voice created: ${result.voiceId}, waiting for review...`)

    // 真实等待审核通过（最长 5 分钟，每 5 秒检查一次）
    const reviewResult = await client.waitForVoiceReady(result.voiceId!, 300000, 5000)

    if (!reviewResult.ready) {
      console.error(`[VoiceCloneAPI] Voice review failed: ${reviewResult.error}`)

      return NextResponse.json({
        code: 500,
        data: {
          voiceId: result.voiceId,
          status: 'failed',
          message: reviewResult.error || '声音审核未通过，请重新录制',
        },
        message: reviewResult.error || '审核失败',
      })
    }

    console.log(`[VoiceCloneAPI] Voice ${result.voiceId} review passed, ready to use!`)

    return NextResponse.json({
      code: 0,
      data: {
        voiceId: result.voiceId,
        referenceAudioId: audioUrl,  // OSS 音频 URL，用于 Seed-VC 零样本克隆
        status: 'completed',
        message: '声音复刻完成，可以使用',
      },
    })
  } catch (error) {
    console.error('[VoiceCloneAPI] 声音克隆失败:', error)

    return NextResponse.json({
      code: 500,
      data: {
        status: 'failed',
        message: error instanceof Error ? error.message : '声音克隆失败',
      },
      message: '声音克隆失败',
    }, { status: 500 })
  }
}

/**
 * GET /api/voice/clone
 * 返回声音克隆服务状态
 */
export async function GET() {
  const client = getCosyVoiceCloneClient()

  return NextResponse.json({
    code: 0,
    data: {
      enabled: client.isConfigured(),
      status: client.isConfigured() ? 'available' : 'unavailable',
      provider: 'cosyvoice',
      message: client.isConfigured()
        ? 'CosyVoice 声音复刻服务已启用'
        : 'CosyVoice 服务暂未配置，请设置 DASHSCOPE_API_KEY',
    },
  })
}

/**
 * DELETE /api/voice/clone
 * 删除已创建的音色
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getCosyVoiceCloneClient()

    if (!client.isConfigured()) {
      return NextResponse.json({
        code: 503,
        data: { success: false },
        message: 'CosyVoice API 未配置',
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const voiceId = searchParams.get('voiceId')

    if (!voiceId) {
      return NextResponse.json({
        code: 400,
        data: { success: false },
        message: '缺少 voiceId 参数',
      }, { status: 400 })
    }

    const result = await client.deleteVoice(voiceId)

    return NextResponse.json({
      code: result.success ? 0 : 500,
      data: { success: result.success },
      message: result.error,
    })
  } catch (error) {
    return NextResponse.json({
      code: 500,
      data: { success: false },
      message: error instanceof Error ? error.message : '删除失败',
    }, { status: 500 })
  }
}
