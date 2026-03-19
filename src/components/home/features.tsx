'use client'

import { motion } from 'framer-motion'
import { Sparkles, Music, Video, Zap, Wand2, Download, Lightbulb, Users } from 'lucide-react'

const painPoints = [
  {
    icon: Lightbulb,
    problem: '不知道拍什么',
    solution: 'Rap 自动生成创意内容',
  },
  {
    icon: Music,
    problem: '不会写词',
    solution: 'AI 智能押韵写词',
  },
  {
    icon: Video,
    problem: '剪辑太复杂',
    solution: '一键自动卡点合成',
  },
  {
    icon: Users,
    problem: '内容没看点',
    solution: 'Rap 让视频更有吸引力',
  },
]

const features = [
  {
    icon: Sparkles,
    title: 'AI 智能写词',
    description: '输入产品或创意，AI 自动生成押韵的 Rap 歌词，让你的内容与众不同',
  },
  {
    icon: Music,
    title: '多种 Rap 风格',
    description: '普通话、粤语、东北话、四川话... 多种方言风格，找到最适合你的',
  },
  {
    icon: Video,
    title: '一键视频合成',
    description: '自动匹配素材、卡点、转场，60 秒内生成完整视频',
  },
  {
    icon: Zap,
    title: '爆款场景模板',
    description: '产品推广、搞笑段子、IP混剪，精选热门场景模板',
  },
  {
    icon: Wand2,
    title: '零门槛创作',
    description: '不需要音乐功底，不需要剪辑技能，小白也能做出爆款',
  },
  {
    icon: Download,
    title: '高清无水印',
    description: '支持 1080p 无水印导出，直接发布到抖音、小红书、B站',
  },
]

export function Features() {
  return (
    <section className="relative py-24 px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Pain Points Section */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">
              你是不是也有这些烦恼？
            </h2>
            <p className="text-lg text-gray-500">Rap + 视频，一站式解决</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {painPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-5 bg-[#111] border-2 border-white/30 hover:border-[#8B5CF6]/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-[#EF4444]/20 flex items-center justify-center">
                    <point.icon className="w-4 h-4 text-[#EF4444]" />
                  </div>
                  <span className="text-gray-500 line-through text-sm">{point.problem}</span>
                </div>
                <div className="flex items-center gap-2 text-[#10B981]">
                  <span className="text-sm">→</span>
                  <span className="text-sm font-semibold">{point.solution}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4 text-white"
          >
            为什么{' '}
            <span className="text-[#8B5CF6]">Rap 是答案</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400"
          >
            Rap 说唱让内容更有记忆点，更容易传播
          </motion.p>
        </div>

        {/* Features grid - brutalist style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group p-6 bg-[#0d0d0d] border-2 border-white/20 hover:border-[#8B5CF6]/50 transition-colors"
            >
              <div className="w-10 h-10 bg-[#8B5CF6]/20 flex items-center justify-center mb-5">
                <feature.icon className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
