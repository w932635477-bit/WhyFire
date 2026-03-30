'use client'

import { useState } from 'react'
import Link from 'next/link'

const sampleWorks = [
  { id: '1', title: '成都漂移', dialect: '四川话', creator: '蜀山客', plays: 12800, gradient: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(239,68,68,0.15))', accent: '#f59e0b' },
  { id: '2', title: '东北爱情故事', dialect: '东北话', creator: '雪村大侠', plays: 8900, gradient: 'linear-gradient(135deg, rgba(56,189,248,0.3), rgba(59,130,246,0.15))', accent: '#38bdf8' },
  { id: '3', title: '珠江夜色', dialect: '粤语', creator: '粤语歌手', plays: 6700, gradient: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(168,85,247,0.15))', accent: '#8b5cf6' },
  { id: '4', title: '西安城墙下', dialect: '陕西话', creator: '长安客', plays: 5200, gradient: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(20,184,166,0.15))', accent: '#10b981' },
]

const dialectCards = [
  { name: '粤语', region: '广东', initial: '粤', accent: '#f59e0b' },
  { name: '四川话', region: '川渝', initial: '川', accent: '#ef4444' },
  { name: '东北话', region: '东北', initial: '东', accent: '#38bdf8' },
  { name: '陕西话', region: '秦腔', initial: '秦', accent: '#10b981' },
  { name: '上海话', region: '吴语', initial: '吴', accent: '#8b5cf6' },
  { name: '闽南语', region: '福建', initial: '闽', accent: '#06b6d4' },
  { name: '天津话', region: '津门', initial: '津', accent: '#ec4899' },
  { name: '南京话', region: '金陵', initial: '宁', accent: '#a855f7' },
  { name: '普通话', region: '标准', initial: '普', accent: '#f97316' },
]

