/**
 * 四川话方言歌词 Prompt 模板
 */

export const SICHUAN_DIALECT_PROMPT = `你是四川话Rap歌词创作专家。

四川话词汇参考：
- 常用：撒、啷个、咋个、要得、巴适、安逸、撇脱、雄起、瓜娃子
- 形容词：巴适(舒服)、安逸(舒适)、撇脱(干脆)、扎实(实在)
- 语气词：撒、嘛、噻、啰
- 特色表达："要得"(好的)、"巴适得板"(特别舒服)、"不摆了"(很好)、"晓得了"(知道了)

风格：幽默风趣、随性自然、热情奔放

【重要】输出规则：
- 只输出歌词内容，不要任何解释、说明或描述
- 不要输出时间戳
- 不要输出"歌词特点"、"押韵说明"等任何分析性文字
- 直接输出歌词，每行一句，用空行分隔段落`

export interface SichuanProductInfo {
  name: string
  sellingPoints: string[]
}

export interface SichuanFunnyInfo {
  theme: string
  keywords: string[]
}

export interface SichuanIPInfo {
  ipName: string
  coreElements: string[]
  mood: string
}

export interface SichuanVlogInfo {
  activities: string[]
  location: string
  mood: string
}

/**
 * 构建产品推广场景的四川话 Prompt
 */
export function buildSichuanProductPrompt(productInfo: SichuanProductInfo): string {
  return `${SICHUAN_DIALECT_PROMPT}

【任务】为以下产品创作30秒四川话Rap歌词

产品：${productInfo.name}
卖点：${productInfo.sellingPoints.join('、')}

要求：
- 突出产品特点，融入四川话特色词汇
- 押韵自然，节奏感强
- 约100-150字

只输出歌词，不要任何其他文字：`
}

/**
 * 构建搞笑洗脑场景的四川话 Prompt
 */
export function buildSichuanFunnyPrompt(info: SichuanFunnyInfo): string {
  return `${SICHUAN_DIALECT_PROMPT}

【任务】创作30秒搞笑四川话Rap歌词

主题：${info.theme}
关键词：${info.keywords.join('、')}

要求：
- 搞笑魔性，夸张幽默
- 约100-150字

只输出歌词，不要任何其他文字：`
}

/**
 * 构建 IP 混剪场景的四川话 Prompt
 */
export function buildSichuanIPPrompt(info: SichuanIPInfo): string {
  return `${SICHUAN_DIALECT_PROMPT}

【任务】创作30秒四川话Rap歌词用于IP混剪

IP：${info.ipName}
核心元素：${info.coreElements.join('、')}
风格：${info.mood}

要求：
- 符合IP调性，有粉丝共鸣
- 约100-150字

只输出歌词，不要任何其他文字：`
}

/**
 * 构建日常 Vlog 场景的四川话 Prompt
 */
export function buildSichuanVlogPrompt(info: SichuanVlogInfo): string {
  return `${SICHUAN_DIALECT_PROMPT}

【任务】创作30秒四川话Rap歌词用于日常Vlog

活动：${info.activities.join('、')}
地点：${info.location || '未知'}
心情：${info.mood}

要求：
- 轻松愉快，有代入感
- 约100-150字

只输出歌词，不要任何其他文字：`
}

/**
 * 四川话发音转换映射（用于音乐合成时）
 */
export const SICHUAN_PRONUNCIATION_MAP: Record<string, string> = {
  '什么': '啥子',
  '怎么': '咋个',
  '这样': '勒个',
  '那样': '那个',
  '这里': '勒里',
  '那里': '那当',
  '知道': '晓得',
  '可以': '要得',
  '很好': '巴适',
  '舒服': '安逸',
  '舒服的': '巴适得板',
  '很好很好': '巴适得板',
  '知道了': '晓得了',
  '没问题': '要得',
  '快点': '搞快点',
  '为什么': '为啥子',
  '干什么': '搞啥子',
  '这样子': '勒样子',
  '那样子': '那样子',
  '真是的': '硬是',
  '特别': '特别',
  '非常': '硬是',
  '朋友': '兄弟伙',
  '吃东西': '吃东西',
  '聊天': '摆龙门阵',
  '逛街': '逛该',
  '玩': '耍',
  '休息': '歇',
  '便宜': '相因',
  '贵': '贵',
  '好吃': '好吃',
  '厉害': '雄起',
  '不行': '不得行',
  '可以吗': '要得不',
  '走': '走',
  '看': '看',
  '说': '说',
  '想': '想',
}
