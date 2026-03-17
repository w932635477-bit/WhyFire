/**
 * 竞品分析 Prompt
 * 用于分析爆款笔记的成功要素
 */

import { XhsNoteData, CompetitorAnalysisResult } from '../types';

/**
 * 构建竞品分析 Prompt
 */
export function buildCompetitorPrompt(noteData: XhsNoteData): string {
  return `你是一位小红书内容分析专家,擅长拆解爆款笔记的成功要素。

请分析以下爆款笔记,并给出深度分析:

## 笔记信息
- 标题: ${noteData.title}
- 内容: ${noteData.description}
- 标签: ${noteData.tags.join(', ')}
- 图片数量: ${noteData.images.length}张
- 互动数据: ${noteData.likes}赞 ${noteData.collects}藏 ${noteData.comments}评论 ${noteData.shares}分享
- 作者: ${noteData.authorName} (粉丝: ${noteData.authorFollowers || '未知'})
- 发布时间: ${noteData.publishTime || '未知'}

## 分析要求
请从以下维度深度分析这篇笔记为什么能火:

1. **钩子强度** (1-10分)
   - 标题是否吸引人?
   - 是否有悬念/冲突/利益点?
   - 前3秒/第一眼能否留住用户?

2. **内容价值** (1-10分)
   - 是否解决了用户的痛点?
   - 是否提供了实用信息?
   - 是否有情感共鸣?

3. **视觉吸引力** (1-10分)
   - 图片/封面质量如何?
   - 视觉风格是否统一?
   - 是否有视觉记忆点?

4. **爆款潜力分析**
   - 为什么能火? (50字以内)
   - 核心传播点是什么?

5. **关键洞察** (3-5个)
   - 哪些元素值得借鉴?
   - 哪些技巧可以复用?

请以 JSON 格式输出分析结果:

{
  "hookScore": 数字,
  "contentScore": 数字,
  "visualScore": 数字,
  "viralPotential": "爆款潜力分析文字",
  "keyInsights": ["洞察1", "洞察2", "洞察3"],
  "contentCategory": "内容类别(如:美妆教程、生活分享、知识科普等)",
  "targetAudience": "目标受众描述",
  "emotionalHooks": ["情感钩子1", "情感钩子2"],
  "valueProposition": "价值主张(一句话总结)"
}

只输出 JSON,不要其他文字。`;
}

/**
 * 获取竞品分析的默认失败结果
 */
export function getDefaultCompetitorResult(): CompetitorAnalysisResult {
  return {
    hookScore: 0,
    contentScore: 0,
    visualScore: 0,
    viralPotential: '分析失败,请稍后重试',
    keyInsights: [],
    contentCategory: '未知',
    targetAudience: '未知',
    emotionalHooks: [],
    valueProposition: '分析失败',
  };
}
