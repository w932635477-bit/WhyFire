'use client'

import type { SubscriptionPlan } from '@/types/subscription'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPlan: SubscriptionPlan | null
  onConfirm: () => void
  isProcessing?: boolean
}

/**
 * 订阅确认弹窗组件
 * Subscription Confirmation Modal Component
 */
export function SubscriptionModal({
  isOpen,
  onClose,
  selectedPlan,
  onConfirm,
  isProcessing = false,
}: SubscriptionModalProps) {
  if (!isOpen || !selectedPlan) return null

  // price 单位是分，转换为元
  const formatPrice = (priceInCents: number) => {
    if (priceInCents === 0) return '免费'
    return `¥${(priceInCents / 100).toFixed(0)}/月`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-dark-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-dark-600 animate-slide-up">
        {/* 关闭按钮 */}
        {!isProcessing && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">确认订阅</h3>
          <p className="text-gray-400 mt-1">请确认您的订阅计划</p>
        </div>

        {/* 计划详情 */}
        <div className="bg-dark-700 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-dark-600">
            <span className="text-gray-400">计划名称</span>
            <span className="text-white font-semibold">{selectedPlan.displayName}</span>
          </div>
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-dark-600">
            <span className="text-gray-400">每月积分</span>
            <span className="text-white font-semibold">{selectedPlan.benefits.credits} 积分</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">月费</span>
            <span className="text-primary-400 font-bold text-xl">
              {formatPrice(selectedPlan.price)}
            </span>
          </div>
        </div>

        {/* 功能摘要 */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">包含功能:</p>
          <div className="flex flex-wrap gap-2">
            {selectedPlan.benefits.features.slice(0, 4).map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-dark-700 text-gray-300 text-xs rounded-lg"
              >
                {feature}
              </span>
            ))}
            {selectedPlan.benefits.features.length > 4 && (
              <span className="px-2 py-1 bg-dark-700 text-gray-400 text-xs rounded-lg">
                +{selectedPlan.benefits.features.length - 4} 项
              </span>
            )}
          </div>
        </div>

        {/* 提示 */}
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-300">
            <span className="text-primary-400 font-medium">提示:</span>{' '}
            订阅后立即生效，每月自动续费。您可以随时取消订阅。
          </p>
        </div>

        {/* 按钮组 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 bg-dark-600 text-gray-300 rounded-xl font-medium hover:bg-dark-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                处理中...
              </span>
            ) : (
              '确认支付'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
