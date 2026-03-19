'use client'

import { motion } from 'framer-motion'
import { Star, TrendingUp, Users, ShoppingBag } from 'lucide-react'

const testimonials = [
  {
    name: '小雨',
    role: '抖音新手博主',
    roleTag: 'content',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyu',
    content: '之前一直不知道拍什么，用 WhyFire 做了个 Rap 产品介绍视频，播放量直接破 10 万！',
    rating: 5,
    growth: '0 → 5000粉',
  },
  {
    name: '阿杰',
    role: '电商店主',
    roleTag: 'ecommerce',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ajie',
    content: '东北话 Rap 推产品太上头了！客户都说有创意，转化率比普通视频高 3 倍。',
    rating: 5,
    growth: '转化率 +300%',
  },
  {
    name: '小美',
    role: '小红书博主',
    roleTag: 'content',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaomei',
    content: '从写词到出片整个流程非常丝滑，省下了很多外包费用，关键是内容真的有记忆点。',
    rating: 5,
    growth: '月涨 8000粉',
  },
]

const roleIcons: Record<string, typeof Users> = {
  content: Users,
  ecommerce: ShoppingBag,
}

export function Testimonials() {
  return (
    <section className="relative py-24 px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4 text-white"
          >
            他们用 <span className="text-[#8B5CF6]">Rap 涨粉了</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400"
          >
            超过 10,000 位新手博主、电商、广告主的选择
          </motion.p>
        </div>

        {/* Testimonials grid - brutalist style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((testimonial, i) => {
            const RoleIcon = roleIcons[testimonial.roleTag] || Users
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-[#0d0d0d] border-2 border-white/20 hover:border-[#8B5CF6]/40 transition-colors"
              >
                {/* Growth badge */}
                <div className="flex items-center gap-2 mb-4 text-[#10B981]">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-bold">{testimonial.growth}</span>
                </div>

                {/* Rating */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-300 mb-5 text-sm leading-relaxed">
                  &quot;{testimonial.content}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 bg-white/10"
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <RoleIcon className="w-3 h-3" />
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Target audience - brutalist style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <p className="text-gray-500 text-sm mb-4">特别适合</p>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Users, text: '0-10000 粉新手博主' },
              { icon: ShoppingBag, text: '电商卖家' },
              { icon: TrendingUp, text: '广告主' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-[#111] border-2 border-white/20"
              >
                <item.icon className="w-4 h-4 text-[#8B5CF6]" />
                <span className="text-gray-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
