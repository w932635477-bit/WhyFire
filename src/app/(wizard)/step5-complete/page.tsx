'use client';

/**
 * Step 5: 完成页面
 * WhyFire - 小红书 AI 教练
 */

import Link from 'next/link';

export default function CompletePage() {
  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col">
      {/* 页面标题 */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">✅</span>
          <h1 className="text-2xl font-bold text-text-primary">分析完成</h1>
        </div>
        <p className="text-text-secondary">
          恭喜！你已完成本次分析流程
        </p>
      </div>

      {/* 完成内容 */}
      <div className="px-6 flex-1">
        {/* 成功卡片 */}
        <div className="bg-gradient-to-br from-green-primary/20 to-green-secondary/10 border border-green-primary/30 rounded-xl p-8 mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-primary/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">分析完成！</h2>
          <p className="text-text-secondary mb-6">
            你已经完成了本次向导式分析，以下是你的收获
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bg-primary/50 rounded-lg p-4">
              <div className="text-3xl font-bold gradient-text">1</div>
              <div className="text-sm text-text-tertiary">竞品分析</div>
            </div>
            <div className="bg-bg-primary/50 rounded-lg p-4">
              <div className="text-3xl font-bold gradient-text">1</div>
              <div className="text-sm text-text-tertiary">内容诊断</div>
            </div>
            <div className="bg-bg-primary/50 rounded-lg p-4">
              <div className="text-3xl font-bold gradient-text">6</div>
              <div className="text-sm text-text-tertiary">核心差距</div>
            </div>
            <div className="bg-bg-primary/50 rounded-lg p-4">
              <div className="text-3xl font-bold gradient-text">6</div>
              <div className="text-sm text-text-tertiary">灵感收藏</div>
            </div>
          </div>
        </div>

        {/* 提醒卡片 */}
        <div className="bg-bg-card border border-border-default rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                下一步：拍完新内容再回来！
              </h3>
              <p className="text-text-secondary mb-4">
                根据本次分析的建议，优化你的内容。拍完新笔记后，回来再次诊断，看看进步了多少！
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="px-3 py-1.5 bg-bg-secondary rounded-lg text-sm text-text-secondary">
                  优化标题和封面
                </div>
                <div className="px-3 py-1.5 bg-bg-secondary rounded-lg text-sm text-text-secondary">
                  增加内容传播性
                </div>
                <div className="px-3 py-1.5 bg-bg-secondary rounded-lg text-sm text-text-secondary">
                  借鉴灵感创意
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button className="p-4 bg-bg-card border border-border-default rounded-xl hover:border-border-strong transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center group-hover:bg-accent-primary/30 transition-colors">
                <svg className="w-5 h-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-text-primary">收藏报告</div>
                <div className="text-xs text-text-tertiary">保存到个人中心</div>
              </div>
            </div>
          </button>

          <button className="p-4 bg-bg-card border border-border-default rounded-xl hover:border-border-strong transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-primary/20 flex items-center justify-center group-hover:bg-purple-primary/30 transition-colors">
                <svg className="w-5 h-5 text-purple-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-text-primary">导出报告</div>
                <div className="text-xs text-text-tertiary">下载 PDF 文档</div>
              </div>
            </div>
          </button>

          <Link href="/step1-competitor" className="p-4 bg-bg-card border border-border-default rounded-xl hover:border-border-strong transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-primary/20 flex items-center justify-center group-hover:bg-green-primary/30 transition-colors">
                <svg className="w-5 h-5 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-text-primary">新一轮分析</div>
                <div className="text-xs text-text-tertiary">重新开始流程</div>
              </div>
            </div>
          </Link>
        </div>

        {/* 历史记录入口 */}
        <div className="bg-gradient-to-r from-purple-primary/10 to-purple-secondary/10 border border-purple-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-primary/20 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">查看历史分析</h3>
                <p className="text-sm text-text-secondary">追踪你的进步轨迹</p>
              </div>
            </div>
            <button className="px-6 py-2.5 bg-purple-primary text-white font-semibold rounded-lg hover:bg-purple-secondary transition-colors">
              查看历史
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
