'use client'

import { useState } from 'react'
import Link from 'next/link'

const sampleWorks = [
  { id: '1', title: '成都漂移', dialect: '四川话', creator: '蜀山客', plays: 12800, gradient: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(239,68,68,0.15))' },
  { id: '2', title: '东北爱情故事', dialect: '东北话', creator: '雪村大侠', plays: 8900, gradient: 'linear-gradient(135deg, rgba(56,189,248,0.3), rgba(59,130,246,0.15))' },
  { id: '3', title: '珠江夜色', dialect: '粤语', creator: '粤语歌手', plays: 6700, gradient: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(168,85,247,0.15))' },
  { id: '4', title: '西安城墙下', dialect: '陕西话', creator: '长安客', plays: 5200, gradient: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(20,184,166,0.15))' },
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

  return (
    <div className="min-h-screen bg-black text-white antialiased">

      {/* ========== NAVIGATION ========== */}
      <nav className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-[980px] px-6">
          <div className="flex items-center justify-between h-12 bg-black/70 backdrop-blur-2xl rounded-b-2xl px-5">
            <Link href="/sonic-gallery" className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-white flex items-center justify-center">
                <span className="text-black text-[9px] font-black">W</span>
              </div>
              <span className="text-[12px] font-semibold text-white tracking-tight font-sans">方言回响</span>
            </Link>
            <div className="flex items-center gap-7">
              <Link href="/sonic-gallery/cover" className="text-[11px] text-white/50 hover:text-white transition-colors font-sans font-medium">翻唱</Link>
              <Link href="/sonic-gallery/create" className="text-[11px] text-white/50 hover:text-white transition-colors font-sans font-medium">Rap</Link>
              <Link href="/sonic-gallery/beats" className="text-[11px] text-white/50 hover:text-white transition-colors font-sans font-medium">作品</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative pt-32 pb-28 sm:pt-40 sm:pb-36 overflow-hidden">
        {/* Background video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-30"
          >
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>

        <div className="relative z-10 max-w-[980px] mx-auto px-6 text-center">
          {/* Overline */}
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-sans font-medium mb-6">
            全新上线
          </p>

          {/* Title — Apple-style: large, tight, centered */}
          <h1 className="text-[48px] sm:text-[72px] lg:text-[80px] font-bold leading-[1.05] tracking-[-0.03em] font-sans mb-6">
            用方言翻唱
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #c084fc, #34d399)' }}>
              30 秒出片
            </span>
          </h1>

          {/* Subtitle — clean, readable */}
          <p className="text-white/50 text-[17px] sm:text-[19px] max-w-[500px] mx-auto leading-[1.6] font-sans mb-10">
            上传一首歌，选方言，AI 翻唱。自带视频，一键发抖音。
          </p>

          {/* CTAs — Apple pill style */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/sonic-gallery/cover"
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-[14px] rounded-full text-[14px] font-semibold font-sans hover:bg-white/90 transition-colors active:scale-[0.98]"
            >
              方言翻唱
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link
              href="/sonic-gallery/create"
              className="inline-flex items-center gap-2 px-8 py-[14px] rounded-full text-[14px] font-medium font-sans text-white/60 hover:text-white/80 border border-white/10 hover:border-white/20 transition-all"
            >
              原创 Rap
            </Link>
          </div>

          {/* Stats row — Apple keynote style */}
          <div className="flex items-center justify-center gap-12 mt-14">
            {[
              { value: '9', label: '种方言' },
              { value: '30s', label: '出翻唱' },
              { value: 'MV', label: '视频直出' },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center">
                <p className="text-white text-[28px] font-bold tracking-tight font-sans">{stat.value}</p>
                <p className="text-white/25 text-[11px] font-sans mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOT WORKS ========== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-[32px] sm:text-[40px] font-bold tracking-[-0.02em] font-sans">热门作品</h2>
              <p className="text-white/30 text-[15px] mt-2 font-sans">用方言翻唱的热门歌曲</p>
            </div>
            <Link href="/sonic-gallery/beats" className="text-[13px] text-[#8b5cf6] hover:text-[#a78bfa] font-sans font-medium flex items-center gap-1 transition-colors">
              查看全部
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
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
                <div
                  className="relative aspect-square rounded-[20px] overflow-hidden mb-3.5 transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{ background: work.gradient }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-14 h-14 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-all duration-500 ${hoveredWork === work.id ? 'scale-110 bg-black/30' : ''}`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="white" className="ml-0.5"><polygon points="8 5 20 12 8 19"/></svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
                    <span className="text-white/70 text-[11px] font-medium font-sans">{work.dialect}</span>
                    <span className="text-white/30 text-[10px] font-sans tabular-nums">
                      {work.plays >= 10000 ? `${(work.plays / 10000).toFixed(1)}w` : `${(work.plays / 1000).toFixed(1)}k`}
                    </span>
                  </div>
                </div>
                <h3 className="text-white text-[14px] font-semibold font-sans truncate">{work.title}</h3>
                <p className="text-white/25 text-[12px] font-sans mt-0.5">{work.creator}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========== DIALECTS ========== */}
      <section className="py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[32px] sm:text-[40px] font-bold tracking-[-0.02em] font-sans">9 种方言</h2>
            <p className="text-white/30 text-[15px] mt-2 font-sans">覆盖中国核心方言体系</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {dialectCards.map((d) => (
              <div
                key={d.name}
                className="group w-[96px] py-6 flex flex-col items-center rounded-2xl bg-[#1C1C1E] hover:bg-[#2C2C2E] transition-colors duration-300 cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${d.accent}15` }}
                >
                  <span className="text-[16px] font-bold font-sans" style={{ color: d.accent }}>{d.initial}</span>
                </div>
                <span className="text-white text-[12px] font-semibold font-sans">{d.name}</span>
                <span className="text-white/20 text-[10px] font-sans mt-0.5">{d.region}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES — Apple product grid ========== */}
      <section className="py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[32px] sm:text-[40px] font-bold tracking-[-0.02em] font-sans">
              从上传到出片，
              <br className="sm:hidden" />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #c084fc, #34d399)' }}>全链路 AI</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                ),
                title: 'AI 方言翻唱',
                desc: '上传一首歌，30 秒用方言重新演绎。SunoAPI 驱动。',
                stat: '30 秒',
                statSub: '生成翻唱',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ),
                title: 'AI 歌词创作',
                desc: 'Claude 分析方言文化符号，生成有记忆点的歌词。',
                stat: '9 种',
                statSub: '方言覆盖',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                ),
                title: 'MV 视频直出',
                desc: '翻唱完成一键生成 MV，可直接发抖音、快手。',
                stat: '1 分钟',
                statSub: '视频生成',
              },
            ].map((f) => (
              <div key={f.title} className="p-8 rounded-[24px] bg-[#1C1C1E] group hover:bg-[#2C2C2E] transition-colors duration-500">
                <div className="mb-6">{f.icon}</div>
                <h3 className="text-[20px] font-semibold text-white font-sans mb-2">{f.title}</h3>
                <p className="text-white/35 text-[14px] leading-[1.6] font-sans mb-8">{f.desc}</p>
                <div className="border-t border-white/[0.06] pt-6">
                  <p className="text-white text-[28px] font-bold tracking-tight font-sans">{f.stat}</p>
                  <p className="text-white/20 text-[12px] font-sans mt-0.5">{f.statSub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-28 sm:py-36 border-t border-white/[0.04]">
        <div className="max-w-[980px] mx-auto px-6 text-center">
          <h2 className="text-[40px] sm:text-[56px] font-bold tracking-[-0.03em] font-sans mb-4">
            准备好了吗？
          </h2>
          <p className="text-white/35 text-[17px] font-sans mb-10">上传一首歌，30 秒后你会听到完全不同的版本</p>
          <Link
            href="/sonic-gallery/cover"
            className="inline-flex items-center gap-2 bg-white text-black px-10 py-[16px] rounded-full text-[15px] font-semibold font-sans hover:bg-white/90 transition-colors active:scale-[0.98]"
          >
            开始翻唱
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-8 border-t border-white/[0.04]">
        <div className="max-w-[980px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-white flex items-center justify-center">
              <span className="text-black text-[9px] font-black">W</span>
            </div>
            <span className="text-white/20 text-[11px] font-sans">Copyright © 2026 方言回响. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-white/15 hover:text-white/40 text-[11px] font-sans transition-colors">隐私</Link>
            <Link href="#" className="text-white/15 hover:text-white/40 text-[11px] font-sans transition-colors">条款</Link>
            <Link href="#" className="text-white/15 hover:text-white/40 text-[11px] font-sans transition-colors">联系</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
