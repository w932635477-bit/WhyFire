/**
 * 爆款歌词生成 API
 * POST /api/lyrics/generate-v2
 * 基于《八方来财》《野狼disco》爆款分析 + 节日/热点/热梗融合
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { checkRateLimit } from '@/lib/middleware/auth'
import { generateWithClaude } from '@/lib/ai/claude-client'
import { buildViralLyricsPrompt, countWords, estimateDuration } from '@/lib/ai/prompts/viral-lyrics-prompts'
import { getTimeContext, getTrendingService } from '@/lib/ai/context'
import { getBGMById } from '@/lib/music/bgm-library'
import type { SceneType } from '@/types'
import type { DialectCode } from '@/types/dialect'

/**
 * 清理歌词内容，移除可能的说明文字
 */
function cleanLyrics(rawContent: string): string {
  let content = rawContent

  // 移除常见的前缀说明
  content = content.replace(/^以下是[^：]*：?\s*/i, '')
  content = content.replace(/^这是[^：]*：?\s*/i, '')
  content = content.replace(/^歌词[是为][^：]*：?\s*/i, '')
  content = content.replace(/^好的[，,]?\s*/i, '')
  content = content.replace(/^好的，这是[^：]*：?\s*/i, '')

  // 移除列表式说明
  content = content.replace(/^[\-\•\*]\s*[^。\n]{5,50}\n/gm, '')

  // 移除时间戳前缀 [00:00] 等
  content = content.replace(/^\[\d{2}:\d{2}\]\s*/gm, '')

  // 移除末尾的分析说明
  const analysisPatterns = [
    /\n\n[（(]?注[意释][^）)]*[）)]?[\s\S]*$/i,
    /\n\n[（(]?说明[^）)]*[）)]?[\s\S]*$/i,
    /\n\n[（(]?特点[^）)]*[）)]?[\s\S]*$/i,
    /\n\n[（(]?押韵[^）)]*[）)]?[\s\S]*$/i,
    /\n\n[（(]?风格[^）)]*[）)]?[\s\S]*$/i,
    /\n\n---+[\s\S]*$/i,
    /\n\n\*{3,}[\s\S]*$/i,
  ]

  for (const pattern of analysisPatterns) {
    content = content.replace(pattern, '')
  }

  // 移除空行过多的情况
  content = content.replace(/\n{3,}/g, '\n\n')

  // 去除首尾空白
  content = content.trim()

  return content
}

// 请求类型
interface LyricsGenerateV2Request {
  scene: SceneType
  dialect: DialectCode
  productInfo?: {
    name: string
    sellingPoints: string[]
  }
  funnyInfo?: {
    theme: string
    keywords?: string[]
  }
  ipInfo?: {
    name: string
    coreElements: string[]
    mood?: string
  }
  vlogInfo?: {
    activities: string[]
    location?: string
    mood?: string
  }
  // 时效性选项
  timeOptions?: {
    includeFestival?: boolean
    includeTrending?: boolean
    includeMemes?: boolean
  }
  /** UI Beat ID，用于计算歌词时长约束 */
  bgmId?: string
}

// 响应类型
interface LyricsGenerateV2Response {
  code: number
  data: {
    lyricsId: string
    content: string
    wordCount: number
    estimatedDuration: number
    meta: {
      festival?: {
        id: string
        name: string
      }
      trendingTopics?: string[]
      memes?: string[]
    }
  }
  message?: string
}

