/**
 * 向导式流程步骤配置
 * WhyFire - 小红书 AI 教练
 */

export const WIZARD_STEPS = [
  {
    id: 1,
    slug: 'competitor',
    title: '竞品分析',
    description: '分析爆款笔记，拆解成功要素',
    icon: '🎯',
    required: true,
    path: '/step1-competitor',
  },
  {
    id: 2,
    slug: 'diagnose',
    title: '内容诊断',
    description: '分析自己的内容，找出差距',
    icon: '🔍',
    required: true,
    path: '/step2-diagnose',
  },
  {
    id: 3,
    slug: 'compare',
    title: '可视化对比',
    description: '对比差距，一目了然',
    icon: '📊',
    required: true,
    path: '/step3-compare',
  },
  {
    id: 4,
    slug: 'inspiration',
    title: '灵感推荐',
    description: '精选 6-10 个相关海外爆款',
    icon: '💡',
    required: false,
    path: '/step4-inspiration',
  },
  {
    id: 5,
    slug: 'complete',
    title: '完成',
    description: '查看报告，再次诊断提醒',
    icon: '✅',
    required: true,
    path: '/step5-complete',
  },
] as const;

export type WizardStep = typeof WIZARD_STEPS[number];

/**
 * 获取下一步
 */
export function getNextStep(currentStepId: number): number | null {
  if (currentStepId >= WIZARD_STEPS.length) {
    return null;
  }
  return currentStepId + 1;
}

/**
 * 获取上一步
 */
export function getPrevStep(currentStepId: number): number | null {
  if (currentStepId <= 1) {
    return null;
  }
  return currentStepId - 1;
}

/**
 * 根据路径获取步骤信息
 */
export function getStepByPath(path: string): WizardStep | undefined {
  return WIZARD_STEPS.find(step => step.path === path);
}

/**
 * 根据步骤 ID 获取步骤信息
 */
export function getStepById(id: number): WizardStep | undefined {
  return WIZARD_STEPS.find(step => step.id === id);
}
