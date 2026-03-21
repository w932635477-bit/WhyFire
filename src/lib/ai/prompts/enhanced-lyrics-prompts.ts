/**
 * 增强版歌词生成 Prompt 模板
 * 融合节日 + 热点 + 网络热梗
 */

import type { SceneType } from '@/types'
import type { DialectCode, DialectConfig } from '@/types/dialect'
import { DIALECT_CONFIGS } from '@/types/dialect'
import {
  getSceneHumorGuide,
  getSceneHumorGuideEnglish,
  getSceneExample,
} from './humor-techniques'
import type { TimeContext, FestivalConfig, TrendingTopic, InternetMeme } from '../context'

/**
 * 增强 Prompt 上下文
 */
export interface EnhancedPromptContext {
  scene: SceneType
  dialect: DialectCode
  dialectConfig: DialectConfig
  // 场景输入
  productName?: string
  sellingPoints?: string[]
  theme?: string
  keywords?: string[]
  ipName?: string
  coreElements?: string[]
  activities?: string[]
  mood?: string
  location?: string
  // 时效性上下文
  timeContext?: TimeContext
  trendingTopics?: TrendingTopic[]
  memes?: InternetMeme[]
}

/**
 * 语言描述映射（扩展版）
 */
const DIALECT_DESCRIPTIONS: Partial<Record<DialectCode, string>> = {
  mandarin: 'Mandarin Chinese (普通话)',
  cantonese: 'Cantonese (粤语)',
  sichuan: 'Sichuan Dialect (四川话)',
  dongbei: 'Northeastern Dialect (东北话)',
  shandong: 'Shandong Dialect (山东话)',
  henan: 'Henan Dialect (河南话)',
  shaanxi: 'Shaanxi Dialect (陕西话)',
  wu: 'Wu Dialect (吴语/上海话)',
  minnan: 'Minnan Dialect (闽南语)',
  hakka: 'Hakka Dialect (客家话)',
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
 * 构建增强版 Prompt
 */
export function buildEnhancedLyricsPrompt(
  scene: SceneType,
  dialect: DialectCode,
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
  },
  context?: {
    timeContext?: TimeContext
    trendingTopics?: TrendingTopic[]
    memes?: InternetMeme[]
  }
): string {
  const dialectConfig = DIALECT_CONFIGS[dialect]
  const dialectDesc = DIALECT_DESCRIPTIONS[dialect] || dialectConfig.name

  const ctx: EnhancedPromptContext = {
    scene,
    dialect,
    dialectConfig,
    ...inputs,
    timeContext: context?.timeContext,
    trendingTopics: context?.trendingTopics,
    memes: context?.memes,
  }

  switch (scene) {
    case 'product':
      return buildEnhancedProductPrompt(ctx)
    case 'funny':
      return buildEnhancedFunnyPrompt(ctx)
    case 'ip':
      return buildEnhancedIPPrompt(ctx)
    case 'vlog':
      return buildEnhancedVlogPrompt(ctx)
    default:
      return buildEnhancedVlogPrompt(ctx)
  }
}

/**
 * 构建产品推广场景 Prompt（增强版）
 */
function buildEnhancedProductPrompt(ctx: EnhancedPromptContext): string {
  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect] || ctx.dialectConfig.name
  const productName = ctx.productName || 'Product'
  const sellingPoints = ctx.sellingPoints?.join(', ') || ''
  const humorGuide = getSceneHumorGuide('product')
  const example = getSceneExample('product', ctx.dialect === 'english' ? 'english' : 'chinese')

  // 构建增强部分
  const festivalSection = buildFestivalSection(ctx.timeContext)
  const trendingSection = buildTrendingSection(ctx.trendingTopics)
  const memeSection = buildMemeSection(ctx.memes)

  if (ctx.dialect === 'english') {
    const humorGuideEn = getSceneHumorGuideEnglish('product')
    return `You are a professional Rap lyricist specializing in humorous, catchy product promotion.

【Task】Create a 30-second Rap lyrics for product promotion

Language: English
Product: ${productName}
Selling Points: ${sellingPoints}

${festivalSection.en}

${trendingSection.en}

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

${festivalSection.cn}

${trendingSection.cn}

${memeSection.cn}

【搞笑技巧指南】
${humorGuide}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- 押韵自然，节奏感强
- 自然融入产品卖点，不要让广告感太重
${getDialectSpecificRequirements(ctx.dialect)}
- 约100-150字

【示例参考】
${example}

【重要】只输出歌词，不要任何解释、说明或分析。`
}