/**
 * POST /api/lyrics/generate-v2
 * 生成 Rap 歌词（增强版）
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<LyricsGenerateV2Response>> {
  try {
    // 速率限制
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    const rateLimit = checkRateLimit(`lyrics:${clientId}`, 5, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          code: 429,
          data: { lyricsId: '', content: '', wordCount: 0, estimatedDuration: 0, meta: {} },
          message: '请求过于频繁，请稍后再试',
        },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
      )
    }

    // 解析请求体
    const body: LyricsGenerateV2Request = await request.json()
    const {
      scene,
      dialect,
      productInfo,
      funnyInfo,
      ipInfo,
      vlogInfo,
      timeOptions = {},
      bgmId: requestBgmId,
    } = body

    // 验证必填字段
    if (!scene || !dialect) {
      return NextResponse.json(
        {
          code: 400,
          data: {
            lyricsId: '',
            content: '',
            wordCount: 0,
            estimatedDuration: 0,
            meta: {},
          },
          message: '缺少必填字段: scene 或 dialect',
        },
        { status: 400 }
      )
    }

    // 验证场景类型
    const validScenes: SceneType[] = ['product', 'funny', 'ip', 'vlog']
    if (!validScenes.includes(scene)) {
      return NextResponse.json(
        {
          code: 400,
          data: {
            lyricsId: '',
            content: '',
            wordCount: 0,
            estimatedDuration: 0,
            meta: {},
          },
          message: `无效的场景类型: ${scene}`,
        },
        { status: 400 }
      )
    }

    // 根据场景构建用户描述
    const description = composeDescription(scene, body)

    // 获取时效性上下文
    const includeFestival = timeOptions.includeFestival !== false
    const includeTrending = timeOptions.includeTrending !== false
    const includeMemes = timeOptions.includeMemes !== false

    const timeContext = includeFestival ? getTimeContext() : undefined
    const trendingService = getTrendingService()

    // 获取热点和热梗
    let trendingTopics: Awaited<ReturnType<typeof trendingService.getTrendingTopics>> | undefined = undefined
    let memes: Awaited<ReturnType<typeof trendingService.getInternetMemes>> | undefined = undefined

    if (includeTrending) {
      try {
        trendingTopics = await trendingService.getTrendingTopics({ limit: 3 })
      } catch (e) {
        console.warn('[LyricsAPI] Failed to get trending topics:', e)
      }
    }

    if (includeMemes) {
      try {
        memes = await trendingService.getInternetMemes()
      } catch (e) {
        console.warn('[LyricsAPI] Failed to get memes:', e)
      }
    }

    // 计算 BGM 时长约束
    let bgmDurationSeconds: number | undefined
    if (requestBgmId) {
      // 将 UI Beat ID 转换为 BGM Library ID
      const BEAT_TO_BGM: Record<string, string> = {
        'beat-1': 'fortune-flow',
        'beat-2': 'karma-dark',
        'beat-3': 'apt-remix',
        'beat-4': 'brazilian-phonk',
        'beat-5': 'warm-gray',
        'beat-6': 'wonderful-01',
      }
      const libraryId = requestBgmId.startsWith('beat-')
        ? BEAT_TO_BGM[requestBgmId]
        : requestBgmId
      if (libraryId) {
        const bgm = getBGMById(libraryId)
        if (bgm) {
          bgmDurationSeconds = bgm.duration
          console.log(`[LyricsAPI] BGM 时长约束: ${bgmDurationSeconds}s (${libraryId})`)
        }
      }
    }

    // 构建爆款歌词 Prompt
    const prompt = buildViralLyricsPrompt({
      description,
      dialect,
      timeContext,
      trendingTopics,
      memes,
      bgmDurationSeconds,
    })

    // 调用 Claude API 生成歌词
    const rawContent = await generateWithClaude(prompt, {
      maxTokens: 2048,
      temperature: 0.9,
    })

    // 清理歌词内容
    const content = cleanLyrics(rawContent)

    // 计算字数和估算时长
    const wordCount = countWords(content)
    const estimatedDuration = estimateDuration(wordCount)

    // 生成歌词 ID
    const lyricsId = randomUUID()

    // 构建元信息
    const meta: LyricsGenerateV2Response['data']['meta'] = {}

    if (timeContext?.currentFestival) {
      meta.festival = {
        id: timeContext.currentFestival.id,
        name: timeContext.currentFestival.name,
      }
    }

    if (trendingTopics?.length) {
      meta.trendingTopics = trendingTopics.map(t => t.title)
    }

    if (memes?.length) {
      meta.memes = memes.slice(0, 5).map(m => m.text)
    }

    // 返回成功响应
    return NextResponse.json({
      code: 0,
      data: {
        lyricsId,
        content,
        wordCount,
        estimatedDuration,
        meta,
      },
    })
  } catch (error) {
    console.error('歌词生成失败:', error)
    console.error('错误详情:', error instanceof Error ? error.message : String(error))
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'N/A')

    const errorMessage =
      error instanceof Error && error.message.includes('EVOLINK_API_KEY')
        ? '服务配置错误: EVOLINK_API_KEY 未配置'
        : error instanceof Error ? error.message : '歌词生成失败，请稍后重试'

    return NextResponse.json(
      {
        code: 500,
        data: {
          lyricsId: '',
          content: '',
          wordCount: 0,
          estimatedDuration: 0,
          meta: {},
        },
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * 根据场景类型构建用户描述字符串
 */
function composeDescription(
  scene: SceneType,
  body: LyricsGenerateV2Request
): string {
  const parts: string[] = []

  switch (scene) {
    case 'product':
      if (body.productInfo?.name) parts.push(`推广产品：${body.productInfo.name}`)
      if (body.productInfo?.sellingPoints?.length) parts.push(`卖点：${body.productInfo.sellingPoints.join('、')}`)
      break
    case 'funny':
      if (body.funnyInfo?.theme) parts.push(body.funnyInfo.theme)
      if (body.funnyInfo?.keywords?.length) parts.push(body.funnyInfo.keywords.join('、'))
      break
    case 'ip':
      if (body.ipInfo?.name) parts.push(`IP：${body.ipInfo.name}`)
      if (body.ipInfo?.coreElements?.length) parts.push(`核心元素：${body.ipInfo.coreElements.join('、')}`)
      break
    case 'vlog':
      if (body.vlogInfo?.activities?.length) parts.push(`活动：${body.vlogInfo.activities.join('、')}`)
      if (body.vlogInfo?.location) parts.push(`地点：${body.vlogInfo.location}`)
      break
  }

  return parts.join('，') || '日常生活'
}
