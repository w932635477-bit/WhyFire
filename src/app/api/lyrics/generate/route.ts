/**
 * 歌词生成 API
 * POST /api/lyrics/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { generateWithClaude } from '@/lib/ai/claude-client'
import {
  buildLyricsPrompt,
  countWords,
  estimateDuration,
} from '@/lib/ai/prompts/lyrics-prompts'
import type { SceneType, DialectType } from '@/types'

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

  // 移除列表式说明（如 "- 使用了..."）
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
interface LyricsGenerateRequest {
  scene: SceneType
  dialect: DialectType
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
}

// 响应类型
interface LyricsGenerateResponse {
  code: number
  data: {
    lyricsId: string
    content: string
    wordCount: number
    estimatedDuration: number
  }
  message?: string
}

/**
 * POST /api/lyrics/generate
 * 生成 Rap 歌词
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<LyricsGenerateResponse>> {
  try {
    // 解析请求体
    const body: LyricsGenerateRequest = await request.json()
    const { scene, dialect, productInfo, funnyInfo, ipInfo, vlogInfo } = body

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
          },
          message: `无效的场景类型: ${scene}，支持的场景: ${validScenes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // 验证语言类型（9种原生方言）
    const validDialects: DialectType[] = [
      'mandarin', 'cantonese', 'sichuan', 'dongbei',
      'wu', 'shaanxi', 'minnan', 'tianjin', 'nanjing'
    ]
    if (!validDialects.includes(dialect)) {
      return NextResponse.json(
        {
          code: 400,
          data: {
            lyricsId: '',
            content: '',
            wordCount: 0,
            estimatedDuration: 0,
          },
          message: `无效的语言类型: ${dialect}，支持的语言: ${validDialects.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // 根据场景提取输入参数
    const promptInputs = extractInputs(scene, productInfo, funnyInfo, ipInfo, vlogInfo)

    // 构建 Prompt
    const prompt = buildLyricsPrompt(scene, dialect, promptInputs)

    // 调用 Claude API 生成歌词
    const rawContent = await generateWithClaude(prompt, {
      maxTokens: 1024,
      temperature: 0.8,
    })

    // 清理歌词内容，移除可能的说明文字
    const content = cleanLyrics(rawContent)

    // 计算字数和估算时长
    const wordCount = countWords(content)
    const estimatedDuration = estimateDuration(wordCount)

    // 生成歌词 ID
    const lyricsId = randomUUID()

    // 返回成功响应
    return NextResponse.json({
      code: 0,
      data: {
        lyricsId,
        content,
        wordCount,
        estimatedDuration,
      },
    })
  } catch (error) {
    console.error('歌词生成失败:', error)

    // 判断是否是环境变量未配置的错误
    const errorMessage =
      error instanceof Error && error.message.includes('EVOLINK_API_KEY')
        ? '服务配置错误: EVOLINK_API_KEY 未配置'
        : '歌词生成失败，请稍后重试'

    return NextResponse.json(
      {
        code: 500,
        data: {
          lyricsId: '',
          content: '',
          wordCount: 0,
          estimatedDuration: 0,
        },
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * 根据场景类型提取输入参数
 */
function extractInputs(
  scene: SceneType,
  productInfo?: LyricsGenerateRequest['productInfo'],
  funnyInfo?: LyricsGenerateRequest['funnyInfo'],
  ipInfo?: LyricsGenerateRequest['ipInfo'],
  vlogInfo?: LyricsGenerateRequest['vlogInfo']
) {
  switch (scene) {
    case 'product':
      return {
        productName: productInfo?.name || '',
        sellingPoints: productInfo?.sellingPoints || [],
      }
    case 'funny':
      return {
        theme: funnyInfo?.theme || '',
        keywords: funnyInfo?.keywords || [],
      }
    case 'ip':
      return {
        ipName: ipInfo?.name || '',
        coreElements: ipInfo?.coreElements || [],
        mood: ipInfo?.mood,
      }
    case 'vlog':
      return {
        activities: vlogInfo?.activities || [],
        location: vlogInfo?.location,
        mood: vlogInfo?.mood,
      }
    default:
      return {}
  }
}
