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

const plans = [
  {
    name: 'Free',
    price: '免费',
    period: '',
    features: [
      { text: '3 次翻唱（共 6 积分）', included: true },
      { text: '3 种方言（普通话/四川话/粤语）', included: true },
      { text: '720p MV 视频 + 水印', included: true },
      { text: '预设音色（无声音克隆）', included: true },
      { text: '分享解锁额外次数', included: true },
    ],
    cta: '立即开始',
    highlight: false,
    tag: '',
  },
  {
    name: 'Lite',
    price: '¥19',
    period: '/月',
    features: [
      { text: '每月 10 次翻唱（20 积分）', included: true },
      { text: '全部 9 种方言', included: true },
      { text: '声音克隆（用你自己的声音）', included: true },
      { text: '1080p MV 视频，无水印', included: true },
      { text: '保存 3 个音色', included: true },
    ],
    cta: '即将上线',
    highlight: false,
    tag: '',
  },
  {
    name: 'Pro',
    price: '¥49',
    period: '/月',
    features: [
      { text: '每月 40 次翻唱（80 积分）', included: true },
      { text: 'Lite 全部功能', included: true },
      { text: '优先生成队列', included: true },
      { text: '保存 10 个音色', included: true },
      { text: '商用授权', included: true },
    ],
    cta: '即将上线',
    highlight: false,
    tag: 'V2',
  },
]

const faqs = [
  {
    q: '积分有什么用？',
    a: '每次 AI 翻唱消耗 2 积分。1 次翻唱 = 上传歌曲 + 选择方言 + AI 翻唱 + MV 视频生成，全链路搞定。',
  },
  {
    q: '积分会过期吗？',
    a: '购买的积分永久有效，不会过期。月度订阅的积分每月刷新，不累积。',
  },
  {
    q: '可以退款吗？',
    a: '已购买的积分包不支持退款。请根据实际需求选择合适的套餐。',
  },
  {
    q: '支持什么支付方式？',
    a: '目前支持微信支付。桌面端扫码支付，手机端可直接唤起微信支付。',
  },
  {
    q: 'Free 用户有什么限制？',
    a: 'Free 用户共 3 次翻唱机会，限普通话/四川话/粤语 3 种方言，视频带水印。分享作品可解锁额外次数。',
  },
]

export default function PricingPage() {
  const { user, loading: authLoading } = useAuthContext()
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null)
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

  const handleBuyPackage = (pkgId: string) => {
    if (!user && !authLoading) {
      window.location.href = '/login?redirect=/sonic-gallery/pricing'
      return
    }
    setSelectedPkg(pkgId)
    setShowPayment(true)
  }

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
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">创作方案</span>
          </h1>
          <p className="text-white/40 text-[15px] max-w-sm mx-auto leading-[1.7]">
            1 次翻唱 = 2 积分。上传歌曲，选方言，1 分钟出 MV。
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative p-4 rounded-[20px] flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-[#8B5CF6]/20 to-[#10B981]/10 ring-1 ring-[#8B5CF6]/30'
                  : 'bg-[#1C1C1E]'
              }`}
            >
              {plan.tag && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white/10 text-white/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {plan.tag}
                </span>
              )}
              <h3 className="text-white text-[15px] font-bold mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-0.5 mb-3">
                <span className="text-white text-[24px] font-bold tracking-tight">{plan.price}</span>
                {plan.period && <span className="text-white/30 text-[11px]">{plan.period}</span>}
              </div>
              <ul className="space-y-1.5 mb-4 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={f.included ? '#10B981' : '#ffffff20'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className={`text-[11px] leading-[1.4] ${f.included ? 'text-white/50' : 'text-white/20'}`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
              {plan.name === 'Free' ? (
                <Link
                  href="/sonic-gallery/cover"
                  className="w-full py-2.5 rounded-full text-[12px] font-semibold text-center bg-white/10 text-white/70 hover:bg-white/15 transition-colors"
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 rounded-full text-[12px] font-semibold bg-white/5 text-white/30 cursor-not-allowed"
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Single Packs */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-[22px] font-bold mb-2">按次购买</h2>
            <p className="text-white/30 text-[13px]">积分永不过期，用完再买</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {packages.map(pkg => {
                const generations = Math.floor(pkg.credits / 2)
                const priceYuan = (pkg.price / 100).toFixed(1).replace('.0', '')
                const perTime = ((pkg.price / 100) / generations).toFixed(1)

                return (
                  <div
                    key={pkg.id}
                    className={`relative p-4 rounded-[20px] flex flex-col ${
                      pkg.popular
                        ? 'bg-gradient-to-b from-[#8B5CF6]/20 to-[#10B981]/10 ring-1 ring-[#8B5CF6]/30'
                        : 'bg-[#1C1C1E]'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                        最划算
                      </span>
                    )}

                    <h3 className="text-white text-[14px] font-semibold mb-1">{pkg.name}</h3>
                    <div className="flex items-baseline gap-0.5 mb-1">
                      <span className="text-white/30 text-[11px]">¥</span>
                      <span className="text-white text-[28px] font-bold tracking-tight">{priceYuan}</span>
                    </div>
                    <p className="text-white/30 text-[12px] mb-1">{generations} 次翻唱</p>
                    <p className="text-white/20 text-[10px] mb-3">约 ¥{perTime}/次</p>

                    <button
                      onClick={() => handleBuyPackage(pkg.id)}
                      className={`w-full py-2.5 rounded-full text-[12px] font-semibold transition-all active:scale-[0.97] ${
                        pkg.popular
                          ? 'bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white shadow-[0_6px_20px_rgba(139,92,246,0.2)]'
                          : 'bg-white/10 text-white/80 hover:bg-white/15'
                      }`}
                    >
                      购买
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
