'use client';

/**
 * Step 2: 内容诊断页面
 * WhyFire - 小红书 AI 教练
 */

import { useState } from 'react';
import StepNavigation from '@/components/wizard/step-navigation';

export default function DiagnosePage() {
  const [noteUrl, setNoteUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleDiagnose = async () => {
    if (!noteUrl.trim()) return;

    setIsAnalyzing(true);
    // TODO: 调用内容诊断 API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
    setShowResult(true);
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col">
      {/* 页面标题 */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔍</span>
          <h1 className="text-2xl font-bold text-text-primary">内容诊断</h1>
        </div>
        <p className="text-text-secondary">
          分析你的笔记内容，对比竞品找出真实差距
        </p>
      </div>

      {/* 输入区域 */}
      <div className="px-6 mb-8">
        <div className="bg-bg-card border border-border-default rounded-xl p-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">
            你的小红书笔记链接
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={noteUrl}
              onChange={(e) => setNoteUrl(e.target.value)}
              placeholder="https://www.xiaohongshu.com/explore/..."
              className="flex-1 px-4 py-3 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-colors"
            />
            <button
              onClick={handleDiagnose}
              disabled={!noteUrl.trim() || isAnalyzing}
              className="px-6 py-3 bg-accent-gradient text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>诊断中...</span>
                </>
              ) : (
                <>
                  <span>开始诊断</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 诊断结果 */}
      {showResult && (
        <div className="px-6 flex-1">
          <div className="bg-bg-card border border-border-default rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-purple-primary/20 flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">诊断报告</h3>
                <p className="text-sm text-text-tertiary">你的内容 vs 竞品对比</p>
              </div>
            </div>

            {/* 差距对比 */}
            <div className="space-y-4 mb-6">
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">钩子强度</span>
                  <span className="text-sm font-medium text-accent-primary">差距 -15</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-text-tertiary mb-1">你的</div>
                    <div className="w-full h-2 bg-border-default rounded-full">
                      <div className="h-full bg-accent-gradient rounded-full" style={{ width: '73%' }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-text-tertiary mb-1">竞品</div>
                    <div className="w-full h-2 bg-border-default rounded-full">
                      <div className="h-full bg-green-primary rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">内容价值</span>
                  <span className="text-sm font-medium text-text-tertiary">差距 -5</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-text-tertiary mb-1">你的</div>
                    <div className="w-full h-2 bg-border-default rounded-full">
                      <div className="h-full bg-accent-gradient rounded-full" style={{ width: '90%' }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-text-tertiary mb-1">竞品</div>
                    <div className="w-full h-2 bg-border-default rounded-full">
                      <div className="h-full bg-green-primary rounded-full" style={{ width: '95%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">视觉吸引力</span>
                  <span className="text-sm font-medium text-accent-primary">差距 -22</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-text-tertiary mb-1">你的</div>
                    <div className="w-full h-2 bg-border-default rounded-full">
                      <div className="h-full bg-accent-gradient rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-text-tertiary mb-1">竞品</div>
                    <div className="w-full h-2 bg-border-default rounded-full">
                      <div className="h-full bg-green-primary rounded-full" style={{ width: '90%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 改进建议 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary">改进建议</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded">高优先</span>
                  <p className="text-sm text-text-secondary">优化标题：添加数字或疑问句，提升吸引力</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-primary/10 border border-yellow-primary/20 rounded-lg">
                  <span className="px-2 py-0.5 bg-yellow-primary/20 text-yellow-primary text-xs font-medium rounded">中优先</span>
                  <p className="text-sm text-text-secondary">改进封面：使用更鲜明的对比色和人物特写</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-primary/10 border border-green-primary/20 rounded-lg">
                  <span className="px-2 py-0.5 bg-green-primary/20 text-green-primary text-xs font-medium rounded">低优先</span>
                  <p className="text-sm text-text-secondary">增加互动：在文末添加提问或引导评论</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <StepNavigation
        currentStepId={2}
        completedSteps={showResult ? [1, 2] : [1]}
        nextDisabled={!showResult}
      />
    </div>
  );
}
