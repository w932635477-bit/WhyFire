/**
 * RVC 声音模型训练 API
 *
 * POST /api/voice/train
 * 启动 RVC 模型训练任务
 *
 * GET /api/voice/train?taskId=xxx
 * 查询训练状态
 *
 * DELETE /api/voice/train?modelName=xxx
 * 删除模型
 *
 * 使用 RVC (Retrieval-based Voice Conversion) 训练用户声音模型
 * 支持 Mock、自托管、Replicate 三种后端
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getRVCClient,
  getRVCBackend,
  type RVCTrainingRequest,
  type IRVCClient,
} from '@/lib/audio/rvc-client'
import { uploadToOSS, isOSSConfigured } from '@/lib/oss'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// 类型定义
// ============================================================================

interface TrainRequest {
  /** 训练音频 URL（推荐） */
  audioUrl?: string
  /** 模型名称（用户自定义） */
  modelName: string
  /** 训练轮数 */
  epochs?: number
  /** 批量大小 */
  batchSize?: number
}

interface TrainResponse {
  code: number
  data?: {
    taskId?: string
    status?: string
    modelName?: string
    progress?: number
    message?: string
  }
  message?: string
}

// ============================================================================
// API 处理
// ============================================================================

/**
 * POST /api/voice/train
 * 启动 RVC 模型训练
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<TrainResponse>> {
  try {
    const client = getRVCClient()
    const backend = getRVCBackend()

    // 检查服务可用性
    const isAvailable = await client.isAvailable()
    if (!isAvailable) {
      return NextResponse.json({
        code: 503,
        data: {
          status: 'failed',
          message: `RVC 服务不可用。当前后端: ${backend}。请检查服务是否启动。`,
        },
        message: 'RVC 服务不可用',
      }, { status: 503 })
    }

    // 解析请求
    let body: TrainRequest
    let audioFile: File | Blob | null = null
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      audioFile = formData.get('audio') as File | Blob | null
      const audioUrl = formData.get('audioUrl') as string | null
      const modelName = formData.get('modelName') as string
      const epochs = formData.get('epochs') ? parseInt(formData.get('epochs') as string) : undefined
      const batchSize = formData.get('batchSize') ? parseInt(formData.get('batchSize') as string) : undefined

      if (!modelName) {
        return NextResponse.json({
          code: 400,
          data: { status: 'failed' },
          message: '缺少 modelName 参数',
        }, { status: 400 })
      }

      if (audioFile) {
        body = { modelName, epochs, batchSize }
      } else if (audioUrl) {
        body = { audioUrl, modelName, epochs, batchSize }
      } else {
        return NextResponse.json({
          code: 400,
          data: { status: 'failed' },
          message: '缺少音频文件或音频 URL',
        }, { status: 400 })
      }
    } else {
      body = await request.json()
    }

    // 参数验证
    if (!body.modelName) {
      return NextResponse.json({
        code: 400,
        data: { status: 'failed' },
        message: '模型名称不能为空',
      }, { status: 400 })
    }

    // 获取音频 URL
    let audioUrl: string | undefined = body.audioUrl

    // 如果上传了音频文件，需要先上传到 OSS
    if (!audioUrl && audioFile) {
      if (!isOSSConfigured()) {
        return NextResponse.json({
          code: 503,
          data: {
            status: 'failed',
            message: '上传音频需要配置 OSS 存储。',
          },
          message: 'OSS 未配置',
        }, { status: 503 })
      }

      console.log('[RVCTrainAPI] Uploading audio to OSS...')

      const filename = audioFile instanceof File ? audioFile.name : `voice-${Date.now()}.webm`
      const uploadResult = await uploadToOSS(audioFile, filename, {
        folder: 'rvc-training',
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
      console.log(`[RVCTrainAPI] Audio uploaded: ${audioUrl}`)
    }

    if (!audioUrl) {
      return NextResponse.json({
        code: 400,
        data: { status: 'failed' },
        message: '必须提供音频文件或音频 URL',
      }, { status: 400 })
    }

    console.log(`[RVCTrainAPI] Starting training: model=${body.modelName}, backend=${backend}`)

    // 启动训练
    const trainRequest: RVCTrainingRequest = {
      audioUrl,
      modelName: body.modelName,
      epochs: body.epochs || 100,
      batchSize: body.batchSize || 8,
    }

    const result = await client.trainModel(trainRequest)

    if (result.status === 'failed') {
      return NextResponse.json({
        code: 500,
        data: {
          taskId: result.taskId,
          status: 'failed',
          message: result.error || '训练启动失败',
        },
        message: result.error,
      })
    }

    console.log(`[RVCTrainAPI] Training started: taskId=${result.taskId}`)

    return NextResponse.json({
      code: 0,
      data: {
        taskId: result.taskId,
        status: result.status,
        modelName: result.modelName,
        progress: result.progress,
        message: '训练任务已启动',
      },
    })
  } catch (error) {
    console.error('[RVCTrainAPI] 训练失败:', error)

    return NextResponse.json({
      code: 500,
      data: {
        status: 'failed',
        message: error instanceof Error ? error.message : '训练失败',
      },
      message: '训练失败',
    }, { status: 500 })
  }
}

/**
 * GET /api/voice/train
 * 查询训练状态或列出模型
 */
export async function GET(request: NextRequest) {
  try {
    const client = getRVCClient()
    const backend = getRVCBackend()
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const action = searchParams.get('action') || 'status'

    // 检查服务可用性
    const isAvailable = await client.isAvailable()

    if (taskId) {
      // 查询训练状态
      const result = await client.getTrainingStatus(taskId)

      return NextResponse.json({
        code: 0,
        data: {
          taskId: result.taskId,
          status: result.status,
          modelName: result.modelName,
          progress: result.progress,
          error: result.error,
        },
      })
    }

    if (action === 'models') {
      // 列出可用模型
      const models = await client.listModels()

      return NextResponse.json({
        code: 0,
        data: {
          backend,
          available: isAvailable,
          models: models.map(m => ({
            name: m.name,
            path: m.path,
            createdAt: m.createdAt?.toISOString(),
            size: m.size,
          })),
        },
      })
    }

    // 默认返回服务状态
    return NextResponse.json({
      code: 0,
      data: {
        backend,
        available: isAvailable,
        message: isAvailable
          ? `RVC ${backend} 后端已就绪`
          : 'RVC 服务不可用',
      },
    })
  } catch (error) {
    return NextResponse.json({
      code: 500,
      data: {
        status: 'failed',
        message: error instanceof Error ? error.message : '查询失败',
      },
      message: '查询失败',
    }, { status: 500 })
  }
}

/**
 * DELETE /api/voice/train
 * 删除模型
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getRVCClient()

    if (!(await client.isAvailable())) {
      return NextResponse.json({
        code: 503,
        data: { success: false },
        message: 'RVC 服务不可用',
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const modelName = searchParams.get('modelName')

    if (!modelName) {
      return NextResponse.json({
        code: 400,
        data: { success: false },
        message: '缺少 modelName 参数',
      }, { status: 400 })
    }

    await client.deleteModel(modelName)

    return NextResponse.json({
      code: 0,
      data: { success: true },
      message: `模型 ${modelName} 已删除`,
    })
  } catch (error) {
    return NextResponse.json({
      code: 500,
      data: { success: false },
      message: error instanceof Error ? error.message : '删除失败',
    }, { status: 500 })
  }
}
