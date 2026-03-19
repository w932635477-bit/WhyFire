'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, Zap, Crown, Gift } from 'lucide-react'

const plans = [
  {
    name: '免费体验',
    price: '¥0',
    period: '永久免费',
    description: '先试试效果',
    features: ['每日 2 积分', '基础 Rap 场景', '720p 视频', '带水印（不影响发布）'],
    cta: '免费开始',
    href: '/create',
    secondary: true,
    icon: Gift,
  },
  {
    name: '轻量版',
    price: '¥89',
    period: '/月',
    description: '新手博主首选',
    features: [
      '每月 60 积分（约 30 个视频）',
      '全部 Rap 场景',
      '1080p 无水印',
      '3 种方言支持',
    ],
    cta: '立即订阅',
    href: '/subscription',
    popular: true,
    icon: Zap,
  },
  {
    name: '专业版',
    price: '¥139',
    period: '/月',
    description: '电商、广告主必备',
    features: [
      '每月 200 积分（约 100 个视频）',
      '全部 Rap 场景',
      '1080p 无水印',
      '全部方言支持',
      '优先生成队列',
    ],
    cta: '立即订阅',
    href: '/subscription',
    secondary: true,
    icon: Crown,
  },
]

export function PricingCTA() {
  return (
    <section className="relative py-24 px-6 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4 text-white"
          >
            从免费开始
            <br />
            <span className="text-[#8B5CF6]">效果好再升级</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400"
          >
            先试试 Rap + 视频的效果，满意再付费
          </motion.p>
        </div>

        {/* Plans - brutalist style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {plans.map((plan, i) => {
            const Icon = plan.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-6 ${
                  plan.popular
                    ? 'bg-[#8B5CF6]/10 border-3 border-[#8B5CF6]'
                    : 'bg-[#0d0d0d] border-2 border-white/20'
                }`}
                style={plan.popular ? { border: '3px solid #8B5CF6' } : {}}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-[#8B5CF6] text-xs font-bold text-white">
                    新手博主首选
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 flex items-center justify-center ${
                    plan.popular ? 'bg-[#8B5CF6]/30' : 'bg-white/5'
                  }`}>
                    <Icon className={`w-5 h-5 ${plan.popular ? 'text-[#8B5CF6]' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center py-3 px-6 font-bold transition-all ${
                    plan.popular
                      ? 'bg-[#10B981] text-black border-2 border-black hover:translate-x-[-2px] hover:translate-y-[-2px]'
                      : 'bg-transparent text-white border-2 border-white/50 hover:border-white'
                  }`}
                  style={plan.popular ? { boxShadow: '3px 3px 0px #000' } : {}}
                  onMouseEnter={(e) => {
                    if (plan.popular) {
                      e.currentTarget.style.boxShadow = '5px 5px 0px #000'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.popular) {
                      e.currentTarget.style.boxShadow = '3px 3px 0px #000'
                    }
                  }}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Value proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-gray-400 text-sm mb-3">
            <span className="text-[#10B981]">💰</span> 一个外包视频 ¥500+，用 WhyFire 一个月做 100 个
          </p>
          <p className="text-gray-600 text-xs">
            如有问题随时联系客服 · 支持退款
          </p>
        </motion.div>
      </div>
    </section>
  )
}
