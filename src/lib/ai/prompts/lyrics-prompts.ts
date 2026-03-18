/**
 * 歌词生成 Prompt 模板
 */

import type { SceneType, DialectType } from '@/types'
import {
  buildDongbeiProductPrompt,
  buildDongbeiFunnyPrompt,
  buildDongbeiIPPrompt,
  buildDongbeiVlogPrompt,
} from './dialect-dongbei'
import {
  buildSichuanProductPrompt,
  buildSichuanFunnyPrompt,
  buildSichuanIPPrompt,
  buildSichuanVlogPrompt,
} from './dialect-sichuan'

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
 * 方言描述映射
 */
const DIALECT_DESCRIPTIONS: Record<DialectType, string> = {
  mandarin: '普通话',
  cantonese: '粤语（广东话），带有港式风味',
  dongbei: '东北话，带有东北方言特色',
  sichuan: '四川话，带有川渝方言特色',
}

/**
 * 场景类型描述映射
 */
const SCENE_DESCRIPTIONS: Record<SceneType, string> = {
  product: '产品推广',
  funny: '搞笑洗脑',
  ip: 'IP混剪',
  vlog: '日常Vlog',
}

/**
 * 构建产品推广场景 Prompt
 */
function buildProductPrompt(ctx: PromptContext): string {
  // 使用专门的东北话 Prompt
  if (ctx.dialect === 'dongbei') {
    return buildDongbeiProductPrompt({
      name: ctx.productName || '产品',
      sellingPoints: ctx.sellingPoints || [],
    })
  }

  // 使用专门的四川话 Prompt
  if (ctx.dialect === 'sichuan') {
    return buildSichuanProductPrompt({
      name: ctx.productName || '产品',
      sellingPoints: ctx.sellingPoints || [],
    })
  }

  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect]
  const productName = ctx.productName || '产品'
  const sellingPoints = ctx.sellingPoints?.join('、') || ''

  return `你是一位专业的 Rap 歌词创作专家。请根据以下信息创作一段 30 秒的 Rap 歌词：

场景: 产品推广
方言: ${dialectDesc}
产品: ${productName}
卖点: ${sellingPoints}

要求:
- 歌词要有节奏感，适合 Rap 演唱，押韵自然
- ${ctx.dialect === 'cantonese' ? '使用粤语俚语和表达方式' : '语言风格接地气'}
- ${ctx.dialect === 'cantonese' ? '参考香港 Rap 的风格' : ''}
- 自然融入产品卖点，不要生硬广告感
- 风格${ctx.dialect === 'cantonese' ? '港式' : ''}幽默/洗脑/好记
- 字数约 100-150 字
- 分成 2-3 段，每段 4-6 行

直接输出歌词内容，不要包含其他说明。`
}

/**
 * 构建搞笑洗脑场景 Prompt
 */
function buildFunnyPrompt(ctx: PromptContext): string {
  // 使用专门的东北话 Prompt
  if (ctx.dialect === 'dongbei') {
    return buildDongbeiFunnyPrompt({
      theme: ctx.theme || '日常生活',
      keywords: ctx.keywords || [],
    })
  }

  // 使用专门的四川话 Prompt
  if (ctx.dialect === 'sichuan') {
    return buildSichuanFunnyPrompt({
      theme: ctx.theme || '日常生活',
      keywords: ctx.keywords || [],
    })
  }

  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect]
  const theme = ctx.theme || '日常生活'
  const keywords = ctx.keywords?.join('、') || ''

  return `你是一位专业的 Rap 歌词创作专家。请根据以下信息创作一段 30 秒的搞笑 Rap 歌词：

场景: 搞笑洗脑
方言: ${dialectDesc}
主题: ${theme}
关键词: ${keywords}

要求:
- 歌词要有节奏感，魔性洗脑，押韵自然
- ${ctx.dialect === 'cantonese' ? '使用粤语俚语和表达方式，港式幽默' : '接地气，有网络梗'}
- 夸张、幽默、让人听了会笑
- 字数约 100-150 字
- 分成 2-3 段，每段 4-6 行

直接输出歌词内容，不要包含其他说明。`
}

/**
 * 构建 IP 混剪场景 Prompt
 */
function buildIPPrompt(ctx: PromptContext): string {
  // 使用专门的东北话 Prompt
  if (ctx.dialect === 'dongbei') {
    return buildDongbeiIPPrompt({
      ipName: ctx.ipName || 'IP',
      coreElements: ctx.coreElements || [],
      mood: ctx.mood || '酷炫',
    })
  }

  // 使用专门的四川话 Prompt
  if (ctx.dialect === 'sichuan') {
    return buildSichuanIPPrompt({
      ipName: ctx.ipName || 'IP',
      coreElements: ctx.coreElements || [],
      mood: ctx.mood || '酷炫',
    })
  }

  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect]
  const ipName = ctx.ipName || 'IP'
  const coreElements = ctx.coreElements?.join('、') || ''
  const mood = ctx.mood || '酷炫'

  return `你是一位专业的 Rap 歌词创作专家。请根据以下信息创作一段 30 秒的 Rap 歌词：

场景: IP混剪
方言: ${dialectDesc}
IP名称: ${ipName}
核心元素: ${coreElements}
风格: ${mood}

要求:
- 歌词要有节奏感，${mood}燃炸，押韵自然
- ${ctx.dialect === 'cantonese' ? '使用粤语表达，港式风格' : ''}
- 符合 IP 调性，有粉丝共鸣感
- 情感真挚或热血
- 字数约 100-150 字
- 分成 2-3 段，每段 4-6 行

直接输出歌词内容，不要包含其他说明。`
}

/**
 * 构建日常 Vlog 场景 Prompt
 */
function buildVlogPrompt(ctx: PromptContext): string {
  // 使用专门的东北话 Prompt
  if (ctx.dialect === 'dongbei') {
    return buildDongbeiVlogPrompt({
      activities: ctx.activities || ['日常生活'],
      location: ctx.location || '',
      mood: ctx.mood || '轻松',
    })
  }

  // 使用专门的四川话 Prompt
  if (ctx.dialect === 'sichuan') {
    return buildSichuanVlogPrompt({
      activities: ctx.activities || ['日常生活'],
      location: ctx.location || '',
      mood: ctx.mood || '轻松',
    })
  }

  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect]
  const activities = ctx.activities?.join('、') || '日常生活'
  const location = ctx.location || ''
  const mood = ctx.mood || '轻松'

  return `你是一位专业的 Rap 歌词创作专家。请根据以下信息创作一段 30 秒的 Rap 歌词：

场景: 日常Vlog
方言: ${dialectDesc}
活动: ${activities}
地点: ${location}
心情: ${mood}

要求:
- 歌词要有节奏感，生活化，押韵自然
- ${ctx.dialect === 'cantonese' ? '使用粤语俚语，港式日常表达' : '真实、接地气'}
- 轻松愉快，有代入感
- 字数约 100-150 字
- 分成 2-3 段，每段 4-6 行

直接输出歌词内容，不要包含其他说明。`
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
