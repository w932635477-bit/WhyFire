'use client';

/**
 * Step 1: 竞品分析页面
 * WhyFire - 小红书 AI 教练
 */

import { useState } from 'react';
import StepNavigation from '@/components/wizard/step-navigation';

export default function CompetitorPage() {
  const [noteUrl, setNoteUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleAnalyze = async () => {
    if (!noteUrl.trim()) return;

    setIsAnalyzing(true);
    // TODO: 调用竞品分析 API
    // 模拟分析过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
    setShowResult(true);
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col">
      {/* 页面标题 */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🎯</span>
          <h1 className="text-2xl font-bold text-text-primary">竞品分析</h1>
        </div>
        <p className="text-text-secondary">
          粘贴爆款笔记链接，AI 秒级分析标题、封面、正文、标签的爆款要素
        </p>
      </div>

      {/* 输入区域 */}
      <div className="px-6 mb-8">
        <div className="bg-bg-card border border-border-default rounded-xl p-6">
          <label className="block text-sm font-medium text-text-secondary mb-3">
            小红书笔记链接
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
              onClick={handleAnalyze}
              disabled={!noteUrl.trim() || isAnalyzing}
              className="px-6 py-3 bg-accent-gradient text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <span>开始分析</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 分析结果 */}
      {showResult && (
        <div className="px-6 flex-1">
          <div className="bg-bg-card border border-border-default rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-accent-gradient/20 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">分析结果</h3>
                <p className="text-sm text-text-tertiary">基于 AI 深度分析</p>
              </div>
            </div>

            {/* 评分卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="text-sm text-text-tertiary mb-1">综合评分</div>
                <div className="text-3xl font-bold gradient-text">92</div>
                <div className="text-xs text-green-primary mt-1">优秀</div>
              </div>
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="text-sm text-text-tertiary mb-1">钩子强度</div>
                <div className="text-3xl font-bold text-text-primary">88</div>
                <div className="w-full h-1.5 bg-border-default rounded-full mt-2">
                  <div className="h-full bg-accent-gradient rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="text-sm text-text-tertiary mb-1">内容价值</div>
                <div className="text-3xl font-bold text-text-primary">95</div>
                <div className="w-full h-1.5 bg-border-default rounded-full mt-2">
                  <div className="h-full bg-green-primary rounded-full" style={{ width: '95%' }} />
                </div>
              </div>
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="text-sm text-text-tertiary mb-1">视觉吸引力</div>
                <div className="text-3xl font-bold text-text-primary">90</div>
                <div className="w-full h-1.5 bg-border-default rounded-full mt-2">
                  <div className="h-full bg-purple-primary rounded-full" style={{ width: '90%' }} />
                </div>
              </div>
            </div>

            {/* 关键洞察 */}
            <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💡</span>
                <h4 className="font-semibold text-text-primary">关键洞察</h4>
              </div>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary mt-0.5">•</span>
                  <span>标题使用了数字 + 疑问句的组合，有效激发好奇心</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary mt-0.5">•</span>
                  <span>封面采用高对比色 + 人物特写，视觉冲击力强</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary mt-0.5">•</span>
                  <span>内容结构清晰，有明确的价值点和行动建议</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <StepNavigation
        currentStepId={1}
        completedSteps={showResult ? [1] : []}
        nextDisabled={!showResult}
      />
    </div>
  );
}
