/**
 * AI 分析主函数
 * 封装所有 Claude API 分析功能
 */

import { claude, MODELS, MAX_TOKENS } from './client';
import {
  XhsNoteData,
  CompetitorAnalysisResult,
  DiagnosisResult,
  InspirationAnalysis,
  OverseasVideo,
  AnalyzeOptions,
  AnalyzeError,
} from './types';
import { buildCompetitorPrompt, getDefaultCompetitorResult } from './prompts/competitor';
import { buildDiagnosePrompt, getDefaultDiagnosisResult } from './prompts/diagnose';
import { buildInspirationPrompt, getDefaultInspirationResult } from './prompts/inspiration';

const DEFAULT_OPTIONS: AnalyzeOptions = {
  retries: 3,
  delay: 1000,
  backoff: true,
};

/**
 * 竞品分析
 * 使用 Claude Sonnet 进行深度分析
 *
 * @param noteData 竞品笔记数据
 * @param options 分析选项
 * @returns 竞品分析结果
 */
export async function analyzeCompetitor(
  noteData: XhsNoteData,
  options: AnalyzeOptions = DEFAULT_OPTIONS
): Promise<CompetitorAnalysisResult> {
  try {
    const prompt = buildCompetitorPrompt(noteData);
    const retries = options.retries ?? DEFAULT_OPTIONS.retries!;

    const result = await claude.callJSON<CompetitorAnalysisResult>(
      MODELS.SONNET,
      prompt,
      MAX_TOKENS.SONNET,
      retries
    );

    // 验证结果
    validateCompetitorResult(result);

    return result;
  } catch (error) {
    console.error('Competitor analysis failed:', error);

    // 如果是可重试的错误且已用尽重试次数,返回默认结果
    if (error instanceof AnalyzeError && error.retryable) {
      console.warn('All retries exhausted, returning default result');
    }

    return getDefaultCompetitorResult();
  }
}

/**
 * 内容诊断
 * 使用 Claude Sonnet 进行深度分析并对比竞品
 *
 * @param userNoteData 用户笔记数据
 * @param competitorData 竞品分析结果
 * @param options 分析选项
 * @returns 诊断结果
 */
export async function diagnoseContent(
  userNoteData: XhsNoteData,
  competitorData: CompetitorAnalysisResult,
  options: AnalyzeOptions = DEFAULT_OPTIONS
): Promise<DiagnosisResult> {
  try {
    const prompt = buildDiagnosePrompt(userNoteData, competitorData);
    const retries = options.retries ?? DEFAULT_OPTIONS.retries!;

    const result = await claude.callJSON<DiagnosisResult>(
      MODELS.SONNET,
      prompt,
      MAX_TOKENS.SONNET,
      retries
    );

    // 验证结果
    validateDiagnosisResult(result);

    return result;
  } catch (error) {
    console.error('Content diagnosis failed:', error);

    if (error instanceof AnalyzeError && error.retryable) {
      console.warn('All retries exhausted, returning default result');
    }

    return getDefaultDiagnosisResult();
  }
}

/**
 * 灵感解读
 * 使用 Claude Haiku 进行低成本分析
 *
 * @param video 海外视频数据
 * @param diagnosisContext 诊断上下文（可选,用于提高相关性）
 * @param options 分析选项
 * @returns 灵感解读结果
 */
export async function analyzeInspiration(
  video: OverseasVideo,
  diagnosisContext?: DiagnosisResult,
  options: AnalyzeOptions = DEFAULT_OPTIONS
): Promise<InspirationAnalysis> {
  try {
    const prompt = buildInspirationPrompt(video, diagnosisContext);
    const retries = options.retries ?? DEFAULT_OPTIONS.retries!;

    const result = await claude.callJSON<InspirationAnalysis>(
      MODELS.HAIKU,
      prompt,
      MAX_TOKENS.HAIKU,
      retries
    );

    // 验证结果
    validateInspirationResult(result);

    return result;
  } catch (error) {
    console.error('Inspiration analysis failed:', error);

    if (error instanceof AnalyzeError && error.retryable) {
      console.warn('All retries exhausted, returning default result');
    }

    return getDefaultInspirationResult();
  }
}

/**
 * 批量分析灵感视频
 * 用于 Step 4 海外创意灵感库
 *
 * @param videos 视频列表（6-10个）
 * @param diagnosisContext 诊断上下文
 * @param options 分析选项
 * @returns 灵感分析结果列表
 */
export async function analyzeInspirationBatch(
  videos: OverseasVideo[],
  diagnosisContext?: DiagnosisResult,
  options: AnalyzeOptions = DEFAULT_OPTIONS
): Promise<InspirationAnalysis[]> {
  // 并行分析所有视频
  const results = await Promise.all(
    videos.map(video =>
      analyzeInspiration(video, diagnosisContext, options).catch(error => {
        console.error(`Failed to analyze video ${video.videoId}:`, error);
        return getDefaultInspirationResult();
      })
    )
  );

  // 按相关度排序
  const sortedResults = results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return sortedResults;
}

// ==================== 验证函数 ====================

function validateCompetitorResult(result: CompetitorAnalysisResult): void {
  if (
    typeof result.hookScore !== 'number' ||
    typeof result.contentScore !== 'number' ||
    typeof result.visualScore !== 'number'
  ) {
    throw new AnalyzeError('Invalid competitor analysis result', 'VALIDATION_ERROR', false);
  }
}

function validateDiagnosisResult(result: DiagnosisResult): void {
  if (
    typeof result.overallScore !== 'number' ||
    !Array.isArray(result.improvements)
  ) {
    throw new AnalyzeError('Invalid diagnosis result', 'VALIDATION_ERROR', false);
  }
}

function validateInspirationResult(result: InspirationAnalysis): void {
  if (
    typeof result.creativeInsight !== 'string' ||
    !Array.isArray(result.keyElements)
  ) {
    throw new AnalyzeError('Invalid inspiration result', 'VALIDATION_ERROR', false);
  }
}
