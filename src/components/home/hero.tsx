'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Play, Mic2, Headphones } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

// 6 个 Hero 视频配置 - Neural Frames 风格
const HERO_VIDEOS = [
  { src: '/videos/hero/rapper-performer.mp4', alt: 'Rapper 舞台表演' },
  { src: '/videos/hero/dj-mixing.mp4', alt: 'DJ 打碟' },
  { src: '/videos/hero/dancer-silhouette.mp4', alt: '街舞舞者' },
  { src: '/videos/hero/singer-recording.mp4', alt: '歌手录音' },
  { src: '/videos/hero/producer-creating.mp4', alt: '音乐制作人' },
  { src: '/videos/hero/street-artist.mp4', alt: '街头艺术家' },
]

// 单个视频组件 - 带加载状态
function HeroVideo({ src, alt, index }: { src: string; alt: string; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // 强制触发视频播放
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // 自动播放被阻止时，静默处理
        console.log('Video autoplay blocked for:', alt)
      })
    }
  }, [alt])

  return (
    <div className="relative flex-1 h-full overflow-hidden bg-black">
      {/* 加载占位 */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-[#0a0a0a] animate-pulse" />
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center">
          <span className="text-gray-600 text-xs">{alt}</span>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        onCanPlay={() => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {})
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          filter: 'brightness(0.5) saturate(1.1)',
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  )
}

// Neural Frames 风格 - 多视频并排循环播放
function MultiVideoBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* 视频网格 - 6 个视频并排 */}
      <div className="flex h-full w-full">
        {mounted && HERO_VIDEOS.map((video, index) => (
          <HeroVideo
            key={video.src}
            src={video.src}
            alt={video.alt}
            index={index}
          />
        ))}
      </div>

      {/* 整体暗色遮罩 - 保证文字可读 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 左侧渐变遮罩 - 让内容更清晰 */}
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black via-black/70 to-transparent" />
    </div>
  )
}

const stats = [
  { label: '新手博主', value: '10,000+' },
  { label: 'Rap视频', value: '50,000+' },
  { label: '涨粉成功', value: '89%' },
]

const trustedBy = [
  '抖音新手',
  '电商主播',
  '小红书博主',
  'B站UP主',
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
      {/* Multi-Video Background - Neural Frames Style */}
      <MultiVideoBackground />

      {/* Content - asymmetric layout on desktop */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 py-20">
        <div className="md:ml-0 lg:ml-8">
          {/* Badge - solid brutalist style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-3 px-4 py-2 bg-[#8B5CF6] border-3 border-black mb-8"
            style={{ border: '3px solid #000' }}
          >
            <div className="w-7 h-7 bg-black flex items-center justify-center">
              <Mic2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-black font-bold">Rap + 视频 = 爆款内容公式</span>
          </motion.div>

          {/* Core Message - solid box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-8"
          >
            <div
              className="px-6 py-3 bg-[#111] border-2 border-white/60"
              style={{ boxShadow: '4px 4px 0px #8B5CF6' }}
            >
              <span className="text-lg md:text-xl font-bold text-white">
                不知道拍什么？试试 Rap + 视频
              </span>
            </div>
          </motion.div>

          {/* Main Headline - bold, no gradients */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[0.95]"
          >
            <span className="block text-white mb-2">用 Rap</span>
            <span className="block text-[#8B5CF6]">让视频脱颖而出</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-400 max-w-xl mb-10 leading-relaxed"
          >
            Rap 说唱是解决
            <span className="text-white font-semibold">「不知道拍什么」</span>
            的优质方法
            <br />
            <span className="text-gray-500">AI 写词配乐，60 秒出片</span>
          </motion.p>

          {/* CTA Buttons - brutalist style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-start gap-4 mb-12"
          >
            <Link
              href="/create"
              className="group inline-flex items-center gap-3 text-lg px-8 py-4 bg-[#10B981] text-black font-bold border-3 border-black hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
              style={{ border: '3px solid #000', boxShadow: '4px 4px 0px #000' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '6px 6px 0px #000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '4px 4px 0px #000'
              }}
            >
              <Play className="w-5 h-5 fill-black" />
              开始创作 Rap 视频
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/templates"
              className="group inline-flex items-center gap-2 text-lg px-8 py-4 bg-transparent text-white font-semibold border-2 border-white/70 hover:border-white hover:bg-white/5 transition-all"
            >
              <Headphones className="w-5 h-5" />
              看看别人怎么拍
            </Link>
          </motion.div>

          {/* Stats - brutalist boxes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 md:gap-6 mb-10"
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="px-5 py-3 bg-[#111] border-2 border-white/40"
              >
                <div className="text-2xl md:text-3xl font-bold text-white mb-0.5">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Trusted by - brutalist tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center gap-3"
          >
            <span className="text-sm text-gray-600">已帮助这些创作者涨粉</span>
            <div className="flex flex-wrap gap-2">
              {trustedBy.map((item, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                  className="px-3 py-1 bg-black text-gray-400 text-sm border-2 border-white/30"
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator - simplified */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 border-2 border-white/30 flex items-start justify-center pt-1.5"
        >
          <motion.div
            animate={{ y: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-1.5 bg-white"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
