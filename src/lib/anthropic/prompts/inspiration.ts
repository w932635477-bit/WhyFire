/**
 * 灵感解读 Prompt
 * 用于分析海外爆款视频并给出本土化建议
 */

import { InspirationAnalysis, OverseasVideo, DiagnosisResult } from '../types';

/**
 * 构建灵感解读 Prompt
 */
export function buildInspirationPrompt(
  video: OverseasVideo,
  diagnosisContext?: DiagnosisResult
): string {
  const contextInfo = diagnosisContext
    ? `
## 用户背景参考
用户的内容诊断结果:
- 综合评分: ${diagnosisContext.overallScore}/10
- 主要劣势: ${diagnosisContext.weaknesses.slice(0, 2).join('; ')}
- 需要改进的方向: ${diagnosisContext.improvements
        .filter(imp => imp.priority === 'HIGH')
        .map(imp => imp.category)
        .join(', ')}
`
    : '';

  return `你是一位跨平台内容创作专家,擅长将海外爆款内容本土化到小红书。

## 视频信息
- 平台: ${video.platform === 'youtube' ? 'YouTube' : 'TikTok'}
- 标题: ${video.title}
- 描述: ${video.description}
- 标签: ${video.tags.join(', ')}
- 观看量: ${video.viewCount} 观看
- 点赞: ${video.likeCount} 赞
- 评论: ${video.commentCount} 评论
- 作者: ${video.channelName}
${contextInfo}

## 分析要求
请分析这个海外爆款视频,并给出小红书本土化建议:

1. **创意要点** (50字以内)
   - 这个视频的核心创意是什么?
   - 为什么能火?

2. **可借鉴元素** (3-5个)
   - 具体哪些元素可以复用?
   - 如: 选题角度、拍摄手法、叙事结构、视觉风格等

3. **情绪风格**
   - 视频的情绪基调是什么?
   - 如: 轻松搞笑、知识干货、情感共鸣、视觉震撼等

4. **本土化建议** (100字以内)
   - 如何改编到小红书?
   - 需要注意什么文化差异?

5. **标题建议** (3个)
   - 符合小红书风格的标题
   - 带有钩子和吸引力

6. **标签建议** (5个)
   - 适合小红书的话题标签
   - 流量标签 + 精准标签

7. **相关度评分** (1-10分)
   - 与用户当前内容方向的相关度
   - ${diagnosisContext ? '考虑用户的改进需求' : '一般相关性评估'}

请以 JSON 格式输出:

{
  "creativeInsight": "创意要点",
  "keyElements": ["元素1", "元素2", "元素3"],
  "emotionalTone": "情绪风格",
  "localizationAdvice": "本土化建议",
  "suggestedTitles": ["标题1", "标题2", "标题3"],
  "suggestedTags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
  "relevanceScore": 数字
}

只输出 JSON, 不要其他文字。`;
}

/**
 * 获取灵感解读的默认失败结果
 */
export function getDefaultInspirationResult(): InspirationAnalysis {
  return {
    creativeInsight: '分析失败,请稍后重试',
    keyElements: [],
    emotionalTone: '未知',
    localizationAdvice: '无法生成建议',
    suggestedTitles: [],
    suggestedTags: [],
    relevanceScore: 0,
  };
}