/**
 * 构建搞笑场景 Prompt（增强版）
 */
function buildEnhancedFunnyPrompt(ctx: EnhancedPromptContext): string {
  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect] || ctx.dialectConfig.name
  const theme = ctx.theme || 'Daily Life'
  const keywords = ctx.keywords?.join(', ') || ''
  const humorGuide = getSceneHumorGuide('funny')
  const example = getSceneExample('funny', ctx.dialect === 'english' ? 'english' : 'chinese')

  const festivalSection = buildFestivalSection(ctx.timeContext)
  const trendingSection = buildTrendingSection(ctx.trendingTopics)
  const memeSection = buildMemeSection(ctx.memes)

  if (ctx.dialect === 'english') {
    const humorGuideEn = getSceneHumorGuideEnglish('funny')
    return `You are a professional Rap lyricist specializing in viral, comedic content.

【Task】Create a 30-second funny/viral Rap lyrics

Language: English
Theme: ${theme}
Keywords: ${keywords}

${festivalSection.en}

${trendingSection.en}

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

${festivalSection.cn}

${trendingSection.cn}

${memeSection.cn}

【搞笑技巧指南】
${humorGuide}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- 魔性洗脑，病毒传播潜力
${getDialectSpecificRequirements(ctx.dialect)}
- 夸张幽默，娱乐效果拉满
- 约100-150字

【示例参考】
${example}

【重要】只输出歌词，不要任何解释、说明或分析。`
}

/**
 * 构建 IP 场景 Prompt（增强版）
 */
function buildEnhancedIPPrompt(ctx: EnhancedPromptContext): string {
  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect] || ctx.dialectConfig.name
  const ipName = ctx.ipName || 'IP'
  const coreElements = ctx.coreElements?.join(', ') || ''
  const mood = ctx.mood || 'Epic'
  const humorGuide = getSceneHumorGuide('ip')
  const example = getSceneExample('ip', ctx.dialect === 'english' ? 'english' : 'chinese')

  const festivalSection = buildFestivalSection(ctx.timeContext)
  const trendingSection = buildTrendingSection(ctx.trendingTopics)

  if (ctx.dialect === 'english') {
    const humorGuideEn = getSceneHumorGuideEnglish('ip')
    return `You are a professional Rap lyricist specializing in IP/Brand mashup content.

【Task】Create a 30-second Rap lyrics for IP/Brand mashup

Language: English
IP/Brand: ${ipName}
Core Elements: ${coreElements}
Mood: ${mood}

${festivalSection.en}

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

${festivalSection.cn}

${trendingSection.cn}

【搞笑技巧指南】
${humorGuide}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- ${mood}燃炸，符合IP调性
- 有粉丝共鸣，玩梗要精准
${getDialectSpecificRequirements(ctx.dialect)}
- 约100-150字

【示例参考】
${example}

【重要】只输出歌词，不要任何解释、说明或分析。`
}

/**
 * 构建 Vlog 场景 Prompt（增强版）
 */
