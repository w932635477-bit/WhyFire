# 歌词生成幽默优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 优化歌词生成 Prompt，让 AI 掌握制造幽默感的技巧，生成更搞笑、更有梗、更接地气的歌词。

**Architecture:** 创建独立的 humor-techniques.ts 模块存放搞笑技巧库，然后修改 lyrics-prompts.ts 和方言文件整合这些技巧。采用组合式设计，每个场景 Prompt 动态注入适合的技巧组合。

**Tech Stack:** TypeScript, 现有的 Prompt 构建系统

---

## Task 1: 创建搞笑技巧库模块

**Files:**
- Create: `src/lib/ai/prompts/humor-techniques.ts`

**Step 1: 创建搞笑技巧库文件**

```typescript
/**
 * 搞笑技巧库 - 让歌词有梗有趣
 */

import type { SceneType } from '@/types'

/**
 * 搞笑技巧定义
 */
export interface HumorTechnique {
  name: string
  description: string
  example: string
}

/**
 * 7种核心搞笑技巧
 */
export const HUMOR_TECHNIQUES: Record<string, HumorTechnique> = {
  exaggeration: {
    name: '夸张法',
    description: '把特点放大到荒诞程度，制造强烈的记忆点',
    example: '"这耳机降噪强到我妈喊我吃饭我都以为在拍恐怖片"',
  },
  contrast: {
    name: '反差/反转',
    description: '预期 vs 现实的落差感，制造惊喜',
    example: '"老板说要给我涨薪...涨了50块，够买瓶可乐"',
  },
  pun: {
    name: '谐音梗',
    description: '读音相似制造记忆点和幽默感',
    example: '"这产品很\'牛\'，不是英文的\'new\'，是真的牛"',
  },
  twist: {
    name: '神转折',
    description: '前面正经铺垫，最后沙雕收尾',
    example: '"产品质量过硬，客服态度超好，唯一缺点是...我买不起"',
  },
  selfDeprecation: {
    name: '自嘲/吐槽',
    description: '自黑增加亲切感和可信度',
    example: '"虽然钱包很薄，但这不妨碍我眼光很毒"',
  },
  personification: {
    name: '拟人化',
    description: '让产品/卖点"说话"，增加趣味性',
    example: '"我的电池从来不加班，所以续航特别长"',
  },
  internetMeme: {
    name: '网络热梗',
    description: '适度融入当下流行语，增加传播力',
    example: '"这波操作，属于是狠狠拿捏了"',
  },
}

/**
 * 场景-技巧映射
 * 根据不同场景推荐适合的搞笑技巧组合
 */
export const SCENE_HUMOR_MAP: Record<SceneType, string[]> = {
  product: ['exaggeration', 'pun', 'twist', 'personification'],
  funny: ['contrast', 'selfDeprecation', 'exaggeration', 'internetMeme'],
  ip: ['exaggeration', 'internetMeme', 'contrast'],
  vlog: ['selfDeprecation', 'selfDeprecation', 'contrast'],
}

/**
 * 获取场景推荐的搞笑技巧描述
 */
export function getSceneHumorGuide(scene: SceneType): string {
  const techniques = SCENE_HUMOR_MAP[scene]
  const guides = techniques.map((key) => {
    const t = HUMOR_TECHNIQUES[key]
    return `- **${t.name}**：${t.description}\n  示例：${t.example}`
  })
  return guides.join('\n')
}

/**
 * 获取英文版搞笑技巧描述
 */
export function getSceneHumorGuideEnglish(scene: SceneType): string {
  const techniques = SCENE_HUMOR_MAP[scene]
  const guides = techniques.map((key) => {
    const t = HUMOR_TECHNIQUES[key]
    return `- **${t.name}**: ${t.description}\n  Example: ${t.example}`
  })
  return guides.join('\n')
}
```

**Step 2: 验证文件语法**

Run: `npx tsc --noEmit src/lib/ai/prompts/humor-techniques.ts`
Expected: 无错误输出

**Step 3: Commit**

```bash
git add src/lib/ai/prompts/humor-techniques.ts
git commit -m "feat: 添加搞笑技巧库模块

- 7种核心搞笑技巧：夸张、反转、谐音梗、神转折、自嘲、拟人化、热梗
- 场景-技巧映射：根据场景智能推荐技巧组合
- getSceneHumorGuide() 函数用于生成 Prompt 指导内容"
```

---

## Task 2: 添加 Few-Shot 示例库

**Files:**
- Modify: `src/lib/ai/prompts/humor-techniques.ts` (追加内容)

**Step 1: 在 humor-techniques.ts 末尾添加示例库**

