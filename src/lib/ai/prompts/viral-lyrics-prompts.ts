/**
 * 爆款歌词生成 Prompt 模板
 *
 * 基于《八方来财》《野狼disco》等爆款神曲分析，
 * 融合洗脑 Hook、金句设计、地域文化符号 + 时效性上下文（节日/热点/热梗）
 */

import type { DialectCode } from '@/types/dialect'
import type { TimeContext, TrendingTopic, InternetMeme } from '../context'

// ============================================================================
// 方言爆款配置
// ============================================================================

export interface ViralDialectConfig {
  name: string
  style: string
  keywords: string[]
  culturalSymbols: string[]  // 地域文化符号
  goldenPhrases: string[]     // 金句参考
}

export const VIRAL_DIALECT_CONFIGS: Record<DialectCode, ViralDialectConfig> = {
  original: {
    name: '普通话',
    style: '标准说唱',
    keywords: ['flow', '押韵', '节奏'],
    culturalSymbols: ['街头', '夜市', '烧烤摊', '电动车'],
    goldenPhrases: ['一路生花', '冲就完了', '干就完了'],
  },
  mandarin: {
    name: '普通话',
    style: '标准说唱',
    keywords: ['flow', '押韵', '节奏'],
    culturalSymbols: ['街头', '夜市', '烧烤摊', '电动车'],
    goldenPhrases: ['一路生花', '冲就完了', '干就完了'],
  },
  cantonese: {
    name: '粤语',
    style: '港式嘻哈',
    keywords: ['港风', '江湖', '义气'],
    culturalSymbols: ['茶餐厅', '麻将馆', '维港', '牛杂'],
    goldenPhrases: ['捞得掂', '顶硬上', '大把世界'],
  },
  sichuan: {
    name: '四川话',
    style: '成都Trap',
    keywords: ['火锅', '熊猫', '安逸'],
    culturalSymbols: ['宽窄巷子', '串串香', '盖碗茶', '麻将'],
    goldenPhrases: ['巴适得板', '要得', '雄起'],
  },
  dongbei: {
    name: '东北话',
    style: '东北说唱',
    keywords: ['豪爽', '实在', '热乎'],
    culturalSymbols: ['炕头', '大集', '冰雕', '二人转'],
    goldenPhrases: ['必须的', '没毛病', '整就完了'],
  },
  shaanxi: {
    name: '陕西话',
    style: '秦腔说唱',
    keywords: ['古城', '兵马俑', 'biangbiang'],
    culturalSymbols: ['城墙根', '回民街', '油泼面', '羊肉泡'],
    goldenPhrases: ['嘹咋咧', '么麻达', '额滴神'],
  },
  wu: {
    name: '上海话',
    style: '海派说唱',
    keywords: ['弄堂', '精致', '摩登'],
    culturalSymbols: ['外滩', '生煎', '石库门', '咖啡'],
    goldenPhrases: ['老灵额', '不要太', '有腔调'],
  },
  minnan: {
    name: '闽南语',
    style: '台语说唱',
    keywords: ['打拼', '兄弟', '海风'],
    culturalSymbols: ['夜市', '庙口', '海港', '蚵仔煎'],
    goldenPhrases: ['爱拼才会赢', '兄弟一条心', '冲冲冲'],
  },
  tianjin: {
    name: '天津话',
    style: '津味说唱',
    keywords: ['相声', '快板', '逗趣'],
    culturalSymbols: ['茶馆', '狗不理', '海河', '煎饼果子'],
    goldenPhrases: ['倍儿', '介是嘛', '哏儿都'],
  },
  nanjing: {
    name: '南京话',
    style: '金陵说唱',
    keywords: ['鸭血粉丝', '秦淮河', '城墙'],
    culturalSymbols: ['夫子庙', '老门东', '盐水鸭', '紫金山'],
    goldenPhrases: ['阿要辣油', '滴板', '多大事'],
  },
}

// ============================================================================
// Prompt 参数
// ============================================================================

