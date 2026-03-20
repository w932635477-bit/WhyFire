/**
 * 歌词生成 Prompt 模板
 */

import type { SceneType, DialectType } from '@/types'

interface PromptContext {
  scene: SceneType
  dialect: DialectType
  productName?: string
  sellingPoints?: string[]
  theme?: string
  keywords?: string[]
  ipName?: string
  coreElements?: string[]
  activities?: string[]
  mood?: string
  location?: string
}

/**
 * 语言描述映射
 */
const DIALECT_DESCRIPTIONS: Record<DialectType, string> = {
  mandarin: 'Mandarin Chinese (普通话)',
  cantonese: 'Cantonese (粤语)',
  english: 'English',
}

/**
 * 场景类型描述映射
 */
const SCENE_DESCRIPTIONS: Record<SceneType, string> = {
  product: 'Product Promotion',
  funny: 'Funny/Viral',
  ip: 'IP Mashup',
  vlog: 'Daily Vlog',
}

/**
 * 构建产品推广场景 Prompt
 */
function buildProductPrompt(ctx: PromptContext): string {
  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect]
  const productName = ctx.productName || 'Product'
  const sellingPoints = ctx.sellingPoints?.join(', ') || ''

  if (ctx.dialect === 'english') {
    return `You are a professional Rap lyricist.

【Task】Create a 30-second Rap lyrics for product promotion

Language: English
Product: ${productName}
Selling Points: ${sellingPoints}

Requirements:
- Catchy rhythm, natural rhyming
- Naturally incorporate product selling points
- Marketing appeal, memorable
- About 80-120 words

【IMPORTANT】Output ONLY the lyrics, no explanations or descriptions.`
  }

  return `你是专业的Rap歌词创作专家。

【任务】创作30秒Rap歌词

场景: 产品推广
语言: ${dialectDesc}
产品: ${productName}
卖点: ${sellingPoints}

要求:
- 歌词有节奏感，押韵自然
- ${ctx.dialect === 'cantonese' ? '使用粤语俚语，港式风格' : '接地气'}
- 自然融入产品卖点
- 约100-150字

【重要】只输出歌词，不要任何解释、说明或分析。`
}

/**
 * 构建搞笑洗脑场景 Prompt
 */
function buildFunnyPrompt(ctx: PromptContext): string {
  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect]
  const theme = ctx.theme || 'Daily Life'
  const keywords = ctx.keywords?.join(', ') || ''

  if (ctx.dialect === 'english') {
    return `You are a professional Rap lyricist.

【Task】Create a 30-second funny/viral Rap lyrics

Language: English
Theme: ${theme}
Keywords: ${keywords}

Requirements:
- Viral, catchy, humorous
- Use internet memes/slang if appropriate
- Exaggerated and entertaining
- About 80-120 words

【IMPORTANT】Output ONLY the lyrics, no explanations or descriptions.`
  }

  return `你是专业的Rap歌词创作专家。

【任务】创作30秒搞笑Rap歌词

场景: 搞笑洗脑
语言: ${dialectDesc}
主题: ${theme}
关键词: ${keywords}

要求:
- 魔性洗脑，押韵自然
- ${ctx.dialect === 'cantonese' ? '粤语俚语，港式幽默' : '接地气，有网络梗'}
- 夸张幽默
- 约100-150字

【重要】只输出歌词，不要任何解释、说明或分析。`
}

/**
 * 构建 IP 混剪场景 Prompt
 */
function buildIPPrompt(ctx: PromptContext): string {
  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect]
  const ipName = ctx.ipName || 'IP'
  const coreElements = ctx.coreElements?.join(', ') || ''
  const mood = ctx.mood || 'Epic'

  if (ctx.dialect === 'english') {
    return `You are a professional Rap lyricist.

【Task】Create a 30-second Rap lyrics for IP/Brand mashup

Language: English
IP/Brand: ${ipName}
Core Elements: ${coreElements}
Mood: ${mood}

Requirements:
- ${mood} and powerful
- Resonate with fans
- Stay true to the IP's essence
- About 80-120 words

【IMPORTANT】Output ONLY the lyrics, no explanations or descriptions.`
  }

  return `你是专业的Rap歌词创作专家。

【任务】创作30秒Rap歌词用于IP混剪

场景: IP混剪
语言: ${dialectDesc}
IP名称: ${ipName}
核心元素: ${coreElements}
风格: ${mood}

要求:
- ${mood}燃炸，押韵自然
- ${ctx.dialect === 'cantonese' ? '港式风格' : ''}
- 符合IP调性，有粉丝共鸣
- 约100-150字

【重要】只输出歌词，不要任何解释、说明或分析。`
}

/**
 * 构建日常 Vlog 场景 Prompt
 */
function buildVlogPrompt(ctx: PromptContext): string {
  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect]
  const activities = ctx.activities?.join(', ') || ''
  const location = ctx.location || ''
  const mood = ctx.mood || 'Chill'

  if (ctx.dialect === 'english') {
    return `You are a professional Rap lyricist.

【Task】Create a 30-second Rap lyrics for daily vlog

Language: English
Activities: ${activities}
Location: ${location || 'Unknown'}
Mood: ${mood}

Requirements:
- Lifestyle-focused, relatable
- ${mood} and casual vibe
- Authentic and personal
- About 80-120 words

【IMPORTANT】Output ONLY the lyrics, no explanations or descriptions.`
  }

  return `你是专业的Rap歌词创作专家。

【任务】创作30秒Rap歌词用于日常Vlog

场景: 日常Vlog
语言: ${dialectDesc}
活动: ${activities}
地点: ${location}
心情: ${mood}

要求:
- 生活化，押韵自然
- ${ctx.dialect === 'cantonese' ? '粤语日常表达' : '真实接地气'}
- 轻松愉快
- 约100-150字

【重要】只输出歌词，不要任何解释、说明或分析。`
}

/**
 * 根据场景生成歌词 Prompt
 */
export function buildLyricsPrompt(
  scene: SceneType,
  dialect: DialectType,
  inputs: {
    productName?: string
    sellingPoints?: string[]
    theme?: string
    keywords?: string[]
    ipName?: string
    coreElements?: string[]
    activities?: string[]
    mood?: string
    location?: string
  }
): string {
  const ctx: PromptContext = {
    scene,
    dialect,
    ...inputs,
  }

  switch (scene) {
    case 'product':
      return buildProductPrompt(ctx)
    case 'funny':
      return buildFunnyPrompt(ctx)
    case 'ip':
      return buildIPPrompt(ctx)
    case 'vlog':
      return buildVlogPrompt(ctx)
    default:
      return buildVlogPrompt(ctx)
  }
}

/**
 * 计算歌词字数（去除标点和空格）
 */
export function countWords(lyrics: string): number {
  // 去除换行、空格和标点
  const cleanText = lyrics.replace(/[\s\n\r\p{P}]/gu, '')
  return cleanText.length
}

/**
 * 估算歌词演唱时长（秒）
 * 平均每秒 3-4 个字，考虑停顿
 */
export function estimateDuration(wordCount: number): number {
  // Rap 语速较快，约每秒 4-5 字
  const wordsPerSecond = 4.5
  const duration = Math.ceil(wordCount / wordsPerSecond)
  // 限制在 20-60 秒之间
  return Math.max(20, Math.min(60, duration))
}
