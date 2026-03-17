/**
 * Anthropic API 类型定义
 */

// 小红书笔记数据
export interface XhsNoteData {
  noteId: string;
  title: string;
  description: string;
  tags: string[];
  images: string[];
  likes: number;
  collects: number;
  comments: number;
  shares: number;
  authorName: string;
  authorId: string;
  authorFollowers?: number;
  publishTime?: string;
}

// 竞品分析结果
export interface CompetitorAnalysisResult {
  hookScore: number; // 钩子强度 1-10
  contentScore: number; // 内容价值 1-10
  visualScore: number; // 视觉吸引力 1-10
  viralPotential: string; // 爆款潜力分析
  keyInsights: string[]; // 关键洞察
  contentCategory: string; // 内容类别
  targetAudience: string; // 目标受众
  emotionalHooks: string[]; // 情感钩子
  valueProposition: string; // 价值主张
}

// 诊断结果
export interface DiagnosisResult {
  overallScore: number; // 综合评分 1-10
  hookGap: number; // 钩子强度差距
  contentGap: number; // 内容价值差距
  visualGap: number; // 视觉吸引力差距
  improvements: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    issue: string;
    suggestion: string;
  }[];
  strengths: string[]; // 优势
  weaknesses: string[]; // 劣势
}

// 灵感解读结果
export interface InspirationAnalysis {
  creativeInsight: string; // 创意要点
  keyElements: string[]; // 可借鉴元素
  emotionalTone: string; // 情绪风格
  localizationAdvice: string; // 本土化建议
  suggestedTitles: string[]; // 标题建议
  suggestedTags: string[]; // 标签建议
  relevanceScore: number; // 相关度评分 1-10
}

// 海外视频数据
export interface OverseasVideo {
  platform: 'youtube' | 'tiktok';
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnail: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
}

// 分析请求选项
export interface AnalyzeOptions {
  retries?: number;
  delay?: number;
  backoff?: boolean;
}

// 错误类型
export class AnalyzeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AnalyzeError';
  }
}
