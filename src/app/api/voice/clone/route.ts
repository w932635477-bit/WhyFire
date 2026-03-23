/**
 * 声音克隆 API
 * POST /api/voice/clone
 *
 * 调用 GPT-SoVITS 进行用户声音克隆
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGPTSoVITSClient } from '@/lib/voice'
import type { DialectCode } from '@/types/dialect'

// 请求类型
interface VoiceCloneRequest {
  audio: File | Blob
  dialect: DialectCode
}

// 响应类型
interface VoiceCloneResponse {
  code: number
  data: {
    voiceId?: string
    taskId?: string
    status: 'completed' | 'failed' | 'processing'
    message?: string
  }
  message?: string
}

/**
 * POST /api/voice/clone
 * 克隆用户声音
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<VoiceCloneResponse>> {
  try {
    // 检查 GPT-SoVITS 服务是否可用
    const client = getGPTSoVITSClient()

    if (!client.isConfigured()) {
      return NextResponse.json({
        code: 503,
        data: {
          status: 'failed',
          message: '声音克隆服务暂未启用。请稍后再试或使用默认音色。',
        },
        message: 'GPT-SoVITS API 未配置',
      }, { status: 503 })
    }

    // 解析 FormData
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | Blob | null
    const dialect = formData.get('dialect') as DialectCode | null

    if (!audioFile) {
      return NextResponse.json({
        code: 400,
        data: { status: 'failed' },
        message: '缺少音频文件',
      }, { status: 400 })
    }

    // 生成用户 ID（实际应该从认证系统获取）
    const userId = `user-${Date.now()}`

    // 转换音频为 Base64
    const arrayBuffer = await audioFile.arrayBuffer()
    const base64Audio = Buffer.from(arrayBuffer).toString('base64')

    // 调用 GPT-SoVITS 客户端
    const result = await client.cloneVoice({
      audioData: base64Audio,
      userId,
      voiceName: `voice-${Date.now()}`,
      duration: 60, // 假设 60 秒
    })

    if (result.status === 'failed') {
      return NextResponse.json({
        code: 500,
        data: {
          status: 'failed',
          message: result.error || '声音克隆失败',
        },
        message: result.error,
      })
    }

    return NextResponse.json({
      code: 0,
      data: {
        voiceId: result.voiceId,
        taskId: result.taskId,
        status: result.status === 'completed' ? 'completed' : 'processing',
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
  const client = getGPTSoVITSClient()

  return NextResponse.json({
    code: 0,
    data: {
      enabled: client.isConfigured(),
      status: client.isConfigured() ? 'available' : 'unavailable',
      message: client.isConfigured()
        ? 'GPT-SoVITS 声音克隆服务已启用'
        : 'GPT-SoVITS 服务暂未配置',
    },
  })
}
