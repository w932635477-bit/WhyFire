'use client'

import type { SubscriptionPlan } from '@/types/subscription'

interface PlanCardProps {
  plan: SubscriptionPlan
  onSelect: (plan: SubscriptionPlan) => void
  isSelected?: boolean
  isCurrentPlan?: boolean
  isProcessing?: boolean
}

/**
 * 订阅计划卡片组件
 * Subscription Plan Card Component
 */
export function PlanCard({
  plan,
  onSelect,
  isSelected = false,
  isCurrentPlan = false,
  isProcessing = false,
}: PlanCardProps) {
  // price 单位是分，转换为元
  const formatPrice = (priceInCents: number) => {
    if (priceInCents === 0) return '免费'
    return `¥${(priceInCents / 100).toFixed(0)}`
  }

  return (
    <div
      onClick={() => !isProcessing && !isCurrentPlan && onSelect(plan)}
      className={`
        relative p-6 rounded-2xl border-2 transition-all duration-300
        ${isCurrentPlan
          ? 'border-primary-500 bg-primary-500/10 cursor-default'
          : isSelected
            ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20 cursor-pointer'
            : 'border-dark-600 bg-dark-800 hover:border-primary-500/50 hover:bg-dark-700 cursor-pointer'
        }
        ${plan.isRecommended && !isCurrentPlan ? 'ring-2 ring-primary-500/30' : ''}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* 热门标签 */}
      {plan.isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold rounded-full shadow-lg whitespace-nowrap">
          最受欢迎
        </div>
      )}

      {/* 当前计划标签 */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-secondary text-white text-xs font-bold rounded-full shadow-lg whitespace-nowrap">
          当前计划
        </div>
      )}

      {/* 计划名称 */}
      <h3 className="text-xl font-bold text-white mb-2 mt-2">{plan.displayName}</h3>

      {/* 价格 */}
      <div className="mb-4">
        <span className="text-4xl font-bold text-primary-400">
          {formatPrice(plan.price)}
        </span>
        {plan.price > 0 && (
          <span className="text-gray-400 ml-1">/月</span>
        )}
      </div>

      {/* 描述 */}
      <p className="text-sm text-gray-400 mb-6 min-h-[2.5rem]">{plan.description}</p>

      {/* 功能列表 */}
      <ul className="space-y-3 mb-6">
        {plan.benefits.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* 购买按钮 */}
      <button
        disabled={isProcessing || isCurrentPlan}
        className={`
          w-full py-3 rounded-xl font-medium transition-all
          ${isCurrentPlan
            ? 'bg-dark-600 text-gray-400 cursor-default'
            : isSelected
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'bg-dark-600 text-gray-300 hover:bg-dark-500 hover:text-white'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isCurrentPlan
          ? '当前计划'
          : isProcessing
            ? '处理中...'
            : plan.price === 0
              ? '选择计划'
              : '立即订阅'}
      </button>
    </div>
  )
}
