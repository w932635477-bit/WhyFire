/**
 * Claude API 封装
 * 使用 Claude Haiku 进行文本分析和本土化建议生成
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface VideoAnalysis {
  creativeInsight: string;
  keyElements: string[];
  emotionalTone: string;
  localizationAdvice: string;
  suggestedTitles: string[];
  suggestedTags: string[];
}

/**
 * 分析视频内容并生成本土化建议
 */
export async function analyzeVideo(
  title: string,
  description: string,
  tags: string[],
  platform: "youtube" | "tiktok"
): Promise<VideoAnalysis> {
  const prompt = `你是一个小红书内容创作专家。请分析以下${platform === "youtube" ? "YouTube" : "TikTok"}热门视频，并给出本土化建议。

视频标题：${title}
视频描述：${description}
标签：${tags.join(", ")}

请以 JSON 格式输出分析结果，包含以下字段：
1. creativeInsight: 创意要点（50字以内）
2. keyElements: 可复制元素（3-5个）
3. emotionalTone: 情绪风格
4. localizationAdvice: 小红书本土化建议（100字以内）
5. suggestedTitles: 3个小红书风格标题建议
6. suggestedTags: 5个推荐话题标签

只输出 JSON，不要其他文字。`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-3-5-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // 解析 JSON 响应
  try {
    // 尝试提取 JSON 部分
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    return JSON.parse(jsonMatch[0]) as VideoAnalysis;
  } catch {
    // 返回默认值
    return {
      creativeInsight: "分析失败，请重试",
      keyElements: [],
      emotionalTone: "未知",
      localizationAdvice: "无法生成建议",
      suggestedTitles: [],
      suggestedTags: [],
    };
  }
}
