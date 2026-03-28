/**
 * Rap 生成 API V2
 * 使用 SunoAPI Add Vocals + Seed-VC 方案生成方言 Rap
 *
 * 3 步流程：
 * 1. 歌词生成（Claude API，根据 BGM 时长约束字数）
 * 2. SunoAPI Add Vocals（在用户 BGM 上生成人声，节拍自动匹配）
 * 3. Seed-VC 零样本音色替换 → 上传 OSS
 *
 * POST /api/rap/generate-v2
 * Body: { userId, userDescription, dialect, referenceAudioId, bgmId?, lyrics? }
 * Response: { taskId, status, audioUrl?, duration?, lyrics?, dialect? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRapGenerator, type GenerationProgress } from '@/lib/services/rap-generator'
import { getBGMById, listAllBGM } from '@/lib/music/bgm-library'
import { withOptionalAuth, checkRateLimit } from '@/lib/middleware/auth'
import type { DialectCode } from '@/types/dialect'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RapGenerateV2Request {
  /** 用户 ID */
  userId: string
  /** 用户描述（职业、爱好、想说的） */
  userDescription: string
  /** 方言 */
  dialect: DialectCode
  /** 用户参考音频 ID（Seed-VC 零样本克隆） */
  referenceAudioId: string
  /** BGM ID（从 BGM 库选择，可选） */
  bgmId?: string
  /** 歌词（可选，如果不提供则自动生成） */
  lyrics?: string
}

interface RapGenerateV2Response {
  code: number
  data?: {
    taskId: string
    status: string
    audioUrl?: string
    duration?: number
    lyrics?: string
    dialect?: DialectCode
    progress?: GenerationProgress
  }
  message?: string
}

/**
 * Rap 生成 API（受认证保护）
 *
 * 认证方式：
 * - 开发环境：跳过认证
 * - 生产环境：需要 X-API-Key 或 Authorization: Bearer <token>
 *
 * 环境变量配置：
 * - API_KEYS: 逗号分隔的 API Keys
 * - BEARER_TOKENS: 逗号分隔的 Bearer Tokens
 */
export const POST = withOptionalAuth(async (request: NextRequest): Promise<NextResponse<RapGenerateV2Response>> => {
  // 速率限制：每用户每分钟 5 次 Rap 生成请求
  const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  const rateLimit = checkRateLimit(`rap:${clientId}`, 5, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { code: 429, message: '请求过于频繁，请稍后再试', data: null as any },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    )
  }
  try {
    const body: RapGenerateV2Request = await request.json()

    // 参数验证
    if (!body.userId) {
      return NextResponse.json(
        { code: 400, message: '用户 ID 不能为空' },
        { status: 400 }
      )
    }

    if (!body.dialect) {
      return NextResponse.json(
        { code: 400, message: '方言不能为空' },
        { status: 400 }
      )
    }

    // 默认参考音频（用于跳过声音克隆的用户）
    const DEFAULT_REFERENCE_AUDIO = 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/default-voice/reference-male-1.mp3'

    if (!body.referenceAudioId) {
      body.referenceAudioId = DEFAULT_REFERENCE_AUDIO
      console.log('[API V2] No referenceAudioId provided, using default voice')
    }

    // 验证 bgmId（如果提供）
    if (body.bgmId) {
      const bgm = getBGMById(body.bgmId)
      if (!bgm) {
        const availableBgmIds = listAllBGM().map(b => b.id)
        return NextResponse.json(
          {
            code: 400,
            message: `Invalid bgmId: ${body.bgmId}. Available: ${availableBgmIds.join(', ') || 'none'}`
          },
          { status: 400 }
        )
      }
      console.log(`[API V2] Using BGM: ${body.bgmId}`)
    }

    console.log(`[API V2] Rap 生成请求: userId=${body.userId}, dialect=${body.dialect}, referenceAudioId=${body.referenceAudioId}`)

    // 获取生成器
    const generator = getRapGenerator()

    // 检查服务状态
    const services = await generator.checkServices()
    console.log(`[API V2] 服务状态: SunoAPI=${services.sunoApi}, SeedVC=${services.seedvc}`)

    if (!services.sunoApi) {
      return NextResponse.json(
        { code: 503, message: 'SunoAPI 服务不可用，请配置 SUNOAPI_API_KEY' },
        { status: 503 }
      )
    }

    // 进度日志
    const onProgress = (progress: GenerationProgress) => {
      console.log(`[API V2] 进度: [${progress.stepName}] ${progress.progress}% - ${progress.message || ''}`)
    }

    // 执行生成
    const result = await generator.generate(
      {
        userId: body.userId,
        userDescription: body.userDescription || '',
        dialect: body.dialect,
        referenceAudioId: body.referenceAudioId,
        bgmId: body.bgmId,
        lyrics: body.lyrics,
      },
      onProgress
    )

    console.log(`[API V2] 生成完成: taskId=${result.taskId}, duration=${result.duration}s`)

    return NextResponse.json({
      code: 0,
      data: {
        taskId: result.taskId,
        status: 'completed',
        audioUrl: result.audioUrl,
        duration: result.duration,
        lyrics: result.lyrics,
        dialect: result.dialect,
      },
    })
  } catch (error) {
    console.error('[API V2] Rap 生成失败:', error)

    return NextResponse.json(
      {
        code: 500,
        message: error instanceof Error ? error.message : '生成失败',
      },
      { status: 500 }
    )
  }
})

/**
 * GET /api/rap/generate-v2?action=bgm-list
 * GET /api/rap/generate-v2?action=services
 * 查询 BGM 列表或检查服务状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'services'

    // BGM 列表查询
    if (action === 'bgm-list') {
      const bgmList = listAllBGM().map(bgm => ({
        id: bgm.id,
        bpm: bgm.bpm,
        styleTags: bgm.styleTags,
        energy: bgm.energy,
        mood: bgm.mood,
        duration: bgm.duration,
      }))

      return NextResponse.json({
        code: 0,
        data: {
          bgmList,
          count: bgmList.length,
        },
      })
    }

    // 服务状态查询
    const generator = getRapGenerator()
    const services = await generator.checkServices()

    return NextResponse.json({
      code: 0,
      data: {
        services: {
          sunoApi: {
            available: services.sunoApi,
            name: 'SunoAPI Add Vocals',
            description: '在自定义 BGM 上生成人声',
          },
          seedvc: {
            available: services.seedvc,
            name: 'Seed-VC',
            description: '零样本声音克隆',
          },
        },
        allAvailable: services.sunoApi && services.seedvc,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        message: error instanceof Error ? error.message : '检查服务状态失败',
      },
      { status: 500 }
    )
  }
}