```typescript
/**
 * Few-Shot 歌词示例库
 * 为每种场景提供优质歌词示例，让 AI 学习"好歌词长什么样"
 */
export const LYRICS_EXAMPLES: Record<SceneType, { chinese: string; english: string }> = {
  product: {
    chinese: `【产品推广示例 - 蓝牙耳机】
降噪强到邻居以为我在拍恐怖片
续航长得像我的单身年限
价格便宜到我妈都问是不是假的
别问 问就是真香定律

这款耳机 绝了
戴上它 世界安静得像图书馆
老板的画皮 我一个字都听不见
同事的八卦 全都变成空气

音质好到耳朵怀孕
低音下潜 深过我的黑眼圈
高音上飘 飘过我的发际线
买了它 你就是全村最靓的仔`,
    english: `【Product Example - Wireless Earbuds】
Noise cancellation so strong my neighbor thought I was filming a horror movie
Battery life longer than my dating dry spell
So cheap my mom asked if it was fake
Don't ask, it's just that good

These earbuds, absolutely fire
Put them on, world goes quiet like a library
Can't hear my boss's lies, not a single word
Colleagues' gossip all turns into air

Sound quality so good my ears got pregnant
Bass drops deeper than my dark circles
High notes float higher than my receding hairline
Buy these, you'll be the coolest in the village`,
  },
  funny: {
    chinese: `【搞笑洗脑示例 - 加班主题】
老板说要给我涨薪 我激动得差点当场起飞
结果涨了五十块 够买瓶可乐压压惊
加班到凌晨 朋友圈只有外卖小哥点赞
这波属于是狠狠地破防了

周一开会 周二开会 周三还是开会
我的青春 全都贡献给了会议室
PPT做得再漂亮 也换不来一顿火锅钱
打工人 打工魂 打工都是人上人

下班打卡比中彩票还开心
周末双休对我来说是奢侈品
老板说要有梦想 我说我梦想不加班
他说年轻人要有冲劲 我说我冲向打卡机`,
    english: `【Funny Example - Overtime Theme】
Boss said he'd give me a raise, I almost flew out of my chair
Turns out it was 50 bucks, enough for a soda to calm my nerves
Worked till midnight, only the delivery guy liked my post
This is what they call being thoroughly destroyed

Monday meetings, Tuesday meetings, Wednesday still meetings
My youth, all donated to the conference room
PPT can be pretty, but can't buy hotpot
Workers rise, workers grind, workers are the real MVPs

Clocking out feels better than winning the lottery
Weekends off is luxury to me
Boss says dream big, I say I dream of no overtime
He says young people need drive, I say I'm driving to the time clock`,
  },
  ip: {
    chinese: `【IP混剪示例 - 漫威英雄】
钢铁侠的战甲 托尼的骄傲
美队的盾牌 正义的代号
雷神的锤子 闪电在咆哮
复仇者集结 这波太燃爆

十年布局 一集结
灭霸打响指 我们心碎裂
但英雄从不认输 哪怕粉身碎骨
终局之战 我们一起见证

斯坦李的微笑 永远的彩蛋
漫威宇宙 我们的青春答案
不论反派多强 英雄永不落幕
这就是漫威 永远的信仰`,
    english: `【IP Mashup Example - Marvel Heroes】
Iron Man's armor, Tony's pride
Cap's shield, justice personified
Thor's hammer, lightning roaring
Avengers assemble, this hits different

Ten years in the making, one epic gathering
Thanos snapped, our hearts shattered
But heroes never quit, even when broken
Endgame, we witnessed it together

Stan Lee's smile, the eternal easter egg
Marvel Universe, the answer to our youth
No matter how strong the villain, heroes never fade
This is Marvel, forever the faith`,
  },
  vlog: {
    chinese: `【日常Vlog示例 - 周末生活】
睡到自然醒 是最大的奢侈
外卖小哥 是我最亲的人
刷着短视频 虚度着光阴
这就是我的快乐肥宅生活

周末不出门 在家当咸鱼
空调配西瓜 简直绝绝子
猫咪趴腿上 我在追剧追到嗨
谁说一定要有社交 我觉得挺好

偶尔也会焦虑 看着同龄人都卷
但转念一想 人生苦短 及时行乐
今天的烦恼 今天解决
明天的烦恼...明天再说`,
    english: `【Vlog Example - Weekend Life】
Waking up naturally, the ultimate luxury
Delivery guy is my closest friend
Scrolling through videos, wasting time
This is my happy couch potato life

Weekend at home, being a lazy fish
AC plus watermelon, absolutely perfect
Cat on my lap, binge-watching shows
Who says I need social life? I'm doing great

Sometimes I get anxious, watching peers hustle
But then I think, life is short, enjoy it
Today's problems, solve today
Tomorrow's problems... let's talk tomorrow`,
  },
}

