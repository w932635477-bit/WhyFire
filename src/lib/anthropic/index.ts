/**
 * Anthropic AI 分析模块
 * 导出所有 AI 分析相关功能
 */

// 类型定义
export type {
  XhsNoteData,
  CompetitorAnalysisResult,
  DiagnosisResult,
  InspirationAnalysis,
  OverseasVideo,
  AnalyzeOptions,
} from './types';

export { AnalyzeError } from './types';

// 客户端
export { claude, getClaudeClient, MODELS, MAX_TOKENS } from './client';

// 分析函数
export {
  analyzeCompetitor,
  diagnoseContent,
  analyzeInspiration,
  analyzeInspirationBatch,
} from './analyze';

// Prompt 构建函数（高级用户可用）
export {
  buildCompetitorPrompt,
  getDefaultCompetitorResult,
} from './prompts/competitor';

export {
  buildDiagnosePrompt,
  getDefaultDiagnosisResult,
} from './prompts/diagnose';

export {
  buildInspirationPrompt,
  getDefaultInspirationResult,
} from './prompts/inspiration';
