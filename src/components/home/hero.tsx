'use client'

import { motion, type Easing } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
}

const easeInOut: Easing = 'easeInOut'

// Particle component for background effect
const Particle = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      left: x,
      top: y,
      width: size,
      height: size,
      background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(16, 185, 129, 0.1) 100%)',
    }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: easeInOut,
    }}
  />
)

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-20 left-1/4 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl"
          animate={{
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: easeInOut,
          }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary-500/15 rounded-full blur-3xl"
          animate={{
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 4,
            delay: 1,
            repeat: Infinity,
            ease: easeInOut,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary-500/5 to-transparent rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: easeInOut,
          }}
        />

        {/* Particles */}
        <Particle delay={0} x="20%" y="30%" size={8} />
        <Particle delay={0.5} x="80%" y="20%" size={6} />
        <Particle delay={1} x="70%" y="70%" size={10} />
        <Particle delay={1.5} x="30%" y="80%" size={7} />
        <Particle delay={2} x="50%" y="10%" size={5} />
        <Particle delay={0.3} x="10%" y="60%" size={9} />
        <Particle delay={1.8} x="90%" y="50%" size={8} />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Main Title with Gradient */}
        <motion.h1
          variants={itemVariants}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
        >
          <span
            className="inline-block"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #10B981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            WhyFire
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl lg:text-3xl text-gray-200 mb-4 font-medium"
        >
          AI Rap 视频一键生成器
        </motion.p>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-gray-400 max-w-lg mx-auto mb-10 text-base md:text-lg"
        >
          输入信息，AI 写词，AI 配乐，一键出片。让你的创意在 60 秒内变成爆款短视频。
        </motion.p>

        {/* CTA Button */}
        <motion.div variants={itemVariants}>
          <Link
            href="/create"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold text-white transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            }}
          >
            <motion.span
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              开始创作
            </motion.span>
            <motion.span
              className="inline-flex items-center justify-center"
              whileHover={{ x: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.span>
          </Link>
        </motion.div>

        {/* Optional: Quick stats or badges */}
        <motion.div
          variants={itemVariants}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary-500" />
            <span>60秒生成</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            <span>AI 驱动</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" />
            <span>一键出片</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
