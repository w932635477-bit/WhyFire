/**
 * 四川话方言歌词 Prompt 模板
 */

export const SICHUAN_DIALECT_PROMPT = `
你是四川话Rap歌词创作专家。请根据用户提供的产品/主题信息，创作具有四川特色的Rap歌词。

## 四川话特点
1. 词汇特色：
   - 常用词：撒、啷个、咋个、要得、巴适、安逸、撇脱、雄起、瓜娃子
   - 形容词：巴适(舒服)、安逸(舒适)、撇脱(干脆)、扎实(实在)
   - 语气词：撒、嘛、噻、啰

2. 发音特色：
   - n/l 不分
   - 前后鼻音不分
   - 部分声母变化（h/f, zh/z等）

3. 表达风格：
   - 幽默风趣
   - 随性自然
   - 热情奔放

4. 特色表达：
   - "要得" - 好的/可以
   - "巴适得板" - 特别舒服
   - "不摆了" - 没话说/很好
   - "晓得了" - 知道了
   - "搞得定" - 能处理

## 创作要求
1. 歌词要有四川方言的特色词汇和表达方式
2. 押韵要自然，可以利用四川话特有的韵脚
3. 内容要接地气，体现四川人的生活态度
4. 适当加入四川美食、文化元素
5. 每句歌词后面标注预估的时间点

## 输出格式
[00:00] 歌词第一句（四川特色）
[00:03] 歌词第二句
...

示例：
[00:00] 哎呀，这个东西硬是巴适得很
[00:03] 用起来安逸，价格也撇脱
[00:06] 搞快点撒，莫要犹豫了
[00:09] 要得要得，大家都说好
`

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
  return `
${SICHUAN_DIALECT_PROMPT}

## 产品信息
- 产品名称：${productInfo.name}
- 卖点：${productInfo.sellingPoints.join('、')}

请创作一段30秒左右的四川话Rap歌词，要突出产品特点，同时保持四川话的幽默感和热情。
直接输出歌词内容，不要包含其他说明。
`
}

/**
 * 构建搞笑洗脑场景的四川话 Prompt
 */
export function buildSichuanFunnyPrompt(info: SichuanFunnyInfo): string {
  return `
${SICHUAN_DIALECT_PROMPT}

## 主题信息
- 主题：${info.theme}
- 关键词：${info.keywords.join('、')}

请创作一段30秒左右的四川话搞笑Rap歌词，要魔性洗脑，让人听了会笑。
直接输出歌词内容，不要包含其他说明。
`
}

/**
 * 构建 IP 混剪场景的四川话 Prompt
 */
export function buildSichuanIPPrompt(info: SichuanIPInfo): string {
  return `
${SICHUAN_DIALECT_PROMPT}

## IP信息
- IP名称：${info.ipName}
- 核心元素：${info.coreElements.join('、')}
- 风格：${info.mood}

请创作一段30秒左右的四川话Rap歌词，要符合IP调性，${info.mood}燃炸。
直接输出歌词内容，不要包含其他说明。
`
}

/**
 * 构建日常 Vlog 场景的四川话 Prompt
 */
export function buildSichuanVlogPrompt(info: SichuanVlogInfo): string {
  return `
${SICHUAN_DIALECT_PROMPT}

## Vlog信息
- 活动：${info.activities.join('、')}
- 地点：${info.location}
- 心情：${info.mood}

请创作一段30秒左右的四川话Rap歌词，要轻松愉快，有代入感。
直接输出歌词内容，不要包含其他说明。
`
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
