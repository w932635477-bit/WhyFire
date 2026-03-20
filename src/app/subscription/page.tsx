'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { PlanCard } from '@/components/subscription/plan-card'
import { SubscriptionModal } from '@/components/subscription/subscription-modal'
import { SUBSCRIPTION_PLANS, type SubscriptionPlan, type PlanType } from '@/types/subscription'

const PLANS_ARRAY = Object.values(SUBSCRIPTION_PLANS).filter(plan => plan.isEnabled)
const CURRENT_PLAN_ID: PlanType = 'free'

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
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id }),
      })

      if (response.ok) {
        setCurrentPlanId(selectedPlan.id)
        setShowModal(false)
        setSelectedPlan(null)
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setCurrentPlanId(selectedPlan.id)
        setShowModal(false)
        setSelectedPlan(null)
      }
    } catch (error) {
      console.error('订阅失败:', error)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setCurrentPlanId(selectedPlan.id)
      setShowModal(false)
      setSelectedPlan(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const features = ['无水印视频', '高清画质', '多种方言']

  return (
    <main className="min-h-screen bg-black py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-semibold mb-4"
          >
            <span className="gradient-text-white">选择订阅</span>{' '}
            <span className="gradient-text">计划</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400"
          >
            解锁更多功能，释放您的创作潜能
          </motion.p>
        </div>

        {/* 功能提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-8 mb-12"
        >
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">{feature}</span>
            </div>
          ))}
        </motion.div>

        {/* 计划卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS_ARRAY.sort((a, b) => a.sortOrder - b.sortOrder).map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <PlanCard
                plan={plan}
                onSelect={handleSelectPlan}
                isSelected={selectedPlan?.id === plan.id}
                isCurrentPlan={currentPlanId === plan.id}
                isProcessing={isProcessing}
              />
            </motion.div>
          ))}
        </div>

        {/* 常见问题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.06]"
        >
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">
            常见问题
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { q: '积分如何计算?', a: '每次生成视频消耗约 50 积分。免费用户每天获得 2 积分，付费用户每月获得固定积分。' },
              { q: '可以随时取消吗?', a: '是的，您可以随时取消订阅。取消后，您仍可使用当前计费周期内的剩余积分。' },
              { q: '积分会过期吗?', a: '购买的积分永久有效，不会过期。每月赠送的积分在当月有效。' },
              { q: '支持退款吗?', a: '如有问题请联系客服，我们会根据具体情况处理退款请求。' },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 底部说明 */}
        <div className="text-center mt-10 text-gray-600 text-sm">
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