/**
 * 获取场景示例（根据语言返回）
 */
export function getSceneExample(scene: SceneType, language: 'chinese' | 'english' = 'chinese'): string {
  return LYRICS_EXAMPLES[scene]?.[language] || LYRICS_EXAMPLES.vlog[language]
}
```

**Step 2: 验证文件语法**

Run: `npx tsc --noEmit src/lib/ai/prompts/humor-techniques.ts`
Expected: 无错误输出

**Step 3: Commit**

```bash
git add src/lib/ai/prompts/humor-techniques.ts
git commit -m "feat: 添加 Few-Shot 歌词示例库

- 4种场景的中英文歌词示例
- 产品推广/搞笑洗脑/IP混剪/日常Vlog 各一个完整示例
- getSceneExample() 函数用于获取场景示例"
```

---

## Task 3: 重构 lyrics-prompts.ts 整合幽默技巧

**Files:**
- Modify: `src/lib/ai/prompts/lyrics-prompts.ts`

**Step 1: 添加 import 语句**

在文件顶部添加：

```typescript
import {
  getSceneHumorGuide,
  getSceneHumorGuideEnglish,
  getSceneExample,
} from './humor-techniques'
```

**Step 2: 重构 buildProductPrompt 函数**

将原来的 `buildProductPrompt` 函数替换为：

```typescript
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
```

**Step 3: 重构 buildFunnyPrompt 函数**

将原来的 `buildFunnyPrompt` 函数替换为：

```typescript
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
```

**Step 4: 重构 buildIPPrompt 函数**

将原来的 `buildIPPrompt` 函数替换为：

```typescript
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
```

**Step 5: 重构 buildVlogPrompt 函数**

将原来的 `buildVlogPrompt` 函数替换为：

```typescript
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
```

**Step 6: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无错误输出

**Step 7: Commit**

```bash
git add src/lib/ai/prompts/lyrics-prompts.ts
git commit -m "feat: 重构歌词 Prompt 整合幽默技巧

- 所有场景 Prompt 添加搞笑技巧指南
- 添加 Few-Shot 示例参考
- 添加质量要求（2-3种技巧 + 金句）
- 支持中英文双语"
```

---

## Task 4: 更新东北话方言 Prompt

**Files:**
- Modify: `src/lib/ai/prompts/dialect-dongbei.ts`

**Step 1: 添加 import 和更新 DONGBEI_DIALECT_PROMPT**

在文件顶部添加：

```typescript
import { getSceneHumorGuide, getSceneExample } from './humor-techniques'
```

**Step 2: 更新 DONGBEI_DIALECT_PROMPT 常量**

替换为：

```typescript
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
```

**Step 3: 更新 buildDongbeiProductPrompt 函数**

替换为：

```typescript
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
```

**Step 4: 更新 buildDongbeiFunnyPrompt 函数**

替换为：

```typescript
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
```

**Step 5: 更新 buildDongbeiIPPrompt 函数**

替换为：

```typescript
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
```

**Step 6: 更新 buildDongbeiVlogPrompt 函数**

替换为：

```typescript
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
```

**Step 7: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无错误输出

**Step 8: Commit**

```bash
git add src/lib/ai/prompts/dialect-dongbei.ts
git commit -m "feat: 更新东北话方言 Prompt 整合幽默技巧

- 添加东北话专属搞笑技巧指导
- 所有场景函数添加质量要求和示例
- 保持东北话特色幽默感"
```

---

## Task 5: 运行测试验证

**Files:**
- None (验证步骤)

**Step 1: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误输出

**Step 2: 运行现有测试**

Run: `npm test`
Expected: 所有测试通过

**Step 3: 启动开发服务器手动验证**

Run: `npm run dev`
Expected: 服务器正常启动

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: 验证歌词幽默优化功能"
```

---

## Task 6: 推送到远程仓库

**Files:**
- None

**Step 1: 推送所有提交**

Run: `git push origin main`
Expected: 推送成功

---

## 验收标准

- [ ] `humor-techniques.ts` 包含7种搞笑技巧定义
- [ ] `humor-techniques.ts` 包含场景-技巧映射
- [ ] `humor-techniques.ts` 包含4种场景的Few-Shot示例
- [ ] `lyrics-prompts.ts` 所有场景函数整合幽默技巧
- [ ] `dialect-dongbei.ts` 更新为幽默增强版
- [ ] TypeScript 编译无错误
- [ ] 所有测试通过