export interface ViralLyricsPromptOptions {
  /** 用户描述（职业、爱好、想说的） */
  description: string
  /** 方言 */
  dialect: DialectCode
  /** 节日上下文 */
  timeContext?: TimeContext
  /** 热点话题 */
  trendingTopics?: TrendingTopic[]
  /** 网络热梗 */
  memes?: InternetMeme[]
}

// ============================================================================
// 时效性上下文构建器（从 enhanced-lyrics-prompts.ts 迁移）
// ============================================================================

function buildFestivalSection(timeContext?: TimeContext): string {
  if (!timeContext?.currentFestival) return ''

  const festival = timeContext.currentFestival
  const themes = festival.themes.join('、')
  const keywords = festival.keywords.join('、')

  return `### 当前节日氛围
节日: ${festival.name}
相关主题: ${themes}
关键词: ${keywords}
请在歌词中自然融入节日氛围！`
}

function buildTrendingSection(topics?: TrendingTopic[]): string {
  if (!topics?.length) return ''

  const topTopics = topics.slice(0, 3)
  const content = topTopics.map(t => `- ${t.title}: ${t.description}`).join('\n')

  return `### 当前热点事件
${content}
请适度引用热点事件，增加话题性！`
}

function buildMemeSection(memes?: InternetMeme[]): string {
  if (!memes?.length) return ''

  const topMemes = memes.slice(0, 5)
  const memeTexts = topMemes.map(m => m.text).join('、')

  return `### 当前网络热梗
${memeTexts}
请自然融入1-2个热梗，增加传播力！`
}

// ============================================================================
// 爆款 Prompt 构建器
// ============================================================================

/**
 * 构建爆款歌词 Prompt
 *
 * 基于《八方来财》《野狼disco》等爆款分析 + 时效性上下文
 */
export function buildViralLyricsPrompt(options: ViralLyricsPromptOptions): string {
  const config = VIRAL_DIALECT_CONFIGS[options.dialect]

  const festivalSection = buildFestivalSection(options.timeContext)
  const trendingSection = buildTrendingSection(options.trendingTopics)
  const memeSection = buildMemeSection(options.memes)

  const timeSections = [festivalSection, trendingSection, memeSection]
    .filter(Boolean)
    .join('\n\n')

  const timeBlock = timeSections
    ? `\n${timeSections}\n`
    : ''

  return `你是一位擅长创作**病毒式传播**说唱的歌词创作人。你的作品参考了《八方来财》《野狼disco》等爆款神曲的风格。

## 任务
为用户创作一段${config.name}风格的Rap歌词，主题是：${options.description}

## 爆款歌词核心法则（必须严格遵守）

### 1. 开头放 Hook（最重要！）
- **前3行必须是洗脑金句**，让人一听就能记住
- 参考风格："来财来，我们这憋佬" / "左边跟我一起画个龙"
- 金句要短、要重复、要有节奏感

### 2. 设计传播金句
必须包含 **1-2 句可以单独传播的金句**，类似：
- "${config.goldenPhrases[0]}"
- "${config.culturalSymbols[0]}里的故事"

### 3. 地域文化符号（至少3个）
融入以下${config.name}特色元素：${config.culturalSymbols.join('、')}
${config.keywords.map(k => `- ${k}`).join('\n')}

### 4. 画面感 + 接地气
- 用具体场景代替抽象表达
- 例如："别墅里面唱K" 比 "很有钱" 更有画面感
- 写市井生活、普通人能共情的内容

### 5. 积极正能量
- 结尾要有希望、有力量
- 类似"大展鸿图"的气势
${timeBlock}
## 歌词结构（必须遵守）

[Hook]
（3-4行洗脑金句，放在最开头！重复2遍）

[Verse 1]
（6-8行主歌，叙事+画面感）

[Chorus]
（4-6行副歌，朗朗上口，包含金句）

[Verse 2]
（6-8行主歌，情绪递进）

[Hook]
（重复开头的洗脑金句）

[Outro]
（2-3行收尾，正能量）

## 方言要求
- 大量使用${config.name}特色词汇和表达
- 韵脚要符合方言发音
- 可以中英夹杂增加节奏感

请直接输出歌词，不要任何解释。`
}

// ============================================================================
// 工具函数
// ============================================================================

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
