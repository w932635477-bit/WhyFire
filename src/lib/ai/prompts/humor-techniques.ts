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
