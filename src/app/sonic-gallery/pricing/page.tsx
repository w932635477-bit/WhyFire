'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/components/providers/auth-provider'
import { PaymentModal } from '@/components/features/payment/payment-modal'

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  original_price: number | null
  bonus: number
  popular: boolean
  description: string
}

const faqs = [
  {
    q: '积分有什么用？',
    a: '每次使用 AI 翻唱、MV 生成、歌词创作等功能会消耗积分。不同功能消耗不同数量的积分。',
  },
  {
    q: '积分会过期吗？',
    a: '购买的积分永久有效，不会过期。您可以放心囤积。',
  },
  {
    q: '可以退款吗？',
    a: '已购买的积分包不支持退款。已使用的积分无法退回。请根据实际需求选择合适的套餐。',
  },
  {
    q: '支持什么支付方式？',
    a: '目前支持微信支付。桌面端扫码支付，手机端可直接唤起微信支付。',
  },
  {
    q: '每次翻唱消耗多少积分？',
    a: '单次方言翻唱消耗 2 积分，MV 视频生成消耗 3 积分。具体消耗以页面提示为准。',
  },
]

export default function PricingPage() {
  const { user, loading: authLoading } = useAuthContext()
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/payment/packages')
      .then(res => res.json())
      .then(res => {
        if (res.code === 0) {
          setPackages(res.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-40 bg-black/70 backdrop-blur-[40px] rounded-b-2xl">
        <div className="max-w-[640px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/sonic-gallery" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[15px] font-extrabold tracking-tighter text-white">定价</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#10B981] shrink-0" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-white">Pricing</span>
          </div>

          <div className="w-5 h-5 rounded bg-white flex items-center justify-center shrink-0">
            <span className="text-black text-[9px] font-black leading-none">W</span>
          </div>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-6 pt-24 pb-32">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-[32px] sm:text-[40px] font-extrabold tracking-[-0.03em] mb-4">
            选择你的
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">创作套餐</span>
          </h1>
          <p className="text-white/40 text-[15px] max-w-sm mx-auto leading-[1.7]">
            按需购买积分，用多少扣多少。积分永不过期。
          </p>
        </div>

        {/* Package Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-12">
            {packages.map(pkg => {
              const totalCredits = pkg.credits + pkg.bonus
              const priceYuan = (pkg.price / 100).toFixed(0)
              const originalYuan = pkg.original_price ? (pkg.original_price / 100).toFixed(0) : null
              const perCredit = ((pkg.price / 100) / totalCredits).toFixed(2)

              return (
                <div
                  key={pkg.id}
                  className={`
                    relative p-5 rounded-[20px] flex flex-col
                    ${pkg.popular
                      ? 'bg-gradient-to-b from-[#8B5CF6]/20 to-[#10B981]/10 ring-1 ring-[#8B5CF6]/30 col-span-2'
                      : 'bg-[#1C1C1E]'
                    }
                  `}
                >
                  {pkg.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white text-[11px] font-bold px-4 py-1 rounded-full">
                      最受欢迎
                    </span>
                  )}

                  <h3 className="text-white text-[17px] font-semibold mb-1">{pkg.name}</h3>

                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-[11px] text-white/40">¥</span>
                    <span className="text-white text-[28px] font-bold tracking-tight">{priceYuan}</span>
                    {originalYuan && (
                      <span className="text-white/20 text-[12px] line-through ml-1">¥{originalYuan}</span>
                    )}
                  </div>

                  <p className="text-white/30 text-[13px] mb-3">
                    {totalCredits} 积分
                    {pkg.bonus > 0 && <span className="text-[#10B981]"> (+{pkg.bonus} 赠送)</span>}
                  </p>

                  <p className="text-white/20 text-[11px] mb-4">约 ¥{perCredit}/积分</p>

                  <button
                    onClick={() => {
                      if (!user && !authLoading) {
                        window.location.href = '/login?redirect=/sonic-gallery/pricing'
                        return
                      }
                      setShowPayment(true)
                    }}
                    className={`
                      w-full py-3 rounded-full text-[13px] font-semibold transition-all active:scale-[0.97]
                      ${pkg.popular
                        ? 'bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white shadow-[0_8px_24px_rgba(139,92,246,0.2)]'
                        : 'bg-white/10 text-white/80 hover:bg-white/15'
                      }
                    `}
                  >
                    购买
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-[22px] font-bold mb-6">常见问题</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-5 rounded-[16px] bg-[#1C1C1E]">
                <h3 className="text-white text-[15px] font-semibold mb-2">{faq.q}</h3>
                <p className="text-white/35 text-[14px] leading-[1.7]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-white/15 text-[12px]">
          购买即表示同意
          <Link href="/sonic-gallery/terms" className="text-white/25 hover:text-white/40 transition-colors mx-1">服务条款</Link>
          和
          <Link href="/sonic-gallery/privacy" className="text-white/25 hover:text-white/40 transition-colors mx-1">隐私政策</Link>
        </p>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => setShowPayment(false)}
      />
    </div>
  )
}
