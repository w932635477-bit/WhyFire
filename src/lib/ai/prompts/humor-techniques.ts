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
  vlog: ['selfDeprecation', 'twist', 'contrast'],
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
