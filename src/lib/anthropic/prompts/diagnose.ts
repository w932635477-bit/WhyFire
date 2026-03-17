/**
 * 内容诊断 Prompt
 * 用于分析用户笔记与竞品的差距
 */

import { XhsNoteData, DiagnosisResult, CompetitorAnalysisResult } from '../types';

/**
 * 构建内容诊断 Prompt
 */
export function buildDiagnosePrompt(
  userNoteData: XhsNoteData,
  competitorData: CompetitorAnalysisResult
): string {
  return `你是一位小红书内容教练,擅长诊断内容问题并给出改进建议。

## 用户笔记信息
- 标题: ${userNoteData.title}
- 内容: ${userNoteData.description}
- 标签: ${userNoteData.tags.join(', ')}
- 图片数量: ${userNoteData.images.length}张
- 互动数据: ${userNoteData.likes}赞 ${userNoteData.collects}藏 ${userNoteData.comments}评论 ${userNoteData.shares}分享
- 作者: ${userNoteData.authorName}

## 竞品分析参考
竞品是一篇${competitorData.contentCategory}类爆款笔记:
- 钩子强度: ${competitorData.hookScore}/10
- 内容价值: ${competitorData.contentScore}/10
- 视觉吸引力: ${competitorData.visualScore}/10
- 核心价值主张: ${competitorData.valueProposition}
- 成功要素: ${competitorData.keyInsights.join('; ')}

## 诊断要求
请对比用户笔记与竞品,给出诊断和改进建议:

1. **综合评分** (1-10分)
   - 基于标题、内容、视觉综合评估

2. **差距分析**
   - 钩子强度差距 (与竞品的差值, 可为负数)
   - 内容价值差距 (与竞品的差值, 可为负数)
   - 视觉吸引力差距 (与竞品的差值, 可为负数)

3. **改进建议** (按优先级排序)
   每个建议包含:
   - priority: HIGH/MEDIUM/LOW
   - category: 类别(如"标题优化"、"内容结构"、"视觉设计"等)
   - issue: 具体问题
   - suggestion: 改进建议

4. **优势与劣势**
   - strengths: 用户的3个优势
   - weaknesses: 用户的3个劣势

请以 JSON 格式输出:

{
  "overallScore": 数字,
  "hookGap": 数字,
  "contentGap": 数字,
  "visualGap": 数字,
  "improvements": [
    {
      "priority": "HIGH/MEDIUM/LOW",
      "category": "类别",
      "issue": "具体问题",
      "suggestion": "改进建议"
    }
  ],
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["劣势1", "劣势2", "劣势3"]
}

只输出 JSON, 不要其他文字。`;
}

/**
 * 获取内容诊断的默认失败结果
 */
export function getDefaultDiagnosisResult(): DiagnosisResult {
  return {
    overallScore: 0,
    hookGap: 0,
    contentGap: 0,
    visualGap: 0,
    improvements: [],
    strengths: [],
    weaknesses: ['分析失败,无法获取诊断结果'],
  };
}
