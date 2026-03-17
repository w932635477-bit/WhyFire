'use client';

/**
 * 向导进度条组件
 * WhyFire - 小红书 AI 教练
 *
 * 使用 React.memo 优化，避免不必要的重新渲染
 */

import { memo, useCallback, useMemo } from 'react';
import { WIZARD_STEPS, type WizardStep } from '@/lib/wizard/steps';

interface ProgressBarProps {
  currentStepId: number;
  completedSteps: number[];
  onStepClick?: (step: WizardStep) => void;
}

/**
 * 步骤状态类型
 */
type StepStatus = 'completed' | 'active' | 'pending';

/**
 * 进度条组件
 */
function ProgressBarComponent({
  currentStepId,
  completedSteps,
  onStepClick,
}: ProgressBarProps) {
  // 使用 useMemo 缓存步骤状态计算
  const stepStatuses = useMemo(() => {
    return WIZARD_STEPS.map((step) => ({
      step,
      status: getStepStatus(step, completedSteps, currentStepId),
    }));
  }, [completedSteps, currentStepId]);

  // 使用 useCallback 缓存点击处理函数
  const handleStepClick = useCallback(
    (step: WizardStep) => {
      if (onStepClick) {
        onStepClick(step);
      }
    },
    [onStepClick]
  );

  return (
    <div className="bg-bg-tertiary border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center gap-2 overflow-x-auto">
          {stepStatuses.map(({ step, status }, index) => {
            const isLast = index === WIZARD_STEPS.length - 1;

            return (
              <StepItem
                key={step.id}
                step={step}
                status={status}
                isLast={isLast}
                isCompleted={completedSteps.includes(step.id)}
                onClick={handleStepClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 单个步骤项组件（提取为独立组件以优化渲染）
 */
interface StepItemProps {
  step: WizardStep;
  status: StepStatus;
  isLast: boolean;
  isCompleted: boolean;
  onClick: (step: WizardStep) => void;
}

const StepItem = memo(function StepItem({
  step,
  status,
  isLast,
  isCompleted,
  onClick,
}: StepItemProps) {
  return (
    <div className="flex items-center">
      {/* 步骤按钮 */}
      <button
        onClick={() => onClick(step)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg transition-all
          ${status === 'active' ? 'bg-accent-primary/20' : ''}
          ${status === 'completed' ? 'text-green-primary' : ''}
          ${status === 'pending' ? 'text-text-tertiary hover:bg-bg-card' : ''}
          ${status === 'active' ? 'text-text-primary' : ''}
        `}
      >
        {/* 步骤数字/图标 */}
        <span
          className={`
            flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold
            ${status === 'completed' ? 'bg-green-primary text-white' : ''}
            ${status === 'active' ? 'bg-accent-primary text-white' : ''}
            ${status === 'pending' ? 'bg-bg-card text-text-tertiary' : ''}
          `}
        >
          {status === 'completed' ? '✓' : step.id}
        </span>

        {/* 步骤标题 */}
        <span
          className={`
            text-sm font-medium hidden sm:inline
            ${status === 'active' ? 'text-text-primary' : ''}
            ${status === 'completed' ? 'text-green-primary' : ''}
            ${status === 'pending' ? 'text-text-tertiary' : ''}
          `}
        >
          {step.title}
        </span>
      </button>

      {/* 连接线 */}
      {!isLast && (
        <div
          className={`
            w-10 h-0.5 mx-2
            ${isCompleted ? 'bg-green-primary' : 'bg-border-default'}
          `}
        />
      )}
    </div>
  );
});

/**
 * 获取步骤状态
 */
function getStepStatus(
  step: WizardStep,
  completedSteps: number[],
  currentStepId: number
): StepStatus {
  if (completedSteps.includes(step.id)) return 'completed';
  if (step.id === currentStepId) return 'active';
  return 'pending';
}

// 使用 memo 包装导出的组件
const ProgressBar = memo(ProgressBarComponent);

export default ProgressBar;