export default function SonicGalleryHome() {
  const [hoveredWork, setHoveredWork] = useState<string | null>(null)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showContact, setShowContact] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white antialiased">

      {/* ========== NAVIGATION — glass shell ========== */}
      <nav className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-6xl px-6">
          <div
            className="flex items-center justify-between h-14 px-6 rounded-b-2xl"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
          >
            {/* Left: text logo */}
            <Link href="/sonic-gallery" className="text-[16px] font-extrabold tracking-tighter text-white font-sans">
              方言回响
            </Link>

            {/* Center: nav links */}
            <div className="flex items-center gap-8">
              <Link href="/sonic-gallery/cover" className="text-[13px] text-white/50 hover:text-white transition-colors font-sans font-medium">
                Cover
              </Link>
              <Link href="/sonic-gallery/create" className="text-[13px] text-white/50 hover:text-white transition-colors font-sans font-medium">
                Rap
              </Link>
              <Link href="/sonic-gallery/beats" className="text-[13px] text-white/50 hover:text-white transition-colors font-sans font-medium">
                Gallery
              </Link>
            </div>

            {/* Right: account icon */}
            <button className="text-white/50 hover:text-white transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ========== HERO — full viewport ========== */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient (fallback for no external image) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,92,246,0.15) 0%, rgba(16,185,129,0.08) 40%, transparent 70%)'
          }} />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.95) 100%)'
          }} />
        </div>

        {/* hero-mask overlay */}
        <div className="absolute inset-0 z-[1]" style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 60%, #000000 100%)'
        }} />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center pt-24">
          {/* Overline */}
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-sans font-medium mb-8">
            全新上线
          </p>

          {/* Title */}
          <h1 className="text-[48px] sm:text-[64px] lg:text-[76px] font-extrabold leading-[1.05] tracking-[-0.03em] font-sans mb-6">
            用方言翻唱
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">
              1 分钟出片
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-white/50 max-w-[520px] mx-auto leading-[1.7] font-sans mb-12">
            上传一首歌，选个方言，AI 自动翻唱并生成 MV 视频。一键发抖音、快手。
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/sonic-gallery/cover"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white px-8 py-[14px] rounded-full text-[15px] font-semibold font-sans shadow-[0_8px_32px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_40px_rgba(139,92,246,0.4)] transition-all active:scale-[0.97]"
            >
              开始翻唱
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/sonic-gallery/create"
              className="inline-flex items-center gap-2 px-8 py-[14px] rounded-full text-[15px] font-medium font-sans text-white/60 hover:text-white/80 border border-white/20 hover:border-white/30 transition-all"
            >
              原创 Rap
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-16 mt-16 pt-8 border-t border-white/5">
            {[
              { value: '9', label: '种方言' },
              { value: '1min', label: '出翻唱' },
              { value: 'MV', label: '视频直出' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-white text-[32px] font-bold tracking-tight font-sans">{stat.value}</p>
                <p className="text-white/25 text-[11px] font-sans mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOT WORKS ========== */}
      <section id="works" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-14">
            <div>
              <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-[-0.02em] font-sans">热门作品</h2>
              <p className="text-white/30 text-[15px] mt-3 font-sans">用方言翻唱的热门歌曲</p>
            </div>
            <Link
              href="/sonic-gallery/beats"
              className="text-[13px] text-[#8b5cf6] hover:text-[#a78bfa] font-sans font-medium flex items-center gap-1 transition-colors"
            >
              查看全部
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {sampleWorks.map((work) => (
              <button
                key={work.id}
                onMouseEnter={() => setHoveredWork(work.id)}
                onMouseLeave={() => setHoveredWork(null)}
                className="group text-left"
              >
                {/* Card */}
                <div
                  className="relative aspect-square rounded-[20px] overflow-hidden mb-4 transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{ background: work.gradient }}
                >
                  {/* Play overlay on hover */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hoveredWork === work.id ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.3)" />
                        <polygon points="10 8 16 12 10 16" fill="white" />
                      </svg>
                    </div>
                  </div>

                  {/* Bottom gradient */}
                  <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Bottom info row */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between">
                    {/* Dialect pill */}
                    <span
                      className="text-[11px] font-semibold font-sans px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: `${work.accent}20`,
                        color: work.accent,
                      }}
                    >
                      {work.dialect}
                    </span>
                    {/* Play count */}
                    <span className="flex items-center gap-1 text-white/40 text-[11px] font-sans tabular-nums">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                      </svg>
                      {work.plays >= 10000 ? `${(work.plays / 10000).toFixed(1)}w` : `${(work.plays / 1000).toFixed(1)}k`}
                    </span>
                  </div>
                </div>

                {/* Title + creator */}
                <h3 className="text-white text-[14px] font-semibold font-sans truncate">{work.title}</h3>
                <p className="text-white/30 text-[12px] font-sans mt-1">{work.creator}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========== DIALECTS — dark bg ========== */}
      <section className="py-24 sm:py-32 bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-[-0.02em] font-sans">9 种方言</h2>
            <p className="text-white/30 text-[15px] mt-3 font-sans">覆盖中国核心方言体系</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {dialectCards.map((d) => (
              <div
                key={d.name}
                className="group flex flex-col items-center cursor-default transition-transform duration-300 hover:-translate-y-2"
              >
                {/* Circle with character */}
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-3 transition-transform duration-300"
                  style={{ backgroundColor: `${d.accent}15` }}
                >
                  <span className="text-[28px] font-bold font-sans" style={{ color: d.accent }}>{d.initial}</span>
                </div>
                <span className="text-white text-[13px] font-semibold font-sans">{d.name}</span>
                <span className="text-white/25 text-[11px] font-sans mt-0.5">{d.region}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES — 3-col grid ========== */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-[-0.02em] font-sans">
              从上传到出片，
              <br className="sm:hidden" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">全链路 AI</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#iconGrad1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="iconGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                ),
                title: 'AI 方言翻唱',
                desc: '上传一首歌，1 分钟用方言重新演绎。Suno API 驱动，自然流畅。',
                stat: '1 分钟',
                statSub: '生成翻唱',
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#iconGrad2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="iconGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ),
                title: 'AI 歌词创作',
                desc: 'Claude 分析方言文化符号，生成有记忆点的原创歌词。',
                stat: '9 种',
                statSub: '方言覆盖',
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#iconGrad3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="iconGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                ),
                title: 'MV 视频直出',
                desc: '翻唱完成一键生成 MV，可直接发抖音、快手。',
                stat: '1 分钟',
                statSub: '视频生成',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-8 rounded-[24px] bg-[#1C1C1E] group hover:bg-[#2C2C2E] transition-colors duration-500 flex flex-col"
              >
                <div className="mb-6">{f.icon}</div>
                <h3 className="text-[20px] font-semibold text-white font-sans mb-3">{f.title}</h3>
                <p className="text-white/35 text-[14px] leading-[1.65] font-sans mb-8 flex-1">{f.desc}</p>
                <div className="border-t border-white/[0.06] pt-6">
                  <p className="text-[28px] font-bold tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">{f.stat}</p>
                  <p className="text-white/20 text-[12px] font-sans mt-1">{f.statSub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BOTTOM CTA — gradient glow ========== */}
      <section className="relative py-32 sm:py-40 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] bg-[#8B5CF6] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] bg-[#10B981] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-[40px] sm:text-[56px] font-extrabold tracking-[-0.03em] font-sans mb-5">
            准备好了吗？
          </h2>
          <p className="text-white/40 text-lg font-sans mb-12 max-w-md mx-auto">
            上传一首歌，1 分钟后你会听到完全不同的版本
          </p>
          <Link
            href="/sonic-gallery/cover"
            className="inline-flex items-center gap-2 bg-white text-black px-10 py-[16px] rounded-full text-[15px] font-semibold font-sans hover:bg-white/90 transition-all active:scale-[0.97]"
          >
            开始翻唱
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-white/20 text-[12px] font-sans">Copyright &copy; 2026 方言回响. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/sonic-gallery/privacy" className="text-white/15 hover:text-white/40 text-[12px] font-sans transition-colors">隐私</Link>
            <Link href="/sonic-gallery/terms" className="text-white/15 hover:text-white/40 text-[12px] font-sans transition-colors">条款</Link>
            <button onClick={() => setShowContact(true)} className="text-white/15 hover:text-white/40 text-[12px] font-sans transition-colors">联系</button>
          </div>
        </div>
      </footer>

      {/* ========== MODALS ========== */}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowPrivacy(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-[24px] p-8 sm:p-10"
            style={{ background: '#1C1C1E', border: '1px solid rgba(139,92,246,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowPrivacy(false)} className="absolute top-5 right-5 text-white/30 hover:text-white/60 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-[24px] font-extrabold font-sans mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">隐私政策</h2>
            <div className="space-y-4 text-white/50 text-[14px] leading-[1.8] font-sans">
              <p><span className="text-white/70 font-semibold">生效日期：</span>2026 年 3 月 1 日</p>
              <p>方言回响（WhyFire）尊重并保护每位用户的隐私。本隐私政策说明我们如何收集、使用和保护您的个人信息。</p>
              <h3 className="text-white/70 font-semibold text-[15px] pt-2">1. 信息收集</h3>
              <p>我们收集您上传的音频文件和歌词文本，用于 AI 方言翻唱和 MV 视频生成。上传即表示您授权我们对内容进行必要的 AI 处理。</p>
              <h3 className="text-white/70 font-semibold text-[15px] pt-2">2. 数据存储</h3>
              <p>所有音频和视频文件存储于阿里云 OSS（对象存储服务），数据传输全程加密（HTTPS/TLS）。我们不会将您的音频文件分享给第三方。</p>
              <h3 className="text-white/70 font-semibold text-[15px] pt-2">3. AI 处理</h3>
              <p>音频处理使用自建 GPU 服务器和第三方 AI 服务（如 Suno API）。处理完成后，原始音频和生成结果仅保存在您的账户中，不会用于训练 AI 模型。</p>
              <h3 className="text-white/70 font-semibold text-[15px] pt-2">4. 用户权利</h3>
              <p>您可以随时删除自己的作品和数据。删除后，相关文件将从存储服务器永久移除。</p>
              <h3 className="text-white/70 font-semibold text-[15px] pt-2">5. 联系我们</h3>
              <p>如有隐私相关问题，请联系 contact@whyfire.ai。</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowTerms(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-[24px] p-8 sm:p-10"
            style={{ background: '#1C1C1E', border: '1px solid rgba(139,92,246,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowTerms(false)} className="absolute top-5 right-5 text-white/30 hover:text-white/60 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-[24px] font-extrabold font-sans mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">服务条款</h2>
            <div className="space-y-4 text-white/50 text-[14px] leading-[1.8] font-sans">
              <p><span className="text-white/70 font-semibold">生效日期：</span>2026 年 3 月 1 日</p>
              <p>欢迎使用方言回响（WhyFire）。使用本服务即表示您同意以下条款。</p>
              <h3 className="text-white/70 font-semibold text-[15px] pt-2">1. 服务说明</h3>
              <p>方言回响提供 AI 方言翻唱、原创歌词创作和 MV 视频生成服务。我们保留随时修改或终止服务的权利。</p>
              <h3 className="text-white/70 font-semibold text-[15px] pt-2">2. 用户生成内容</h3>
              <p>您对通过本平台创作的作品享有使用权。上传的原始音频必须为您拥有合法权利的内容。严禁上传侵犯他人版权的音频。</p>
              <p>生成的方言翻唱作品仅供个人娱乐和社交分享使用。如需商用，请另行联系我们获取授权。</p>
              <h3 className="text-white/70 font-semibold text-[15px] pt-2">3. 禁止行为</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>上传违法、色情、暴力或仇恨言论内容</li>
                <li>利用平台生成虚假或误导性内容</li>
                <li>批量抓取或自动化调用平台服务</li>
                <li>将生成内容用于未授权的商业用途</li>
              </ul>
              <h3 className="text-white/70 font-semibold text-[15px] pt-2">4. 免责声明</h3>
              <p>AI 生成的翻唱和视频内容仅供参考和娱乐，我们不保证其准确性或适用性。因使用本服务产生的版权纠纷，由用户自行承担法律责任。</p>
              <h3 className="text-white/70 font-semibold text-[15px] pt-2">5. 联系我们</h3>
              <p>如有条款相关问题，请联系 contact@whyfire.ai。</p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowContact(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-[24px] p-8 sm:p-10"
            style={{ background: '#1C1C1E', border: '1px solid rgba(139,92,246,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowContact(false)} className="absolute top-5 right-5 text-white/30 hover:text-white/60 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-[24px] font-extrabold font-sans mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">联系我们</h2>
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/70 text-[14px] font-semibold font-sans">电子邮件</p>
                  <a href="mailto:contact@whyfire.ai" className="text-[#8b5cf6] hover:text-[#a78bfa] text-[14px] font-sans transition-colors">contact@whyfire.ai</a>
                </div>
              </div>
              {/* WeChat */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/70 text-[14px] font-semibold font-sans">微信公众号</p>
                  <p className="text-white/40 text-[14px] font-sans">搜索「方言回响」关注我们</p>
                </div>
              </div>
              {/* Response time */}
              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-white/25 text-[12px] font-sans">我们会在 1-2 个工作日内回复您的邮件。</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
