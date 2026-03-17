'use client';

/**
 * Step 3: 可视化对比页面
 * WhyFire - 小红书 AI 教练
 */

import StepNavigation from '@/components/wizard/step-navigation';

export default function ComparePage() {
  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col">
      {/* 页面标题 */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📊</span>
          <h1 className="text-2xl font-bold text-text-primary">可视化对比</h1>
        </div>
        <p className="text-text-secondary">
          一目了然地看到你与竞品的差距
        </p>
      </div>

      {/* 对比内容 */}
      <div className="px-6 flex-1">
        {/* 雷达图区域 */}
        <div className="bg-bg-card border border-border-default rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-6">多维度对比</h3>

          {/* 简化的雷达图展示 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: '钩子强度', you: 73, competitor: 88 },
              { label: '内容价值', you: 90, competitor: 95 },
              { label: '视觉吸引', you: 68, competitor: 90 },
              { label: '互动性', you: 75, competitor: 85 },
              { label: '原创性', you: 82, competitor: 80 },
              { label: '传播性', you: 70, competitor: 92 },
            ].map((item) => (
              <div key={item.label} className="bg-bg-secondary rounded-lg p-4 text-center">
                <div className="text-xs text-text-tertiary mb-2">{item.label}</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-text-tertiary">你的</div>
                    <div className="text-xl font-bold text-accent-primary">{item.you}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary">竞品</div>
                    <div className="text-xl font-bold text-green-primary">{item.competitor}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 核心差距总结 */}
        <div className="bg-bg-card border border-border-default rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">核心差距 Top 3</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-lg border-l-4 border-accent-primary">
              <div className="flex-shrink-0 w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center text-accent-primary font-bold">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-text-primary">传播性</span>
                  <span className="text-sm text-accent-primary">差距 -22</span>
                </div>
                <p className="text-sm text-text-secondary">内容缺乏易于分享的"金句"或"知识点"</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-lg border-l-4 border-yellow-primary">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-primary/20 rounded-full flex items-center justify-center text-yellow-primary font-bold">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-text-primary">视觉吸引力</span>
                  <span className="text-sm text-yellow-primary">差距 -22</span>
                </div>
                <p className="text-sm text-text-secondary">封面图片对比度和冲击力不足</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-lg border-l-4 border-purple-primary">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-primary/20 rounded-full flex items-center justify-center text-purple-primary font-bold">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-text-primary">钩子强度</span>
                  <span className="text-sm text-purple-primary">差距 -15</span>
                </div>
                <p className="text-sm text-text-secondary">标题缺少悬念和情感触发点</p>
              </div>
            </div>
          </div>
        </div>

        {/* 优先改进建议 */}
        <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎯</span>
            <h3 className="text-lg font-semibold text-text-primary">优先改进建议</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-primary/50 rounded-lg p-4">
              <h4 className="font-medium text-text-primary mb-2">短期（本周）</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• 重写标题，加入数字和悬念</li>
                <li>• 优化封面图，增加视觉冲击力</li>
              </ul>
            </div>
            <div className="bg-bg-primary/50 rounded-lg p-4">
              <h4 className="font-medium text-text-primary mb-2">中期（本月）</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• 提炼内容中的"金句"，增强传播性</li>
                <li>• 增加互动元素，引导评论和分享</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <StepNavigation
        currentStepId={3}
        completedSteps={[1, 2, 3]}
      />
    </div>
  );
}
