/**
 * 向导式流程类型定义
 * WhyFire - 小红书 AI 教练
 */

/**
 * 步骤状态
 */
export type StepStatus = 'pending' | 'active' | 'completed' | 'locked';

/**
 * 步骤数据
 */
export interface StepData {
  stepId: number;
  status: StepStatus;
  completedAt?: Date;
  data?: unknown;
}

/**
 * 向导会话数据
 */
export interface WizardSession {
  id: string;
  userId?: string;
  currentStep: number;
  createdAt: Date;
  updatedAt: Date;

  // Step 1: 竞品分析
  competitorAnalysis?: {
    noteUrl: string;
    noteData: NoteData;
    result: CompetitorAnalysisResult;
  };

  // Step 2: 内容诊断
  selfDiagnosis?: {
    noteUrl: string;
    noteData: NoteData;
    result: DiagnosisResult;
  };

  // Step 3: 可视化对比
  comparison?: {
    radarChart: RadarChartData;
    gapAnalysis: GapAnalysis;
  };

  // Step 4: 灵感推荐
  inspirations?: {
    videos: InspirationVideo[];
    selectedIds: string[];
  };

  // Step 5: 完成
  completedAt?: Date;
  reportUrl?: string;
}

/**
 * 笔记数据
 */
export interface NoteData {
  id: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  collects: number;
  comments: number;
  shares: number;
  coverImage?: string;
  tags?: string[];
  createdAt?: Date;
}

/**
 * 竞品分析结果
 */
export interface CompetitorAnalysisResult {
  overallScore: number;
  hookScore: number;
  contentScore: number;
  visualScore: number;
  engagementScore: number;
  keyInsights: string[];
  strengths: string[];
  suggestions: string[];
}

/**
 * 诊断结果
 */
export interface DiagnosisResult {
  overallScore: number;
  gapVsCompetitor: {
    hook: number;
    content: number;
    visual: number;
    engagement: number;
  };
  improvements: {
    priority: 'high' | 'medium' | 'low';
    area: string;
    suggestion: string;
  }[];
}

/**
 * 雷达图数据
 */
export interface RadarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

/**
 * 差距分析
 */
export interface GapAnalysis {
  gaps: {
    area: string;
    yourScore: number;
    competitorScore: number;
    gap: number;
  }[];
  topGaps: string[];
  recommendations: string[];
}

/**
 * 灵感视频
 */
export interface InspirationVideo {
  id: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
  title: string;
  thumbnail: string;
  author: string;
  views: number;
  likes: number;
  duration: string;
  url: string;
  insight: string;
  localizationTip: string;
  borrowableElements: string[];
}
