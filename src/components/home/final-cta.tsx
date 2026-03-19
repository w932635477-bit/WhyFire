'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Play, Mic2, Sparkles } from 'lucide-react'

export function FinalCTA() {
  return (
    <section className="relative py-24 px-6 overflow-hidden bg-black">
      {/* Solid background instead of gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Icon - brutalist style */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-16 h-16 bg-[#8B5CF6] border-3 border-black mb-8"
            style={{ border: '3px solid #000', boxShadow: '4px 4px 0px #000' }}
          >
            <Mic2 className="w-8 h-8 text-white" />
          </motion.div>

          {/* Core message - bold, no gradients */}
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            <span className="text-white">不知道拍什么？</span>
            <br />
            <span className="text-[#8B5CF6]">试试 Rap + 视频</span>
          </h2>

          <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
            让 AI 帮你写词配乐，用 Rap 让你的内容脱颖而出
          </p>

          {/* CTA - brutalist style */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-3 text-lg px-10 py-5 bg-[#10B981] text-black font-bold border-3 border-black hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
              style={{ border: '3px solid #000', boxShadow: '4px 4px 0px #000' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '6px 6px 0px #000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 0px #000'
              }}
            >
              <Play className="w-5 h-5 fill-black" />
              开始创作第一个 Rap 视频
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Trust indicators - brutalist style */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6"
          >
            <span className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border-2 border-[#8B5CF6]/50 text-sm">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-gray-300">免费试用</span>
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border-2 border-[#10B981]/50 text-sm">
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              <span className="text-gray-300">60秒出片</span>
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border-2 border-[#8B5CF6]/50 text-sm">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-gray-300">零门槛创作</span>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