function buildEnhancedVlogPrompt(ctx: EnhancedPromptContext): string {
  const dialectDesc = DIALECT_DESCRIPTIONS[ctx.dialect] || ctx.dialectConfig.name
  const activities = ctx.activities?.join(', ') || ''
  const location = ctx.location || ''
  const mood = ctx.mood || 'Chill'
  const humorGuide = getSceneHumorGuide('vlog')
  const example = getSceneExample('vlog', ctx.dialect === 'english' ? 'english' : 'chinese')

  const festivalSection = buildFestivalSection(ctx.timeContext)
  const trendingSection = buildTrendingSection(ctx.trendingTopics)
  const memeSection = buildMemeSection(ctx.memes)

  if (ctx.dialect === 'english') {
    const humorGuideEn = getSceneHumorGuideEnglish('vlog')
    return `You are a professional Rap lyricist specializing in relatable, authentic daily life content.

【Task】Create a 30-second Rap lyrics for daily vlog

Language: English
Activities: ${activities}
Location: ${location || 'Unknown'}
Mood: ${mood}

${festivalSection.en}

${trendingSection.en}

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

${festivalSection.cn}

${trendingSection.cn}

${memeSection.cn}

【搞笑技巧指南】
${humorGuide}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- 生活化，真实接地气
${getDialectSpecificRequirements(ctx.dialect)}
- ${mood}轻松愉快
- 约100-150字

【示例参考】
${example}

【重要】只输出歌词，不要任何解释、说明或分析。`
}

/**
 * 构建节日部分
 */
function buildFestivalSection(timeContext?: TimeContext): { cn: string; en: string } {
  if (!timeContext?.currentFestival) {
    return { cn: '', en: '' }
  }

  const festival = timeContext.currentFestival
  const themes = festival.themes.join('、')
  const keywords = festival.keywords.join('、')

  return {
    cn: `【当前节日氛围】
节日: ${festival.name}
相关主题: ${themes}
关键词: ${keywords}
请在歌词中自然融入节日氛围！`,
    en: `【Current Festival】
Festival: ${festival.englishName}
Themes: ${themes}
Keywords: ${keywords}
Please naturally incorporate the festive atmosphere!`,
  }
}

/**
 * 构建热点部分
 */
function buildTrendingSection(topics?: TrendingTopic[]): { cn: string; en: string } {
  if (!topics?.length) {
    return { cn: '', en: '' }
  }

  const topTopics = topics.slice(0, 3)
  const cnContent = topTopics.map(t => `- ${t.title}: ${t.description}`).join('\n')
  const enContent = topTopics.map(t => `- ${t.title}: ${t.description}`).join('\n')

  return {
    cn: `【当前热点事件】
${cnContent}
请适度引用热点事件，增加话题性！`,
    en: `【Current Trending Topics】
${enContent}
Please reference trending topics moderately to increase relevance!`,
  }
}

/**
 * 构建热梗部分
 */
function buildMemeSection(memes?: InternetMeme[]): { cn: string; en: string } {
  if (!memes?.length) {
    return { cn: '', en: '' }
  }

  const topMemes = memes.slice(0, 5)
  const memeTexts = topMemes.map(m => m.text).join('、')

  return {
    cn: `【当前网络热梗】
${memeTexts}
请自然融入1-2个热梗，增加传播力！`,
    en: `【Current Internet Slang】
${memeTexts}
Please naturally incorporate 1-2 slang terms to increase viral potential!`,
  }
}

/**
 * 获取方言特定要求
 */
function getDialectSpecificRequirements(dialect: DialectCode): string {
  const requirements: Partial<Record<DialectCode, string>> = {
    cantonese: '- 使用粤语俚语，港式幽默',
    sichuan: '- 使用四川方言特色表达，麻辣风格',
    dongbei: '- 使用东北方言特色表达，豪爽幽默',
    shandong: '- 使用山东方言特色表达',
    henan: '- 使用河南方言特色表达',
    shaanxi: '- 使用陕西方言特色表达',
    wu: '- 使用吴语特色表达',
    minnan: '- 使用闽南语特色表达',
    hakka: '- 使用客家话特色表达',
  }

  return requirements[dialect] || '- 适度使用网络热梗'
}

/**
 * 计算歌词字数（去除标点和空格）
 */
export function countWords(lyrics: string): number {
  const cleanText = lyrics.replace(/[\s\n\r\p{P}]/gu, '')
  return cleanText.length
}

/**
 * 估算歌词演唱时长（秒）
 */
export function estimateDuration(wordCount: number): number {
  const wordsPerSecond = 4.5
  const duration = Math.ceil(wordCount / wordsPerSecond)
  return Math.max(20, Math.min(60, duration))
}
