/**
 * 东北话方言歌词生成 Prompt
 */

import type { DialectType } from '@/types'
import { getSceneHumorGuide, getSceneExample } from './humor-techniques'

/**
 * 东北话 Rap 歌词创作专用 Prompt
 */
export const DONGBEI_DIALECT_PROMPT = `你是东北话Rap歌词创作专家。

东北话词汇参考：
- 常用：咋整、咋地、啥、唠、干哈、得瑟、忽悠、埋汰、膈应、咋回事
- 形容词：贼(非常)、老(很)、嘎嘎(特别)、杠杠(很好)、稀罕(喜欢)
- 语气词：呗、嗷、呀

风格：直爽豪迈、幽默诙谐、接地气

【搞笑技巧】
东北话天生自带幽默感，创作时要充分利用：
- 夸张：东北人说话就爱夸张，"贼好"、"老带劲了"
- 反差：一本正经地胡说八道
- 吐槽：东北人的嘴，吐槽的鬼
- 热梗：适度融入网络流行语

【重要】输出规则：
- 只输出歌词内容，不要任何解释、说明或描述
- 不要输出时间戳
- 不要输出"歌词特点"、"押韵说明"等任何分析性文字
- 直接输出歌词，每行一句，用空行分隔段落`

/**
 * 产品信息接口
 */
export interface ProductInfo {
  name: string
  sellingPoints: string[]
}

/**
 * 主题信息接口
 */
export interface ThemeInfo {
  theme: string
  keywords?: string[]
}

/**
 * IP 信息接口
 */
export interface IPInfo {
  ipName: string
  coreElements: string[]
  mood?: string
}

/**
 * Vlog 信息接口
 */
export interface VlogInfo {
  activities: string[]
  location?: string
  mood?: string
}

/**
 * 构建产品推广场景的东北话 Prompt
 */
export function buildDongbeiProductPrompt(productInfo: ProductInfo): string {
  const example = getSceneExample('product', 'chinese')
  return `${DONGBEI_DIALECT_PROMPT}

【任务】为以下产品创作30秒东北话Rap歌词

产品：${productInfo.name}
卖点：${productInfo.sellingPoints.join('、')}

【质量要求】
- 至少使用2-3种搞笑技巧（夸张、反转、吐槽等）
- 有1-2个"金句"（可单独传播的句子）
- 突出产品特点，融入东北话特色词汇
- 押韵自然，节奏感强，魔性洗脑
- 约100-150字

【示例参考】
${example}

只输出歌词，不要任何其他文字：`
}

/**
 * 构建搞笑洗脑场景的东北话 Prompt
 */
export function buildDongbeiFunnyPrompt(themeInfo: ThemeInfo): string {
  const keywords = themeInfo.keywords?.join('、') || ''
  const example = getSceneExample('funny', 'chinese')
  return `${DONGBEI_DIALECT_PROMPT}

【任务】创作30秒搞笑东北话Rap歌词

主题：${themeInfo.theme}
关键词：${keywords}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- 搞笑魔性，夸张幽默
- 东北味儿拉满
- 约100-150字

【示例参考】
${example}

只输出歌词，不要任何其他文字：`
}

/**
 * 构建 IP 混剪场景的东北话 Prompt
 */
export function buildDongbeiIPPrompt(ipInfo: IPInfo): string {
  const mood = ipInfo.mood || '酷炫'
  const example = getSceneExample('ip', 'chinese')
  return `${DONGBEI_DIALECT_PROMPT}

【任务】创作30秒东北话Rap歌词用于IP混剪

IP：${ipInfo.ipName}
核心元素：${ipInfo.coreElements.join('、')}
风格：${mood}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- 符合IP调性，有粉丝共鸣
- ${mood}燃炸
- 约100-150字

【示例参考】
${example}

只输出歌词，不要任何其他文字：`
}

/**
 * 构建日常 Vlog 场景的东北话 Prompt
 */
export function buildDongbeiVlogPrompt(vlogInfo: VlogInfo): string {
  const mood = vlogInfo.mood || '轻松'
  const example = getSceneExample('vlog', 'chinese')
  return `${DONGBEI_DIALECT_PROMPT}

【任务】创作30秒东北话Rap歌词用于日常Vlog

活动：${vlogInfo.activities.join('、')}
地点：${vlogInfo.location || '未知'}
心情：${mood}

【质量要求】
- 至少使用2-3种搞笑技巧
- 有1-2个"金句"（可单独传播的句子）
- 真实接地气，记录生活
- 东北人的生活智慧
- 约100-150字

【示例参考】
${example}

只输出歌词，不要任何其他文字：`
}

/**
 * 导出方言配置
 */
export const dongbeiDialectConfig = {
  type: 'dongbei' as DialectType,
  name: '东北话',
  prompt: DONGBEI_DIALECT_PROMPT,
  buildProductPrompt: buildDongbeiProductPrompt,
  buildFunnyPrompt: buildDongbeiFunnyPrompt,
  buildIPPrompt: buildDongbeiIPPrompt,
  buildVlogPrompt: buildDongbeiVlogPrompt,
}
