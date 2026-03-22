/**
 * 歌词生成 Prompt 模板
 */

import type { SceneType, DialectType } from '@/types'
import {
  getSceneHumorGuide,
  getSceneHumorGuideEnglish,
  getSceneExample,
} from './humor-techniques'

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
  sichuan: 'Sichuan Dialect (四川话)',
  dongbei: 'Northeastern Mandarin (东北话)',
  shandong: 'Shandong Dialect (山东话)',
  henan: 'Henan Dialect (河南话)',
  shaanxi: 'Shaanxi Dialect (陕西话)',
  lanyin: 'Lanyin Mandarin (兰银官话)',
  jianghuai: 'Jianghuai Mandarin (江淮官话)',
  xinan: 'Southwestern Mandarin (西南官话)',
  jiaoliao: 'Jiaoliao Mandarin (胶辽官话)',
  zhongyuan: 'Central Plains Mandarin (中原官话)',
  wu: 'Wu Dialect (吴语)',
  minnan: 'Min Nan Dialect (闽南语)',
  hakka: 'Hakka Dialect (客家话)',
  xiang: 'Xiang Dialect (湘语)',
  gan: 'Gan Dialect (赣语)',
  jin: 'Jin Dialect (晋语)',
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
  const humorGuide = getSceneHumorGuide('product')
  const example = getSceneExample('product', ctx.dialect === 'english' ? 'english' : 'chinese')

  if (ctx.dialect === 'english') {
    const humorGuideEn = getSceneHumorGuideEnglish('product')
    return `You are a professional Rap lyricist specializing in humorous, catchy product promotion.

【Task】Create a 30-second Rap lyrics for product promotion

Language: English
Product: ${productName}
Selling Points: ${sellingPoints}

【Humor Techniques to Use】
${humorGuideEn}

【Quality Requirements】
- Use at least 2-3 humor techniques from above
- Include 1-2 "golden lines" (memorable, shareable quotes)
- Natural rhythm and rhyming
- Naturally incorporate selling points without feeling like a hard ad
- About 80-120 words

【Example for Reference】
${example}

【IMPORTANT】Output ONLY the lyrics, no explanations or descriptions.`
  }

  return `你是专业的Rap歌词创作专家，擅长用幽默搞笑的方式做产品推广。

【任务】创作30秒Rap歌词

场景: 产品推广
语言: ${dialectDesc}
产品: ${productName}
卖点: ${sellingPoints}

【搞笑技巧指南】
${humorGuide}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- 押韵自然，节奏感强
- 自然融入产品卖点，不要让广告感太重
- 约100-150字

【示例参考】
${example}

【重要】只输出歌词，不要任何解释、说明或分析。`
}

/**
 * 构建搞笑洗脑场景 Prompt
 */
function buildFunnyPrompt(ctx: PromptContext): string {
  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect]
  const theme = ctx.theme || 'Daily Life'
  const keywords = ctx.keywords?.join(', ') || ''
  const humorGuide = getSceneHumorGuide('funny')
  const example = getSceneExample('funny', ctx.dialect === 'english' ? 'english' : 'chinese')

  if (ctx.dialect === 'english') {
    const humorGuideEn = getSceneHumorGuideEnglish('funny')
    return `You are a professional Rap lyricist specializing in viral, comedic content.

【Task】Create a 30-second funny/viral Rap lyrics

Language: English
Theme: ${theme}
Keywords: ${keywords}

【Humor Techniques to Use】
${humorGuideEn}

【Quality Requirements】
- Use at least 2-3 humor techniques from above
- Include 1-2 "golden lines" (memorable, shareable quotes)
- Viral potential, catchy, humorous
- Use internet memes/slang if appropriate
- Exaggerated and entertaining
- About 80-120 words

【Example for Reference】
${example}

【IMPORTANT】Output ONLY the lyrics, no explanations or descriptions.`
  }

  return `你是专业的Rap歌词创作专家，擅长创作魔性洗脑、病毒传播的搞笑内容。

【任务】创作30秒搞笑Rap歌词

场景: 搞笑洗脑
语言: ${dialectDesc}
主题: ${theme}
关键词: ${keywords}

【搞笑技巧指南】
${humorGuide}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- 魔性洗脑，病毒传播潜力
- ${ctx.dialect === 'cantonese' ? '使用粤语俚语，港式幽默' : '适度使用网络热梗'}
- 夸张幽默，娱乐效果拉满
- 约100-150字

【示例参考】
${example}

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
  const humorGuide = getSceneHumorGuide('ip')
  const example = getSceneExample('ip', ctx.dialect === 'english' ? 'english' : 'chinese')

  if (ctx.dialect === 'english') {
    const humorGuideEn = getSceneHumorGuideEnglish('ip')
    return `You are a professional Rap lyricist specializing in IP/Brand mashup content.

【Task】Create a 30-second Rap lyrics for IP/Brand mashup

Language: English
IP/Brand: ${ipName}
Core Elements: ${coreElements}
Mood: ${mood}

【Humor Techniques to Use】
${humorGuideEn}

【Quality Requirements】
- Use at least 2-3 humor techniques from above
- Include 1-2 "golden lines" (memorable, shareable quotes)
- ${mood} and powerful, resonate with fans
- Stay true to the IP's essence
- About 80-120 words

【Example for Reference】
${example}

【IMPORTANT】Output ONLY the lyrics, no explanations or descriptions.`
  }

  return `你是专业的Rap歌词创作专家，擅长为IP/品牌混剪创作燃炸的歌词。

【任务】创作30秒Rap歌词用于IP混剪

场景: IP混剪
语言: ${dialectDesc}
IP名称: ${ipName}
核心元素: ${coreElements}
风格: ${mood}

【搞笑技巧指南】
${humorGuide}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- ${mood}燃炸，符合IP调性
- 有粉丝共鸣，玩梗要精准
- ${ctx.dialect === 'cantonese' ? '港式风格' : ''}
- 约100-150字

【示例参考】
${example}

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
  const humorGuide = getSceneHumorGuide('vlog')
  const example = getSceneExample('vlog', ctx.dialect === 'english' ? 'english' : 'chinese')

  if (ctx.dialect === 'english') {
    const humorGuideEn = getSceneHumorGuideEnglish('vlog')
    return `You are a professional Rap lyricist specializing in relatable, authentic daily life content.

【Task】Create a 30-second Rap lyrics for daily vlog

Language: English
Activities: ${activities}
Location: ${location || 'Unknown'}
Mood: ${mood}

【Humor Techniques to Use】
${humorGuideEn}

【Quality Requirements】
- Use at least 2-3 humor techniques from above
- Include 1-2 "golden lines" (memorable, shareable quotes)
- Lifestyle-focused, relatable
- ${mood} and casual vibe
- Authentic and personal
- About 80-120 words

【Example for Reference】
${example}

【IMPORTANT】Output ONLY the lyrics, no explanations or descriptions.`
  }

  return `你是专业的Rap歌词创作专家，擅长创作真实接地气、引发共情的日常内容。

【任务】创作30秒Rap歌词用于日常Vlog

场景: 日常Vlog
语言: ${dialectDesc}
活动: ${activities}
地点: ${location}
心情: ${mood}

【搞笑技巧指南】
${humorGuide}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- 生活化，真实接地气
- ${ctx.dialect === 'cantonese' ? '粤语日常表达' : '引发共情，让人会心一笑'}
- ${mood}轻松愉快
- 约100-150字

【示例参考】
${example}

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
