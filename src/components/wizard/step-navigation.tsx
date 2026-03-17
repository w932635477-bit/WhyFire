'use client';

/**
 * 步骤导航组件
 * WhyFire - 小红书 AI 教练
 */

import Link from 'next/link';
import { WIZARD_STEPS, getNextStep, getPrevStep } from '@/lib/wizard/steps';

interface StepNavigationProps {
  currentStepId: number;
  completedSteps: number[];
  nextDisabled?: boolean;
  prevDisabled?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function StepNavigation({
  currentStepId,
  completedSteps,
  nextDisabled = false,
  prevDisabled = false,
  onNext,
  onPrev,
}: StepNavigationProps) {
  const currentStep = WIZARD_STEPS.find(s => s.id === currentStepId);
  const prevStepId = getPrevStep(currentStepId);
  const nextStepId = getNextStep(currentStepId);

  const prevStep = prevStepId ? WIZARD_STEPS.find(s => s.id === prevStepId) : null;
  const nextStep = nextStepId ? WIZARD_STEPS.find(s => s.id === nextStepId) : null;

  const canGoBack = prevStepId !== null && !prevDisabled;
  const canGoNext = nextStepId !== null && !nextDisabled;

  return (
    <div className="bg-bg-tertiary border-t border-border-subtle sticky bottom-0">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 左侧：上一步按钮 */}
          <div className="flex-1">
            {canGoBack && prevStep && (
              onPrev ? (
                <button
                  onClick={onPrev}
                  className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">上一步</span>
                  <span className="sm:hidden">{prevStep.title}</span>
                </button>
              ) : (
                <Link
                  href={prevStep.path}
                  className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">上一步</span>
                  <span className="sm:hidden">{prevStep.title}</span>
                </Link>
              )
            )}
          </div>

          {/* 中间：提示文字 */}
          <div className="flex-1 text-center">
            <p className="text-sm text-text-tertiary">
              点击进度条可跳转到任意步骤
            </p>
          </div>

          {/* 右侧：下一步按钮 */}
          <div className="flex-1 flex justify-end">
            {canGoNext && nextStep && (
              onNext ? (
                <button
                  onClick={onNext}
                  disabled={nextDisabled}
                  className="flex items-center gap-2 px-6 py-2.5 bg-accent-gradient text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="hidden sm:inline">
                    {nextStepId === 5 ? '完成' : `下一步：${nextStep.title}`}
                  </span>
                  <span className="sm:hidden">{nextStep.title}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <Link
                  href={nextStep.path}
                  className={`flex items-center gap-2 px-6 py-2.5 bg-accent-gradient text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${
                    nextDisabled ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <span className="hidden sm:inline">
                    {nextStepId === 5 ? '完成' : `下一步：${nextStep.title}`}
                  </span>
                  <span className="sm:hidden">{nextStep.title}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
