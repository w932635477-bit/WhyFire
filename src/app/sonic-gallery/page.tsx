'use client'

import { useState } from 'react'
import Link from 'next/link'

// 示例作品数据
const sampleWorks = [
  {
    id: '1',
    title: '成都漂移',
    dialect: '四川话',
    creator: '蜀山客',
    plays: 12800,
    cover: 'from-amber-600/30 to-red-600/20',
  },
  {
    id: '2',
    title: '东北爱情故事',
    dialect: '东北话',
    creator: '雪村大侠',
    plays: 8900,
    cover: 'from-sky-600/30 to-blue-600/20',
  },
  {
    id: '3',
    title: '珠江夜色',
    dialect: '粤语',
    creator: '粤语rapper',
    plays: 6700,
    cover: 'from-violet-600/30 to-purple-600/20',
  },
  {
    id: '4',
    title: '西安城墙下',
    dialect: '陕西话',
    creator: '长安客',
    plays: 5200,
    cover: 'from-emerald-600/30 to-teal-600/20',
  },
]

// 方言卡片
const dialectCards = [
  { name: '粤语', region: '广东', emoji: '🦁', color: 'from-amber-500/20 to-orange-500/10' },
  { name: '四川话', region: '川渝', emoji: '🌶️', color: 'from-red-500/20 to-rose-500/10' },
  { name: '东北话', region: '东北', emoji: '❄️', color: 'from-sky-500/20 to-blue-500/10' },
  { name: '闽南语', region: '福建', emoji: '🌊', color: 'from-cyan-500/20 to-teal-500/10' },
  { name: '上海话', region: '吴语', emoji: '🌃', color: 'from-violet-500/20 to-purple-500/10' },
  { name: '陕西话', region: '秦腔', emoji: '🏯', color: 'from-emerald-500/20 to-green-500/10' },
  { name: '天津话', region: '津门', emoji: '🎭', color: 'from-pink-500/20 to-rose-500/10' },
  { name: '南京话', region: '金陵', emoji: '🌸', color: 'from-fuchsia-500/20 to-pink-500/10' },
]

