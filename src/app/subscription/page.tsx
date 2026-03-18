'use client'

import { useState } from 'react'
import { PlanCard } from '@/components/subscription/plan-card'
import { SubscriptionModal } from '@/components/subscription/subscription-modal'
import { SUBSCRIPTION_PLANS, type SubscriptionPlan, type PlanType } from '@/types/subscription'

// 将 Record 转换为数组
const PLANS_ARRAY = Object.values(SUBSCRIPTION_PLANS).filter(plan => plan.isEnabled)

// 模拟当前用户计划
const CURRENT_PLAN_ID: PlanType = 'free'

/**
 * 订阅计划页面
 * Subscription Plans Page
 */
export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPlanId, setCurrentPlanId] = useState<PlanType>(CURRENT_PLAN_ID)

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (!isProcessing) {
      setShowModal(false)
      setSelectedPlan(null)
    }
  }

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return

    setIsProcessing(true)

    try {
      // 模拟支付流程
      // 实际项目中应调用支付 API
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id }),
      })

      if (response.ok) {
        // 支付成功，更新当前计划
        setCurrentPlanId(selectedPlan.id)
        setShowModal(false)
        setSelectedPlan(null)
      } else {
        // 如果 API 不存在，模拟成功
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setCurrentPlanId(selectedPlan.id)
        setShowModal(false)
        setSelectedPlan(null)
      }
    } catch (error) {
      console.error('订阅失败:', error)
      // 模拟成功用于演示
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setCurrentPlanId(selectedPlan.id)
      setShowModal(false)
      setSelectedPlan(null)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="min-h-screen bg-dark-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">选择订阅计划</h1>
          <p className="text-gray-400 text-lg">
            解锁更多功能，释放您的创作潜能
          </p>
        </div>

        {/* 计划对比提示 */}
        <div className="flex justify-center gap-6 mb-8 text-sm">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-secondary"
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
            <span className="text-gray-400">无水印视频</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-secondary"
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
            <span className="text-gray-400">高清画质</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-secondary"
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
            <span className="text-gray-400">多种方言</span>
          </div>
        </div>

        {/* 计划卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANS_ARRAY.sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={handleSelectPlan}
              isSelected={selectedPlan?.id === plan.id}
              isCurrentPlan={currentPlanId === plan.id}
              isProcessing={isProcessing}
            />
          ))}
        </div>

        {/* 常见问题 */}
        <div className="bg-dark-800 rounded-2xl p-8 border border-dark-600">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            常见问题
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-medium mb-2">积分如何计算?</h3>
              <p className="text-gray-400 text-sm">
                每次生成视频消耗约 50 积分。免费用户每天获得 2 积分，付费用户每月获得固定积分。
              </p>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">可以随时取消吗?</h3>
              <p className="text-gray-400 text-sm">
                是的，您可以随时取消订阅。取消后，您仍可使用当前计费周期内的剩余积分。
              </p>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">积分会过期吗?</h3>
              <p className="text-gray-400 text-sm">
                购买的积分永久有效，不会过期。每月赠送的积分在当月有效。
              </p>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">支持退款吗?</h3>
              <p className="text-gray-400 text-sm">
                如有问题请联系客服，我们会根据具体情况处理退款请求。
              </p>
            </div>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>如有疑问，请联系客服 support@whyfire.ai</p>
        </div>
      </div>

      {/* 订阅确认弹窗 */}
      <SubscriptionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        selectedPlan={selectedPlan}
        onConfirm={handleConfirmSubscription}
        isProcessing={isProcessing}
      />
    </main>
  )
}
