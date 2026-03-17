'use client';

/**
 * 向导式流程布局
 * WhyFire - 小红书 AI 教练
 */

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ProgressBar from '@/components/wizard/progress-bar';
import { WIZARD_STEPS, type WizardStep } from '@/lib/wizard/steps';

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // 从URL路径推断当前步骤
  const getCurrentStepId = (): number => {
    const step = WIZARD_STEPS.find(s => pathname.includes(s.slug));
    return step?.id ?? 1;
  };

  const currentStepId = getCurrentStepId();

  const handleStepClick = (step: WizardStep) => {
    // 只能跳转到已完成或当前步骤
    if (completedSteps.includes(step.id) || step.id === currentStepId) {
      router.push(step.path);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-bg-secondary border-b border-border-subtle sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-gradient flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7v6c0 5.55 4.28 10.74 10 12 5.72-1.26 10-6.45 10-12V7l-10-5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">WhyFire</h1>
                <p className="text-xs text-text-tertiary">小红书 AI 教练</p>
              </div>
            </div>

            {/* 右侧操作 */}
            <div className="flex items-center gap-4">
              <button className="text-text-secondary hover:text-text-primary transition-colors text-sm">
                保存进度
              </button>
              <button className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong transition-all text-sm">
                退出向导
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 进度条 */}
      <ProgressBar
        currentStepId={currentStepId}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