export default function SonicGalleryHome() {
  const [hoveredWork, setHoveredWork] = useState<string | null>(null)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* 背景 */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.3) contrast(1.1) saturate(0.7)' }}
          >
            <source src="/videos/9003210-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/60" />
        </div>

        {/* 内容 */}
        <div className="relative z-10 px-6 sm:px-8 lg:px-20 pt-32 pb-24 lg:pt-40 lg:pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12 lg:gap-16">
              {/* 左侧文案 */}
              <div className="flex-1 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] mb-5 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-white/60 text-xs font-sans">方言回响 · 全新上线</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.15] tracking-tight mb-4 font-sans">
                  用你的声音，
                  <br />
                  <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                    唱方言 Rap
                  </span>
                </h1>

                <p className="text-white/45 text-base sm:text-lg max-w-md leading-relaxed mb-8 font-sans">
                  上传一段人声，AI 克隆你的音色，生成独一无二的方言说唱。5 分钟完成。
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/sonic-gallery/create"
                    className="group inline-flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-white/20 transition-all duration-300 active:scale-95"
                  >
                    开始创作
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </Link>
                  <Link
                    href="/sonic-gallery/beats"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-white/70 text-sm font-medium border border-white/[0.1] hover:bg-white/[0.05] hover:text-white hover:border-white/[0.2] transition-all"
                  >
                    <span className="material-symbols-outlined text-base">graphic_eq</span>
                    浏览伴奏
                  </Link>
                </div>

                {/* 小数据 */}
                <div className="flex items-center gap-6 mt-8">
                  <div>
                    <span className="text-white font-bold text-lg">8</span>
                    <span className="text-white/30 text-xs ml-1 font-sans">种方言</span>
                  </div>
                  <div className="w-px h-4 bg-white/[0.1]" />
                  <div>
                    <span className="text-white font-bold text-lg">99%</span>
                    <span className="text-white/30 text-xs ml-1 font-sans">音色相似度</span>
                  </div>
                  <div className="w-px h-4 bg-white/[0.1]" />
                  <div>
                    <span className="text-white font-bold text-lg">5min</span>
                    <span className="text-white/30 text-xs ml-1 font-sans">完成创作</span>
                  </div>
                </div>
              </div>

              {/* 右侧 - 快速体验卡片 */}
              <div className="flex-shrink-0 w-full max-w-sm">
                <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="material-symbols-outlined text-violet-400 text-lg">bolt</span>
                    <span className="text-white/80 text-sm font-medium font-sans">快速体验流程</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: 'mic', label: '录音或上传人声', desc: '1-2 分钟' },
                      { icon: 'language', label: '选择方言风格', desc: '10 秒' },
                      { icon: 'auto_awesome', label: 'AI 生成歌词', desc: '1 分钟' },
                      { icon: 'play_circle', label: '导出你的 Rap', desc: '2 分钟' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-white/50 text-sm">{step.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-white/80 text-sm font-sans block">{step.label}</span>
                        </div>
                        <span className="text-white/25 text-xs font-sans flex-shrink-0">{step.desc}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/sonic-gallery/create"
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-emerald-500 text-white font-semibold text-sm hover:opacity-90 transition-all btn-press"
                  >
                    <span className="material-symbols-outlined text-base">mic</span>
                    立即开始
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 热门作品 */}
      <section className="px-6 sm:px-8 lg:px-20 py-16 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white font-sans">热门作品</h2>
              <p className="text-white/35 text-sm mt-1 font-sans">听听其他人创作的方言 Rap</p>
            </div>
            <Link href="/sonic-gallery/beats" className="text-white/40 hover:text-white/70 text-sm flex items-center gap-1 transition-colors font-sans">
              查看全部
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {sampleWorks.map((work) => (
              <button
                key={work.id}
                onMouseEnter={() => setHoveredWork(work.id)}
                onMouseLeave={() => setHoveredWork(null)}
                className="group text-left"
              >
                <div className={`relative aspect-[4/3] rounded-xl bg-gradient-to-br ${work.cover} overflow-hidden mb-3`}>
                  {/* 模拟封面 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all">
                      <span className={`material-symbols-outlined text-white ${hoveredWork === work.id ? 'text-xl' : 'text-lg'}`}>
                        play_arrow
                      </span>
                    </div>
                  </div>
                  {/* 底部渐变 */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                    <span className="text-[10px] text-white/60 font-sans">{work.dialect}</span>
                    <span className="text-[10px] text-white/40 font-sans">
                      {work.plays >= 10000 ? `${(work.plays / 10000).toFixed(1)}w` : `${(work.plays / 1000).toFixed(1)}k`}
                    </span>
                  </div>
                </div>
                <h3 className="text-white/90 text-sm font-medium font-sans truncate">{work.title}</h3>
                <p className="text-white/30 text-xs font-sans mt-0.5">{work.creator}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 方言展示 */}
      <section className="px-6 sm:px-8 lg:px-20 py-16 bg-[#080808]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-white font-sans">支持方言</h2>
            <p className="text-white/35 text-sm mt-1 font-sans">覆盖中国核心方言体系</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
            {dialectCards.map((d) => (
              <div
                key={d.name}
                className={`group flex flex-col items-center p-3 sm:p-4 rounded-xl bg-gradient-to-br ${d.color} border border-white/[0.04] hover:border-white/[0.1] transition-all cursor-default`}
              >
                <span className="text-2xl sm:text-3xl mb-1">{d.emoji}</span>
                <span className="text-white/80 text-xs sm:text-sm font-medium font-sans">{d.name}</span>
                <span className="text-white/25 text-[10px] sm:text-xs font-sans">{d.region}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 核心技术 */}
      <section className="px-6 sm:px-8 lg:px-20 py-16 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: 'record_voice_over',
                title: '零样本声音克隆',
                desc: '仅需 5 秒样本，Seed-VC 实时提取声纹特征，保留个人辨识度',
                stat: '99%',
                statLabel: '相似度',
              },
              {
                icon: 'auto_awesome',
                title: '爆款歌词生成',
                desc: 'AI 分析方言文化符号与热梗，生成有记忆点的歌词',
                stat: '30s',
                statLabel: '生成耗时',
              },
              {
                icon: 'graphic_eq',
                title: '智能节奏对齐',
                desc: 'SunoAPI Add Vocals + Seed-VC 零样本克隆，歌词咬字完美落点',
                stat: '2400+',
                statLabel: '方言词条',
              },
            ].map((feature) => (
              <div key={feature.title} className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-violet-400 text-xl">{feature.icon}</span>
                  <span className="text-white font-medium text-sm font-sans">{feature.title}</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed mb-5 font-sans">{feature.desc}</p>
                <div className="pt-4 border-t border-white/[0.04]">
                  <span className="text-white font-bold text-lg">{feature.stat}</span>
                  <span className="text-white/25 text-xs ml-1.5 font-sans">{feature.statLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-8 lg:px-20 py-12 bg-[#080808] border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-white/40 text-xs font-sans">© 2024 方言回响 · WhyFire Studio</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-white/25 hover:text-white/50 text-xs font-sans transition-colors">隐私协议</Link>
            <Link href="#" className="text-white/25 hover:text-white/50 text-xs font-sans transition-colors">使用条款</Link>
            <Link href="#" className="text-white/25 hover:text-white/50 text-xs font-sans transition-colors">联系我们</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
