'use client';

/**
 * 向导流程入口页面
 * WhyFire - 小红书 AI 教练
 */

import Link from 'next/link';
import { WIZARD_STEPS } from '@/lib/wizard/steps';

export default function WizardEntryPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-gradient mb-6">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M12 2L2 7v6c0 5.55 4.28 10.74 10 12 5.72-1.26 10-6.45 10-12V7l-10-5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-3">
            欢迎使用 WhyFire
          </h1>
          <p className="text-text-secondary">
            AI 教练帮你分析爆款笔记，找到差距，获得改进建议
          </p>
        </div>

        {/* 流程概览 */}
        <div className="bg-bg-card border border-border-default rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-6">
            向导流程概览
          </h2>
          <div className="space-y-3">
            {WIZARD_STEPS.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-4 p-3 bg-bg-secondary rounded-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-gradient/20 flex items-center justify-center text-lg flex-shrink-0">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-tertiary">Step {step.id}</span>
                    <h3 className="font-medium text-text-primary">{step.title}</h3>
                  </div>
                  <p className="text-sm text-text-tertiary truncate">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 开始按钮 */}
        <Link
          href="/step1-competitor"
          className="block w-full py-4 bg-accent-gradient text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-center"
        >
          开始分析
        </Link>

        {/* 提示 */}
        <p className="text-center text-sm text-text-tertiary mt-4">
          整个流程约需 5-10 分钟，数据将自动保存
        </p>
      </div>
    </div>
  );
}
