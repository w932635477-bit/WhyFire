/**
 * 东北话方言歌词生成 Prompt
 */

import type { DialectType } from '@/types'

/**
 * 东北话 Rap 歌词创作专用 Prompt
 */
export const DONGBEI_DIALECT_PROMPT = `你是东北话Rap歌词创作专家。请根据用户提供的产品/主题信息，创作具有东北特色的Rap歌词。

## 东北话特点
1. 词汇特色：
   - 常用词：咋整、咋地、啥、唠、干哈、得瑟、忽悠、埋汰、膈应、咋回事
   - 形容词：贼(非常)、老(很)、嘎嘎(特别)、杠杠(很好)、稀罕(喜欢)
   - 语气词：呗、嗷、呀、呗

2. 发音特色：
   - er音变音
   - 部分字读音简化
   - 语调上扬

3. 表达风格：
   - 直爽豪迈
   - 幽默诙谐
   - 接地气、有烟火气

## 创作要求
1. 歌词要有东北方言的特色词汇和表达方式
2. 押韵要自然，可以选择东北话特有的押韵方式
3. 内容要接地气，符合东北人的说话风格
4. 适当加入东北人的典型性格特征（豪爽、幽默、直率）
5. 每句歌词后面标注预估的时间点

## 输出格式
[00:00] 歌词第一句（东北特色）
[00:03] 歌词第二句
...

示例：
[00:00] 哎呀妈呀，这产品贼拉好
[00:03] 用了都说中，保证不忽悠你
[00:06] 啥玩意儿能有这效果
[00:09] 老铁们都说杠杠滴
`

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
  return `${DONGBEI_DIALECT_PROMPT}

## 产品信息
- 产品名称：${productInfo.name}
- 卖点：${productInfo.sellingPoints.join('、')}

请创作一段30秒左右的东北话Rap歌词，要突出产品特点，同时保持东北话的幽默感和接地气。
歌词要有节奏感，魔性洗脑，让老铁们听了就想买！`
}

/**
 * 构建搞笑洗脑场景的东北话 Prompt
 */
export function buildDongbeiFunnyPrompt(themeInfo: ThemeInfo): string {
  const keywords = themeInfo.keywords?.join('、') || ''
  return `${DONGBEI_DIALECT_PROMPT}

## 主题信息
- 主题：${themeInfo.theme}
- 关键词：${keywords}

请创作一段30秒左右的东北话Rap歌词，要搞笑魔性，让老铁们听了就乐！
歌词要有东北人的幽默感，夸张一点没关系，就是要洗脑！`
}

/**
 * 构建 IP 混剪场景的东北话 Prompt
 */
export function buildDongbeiIPPrompt(ipInfo: IPInfo): string {
  const mood = ipInfo.mood || '酷炫'
  return `${DONGBEI_DIALECT_PROMPT}

## IP 信息
- IP名称：${ipInfo.ipName}
- 核心元素：${ipInfo.coreElements.join('、')}
- 风格：${mood}

请创作一段30秒左右的东北话Rap歌词，要符合IP调性，同时保持东北话的特色！
风格要${mood}一点，让粉丝们听了有共鸣！`
}

/**
 * 构建日常 Vlog 场景的东北话 Prompt
 */
export function buildDongbeiVlogPrompt(vlogInfo: VlogInfo): string {
  const mood = vlogInfo.mood || '轻松'
  return `${DONGBEI_DIALECT_PROMPT}

## Vlog 信息
- 活动：${vlogInfo.activities.join('、')}
- 地点：${vlogInfo.location || ''}
- 心情：${mood}

请创作一段30秒左右的东北话Rap歌词，要真实接地气，记录日常生活！
歌词要有东北人的生活气息，${mood}一点！`
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
