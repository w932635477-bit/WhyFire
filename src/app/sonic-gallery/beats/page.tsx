'use client'

import { useState } from 'react'

const beats = [
  { id: 1, name: '川渝陷阱', bpm: 140, duration: '3:24', dialect: '四川话', plays: '12.5k', cover: '🔥' },
  { id: 2, name: '粤语摇摆', bpm: 128, duration: '2:58', dialect: '粤语', plays: '8.3k', cover: '🐉' },
  { id: 3, name: '东北民谣风', bpm: 95, duration: '4:12', dialect: '东北话', plays: '6.7k', cover: '❄️' },
  { id: 4, name: '上海霓虹', bpm: 135, duration: '3:05', dialect: '上海话', plays: '5.2k', cover: '🌃' },
  { id: 5, name: '齐鲁雄风', bpm: 120, duration: '3:45', dialect: '山东话', plays: '4.8k', cover: '⚔️' },
  { id: 6, name: '湘江夜雨', bpm: 110, duration: '4:30', dialect: '湖南话', plays: '3.9k', cover: '🌧️' },
]

const categories = ['全部', '粤语', '四川话', '东北话', '上海话', '山东话', '湖南话']

export default function BeatsPage() {
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [playingId, setPlayingId] = useState<number | null>(null)

  const filteredBeats = selectedCategory === '全部'
    ? beats
    : beats.filter(b => b.dialect === selectedCategory)

  return (
    <div className="px-8 lg:px-16 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <span className="text-violet-400 text-sm font-medium tracking-wider uppercase mb-2 block">
          节奏库
        </span>
        <h1 className="text-3xl font-bold text-white tracking-tight font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          发现热门节奏
        </h1>
        <p className="text-white/40 text-sm mt-2 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          浏览社区创作的方言说唱节奏，找到你的灵感
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
              selectedCategory === cat
                ? 'bg-white text-black'
                : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Beats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBeats.map((beat) => (
          <div
            key={beat.id}
            className="group p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
          >
            {/* Cover */}
            <div className="relative aspect-square rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 mb-4 flex items-center justify-center overflow-hidden">
              <span className="text-5xl">{beat.cover}</span>
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <button
                  onClick={() => setPlayingId(playingId === beat.id ? null : beat.id)}
                  className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <span className="material-symbols-outlined text-black text-2xl">
                    {playingId === beat.id ? 'pause' : 'play_arrow'}
                  </span>
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2">
              <h3 className="text-white font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                {beat.name}
              </h3>
              <div className="flex items-center justify-between text-xs text-white/40">
                <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">
                  {beat.dialect}
                </span>
                <span>{beat.bpm} BPM</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/30">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">headphones</span>
                  {beat.plays}
                </span>
                <span>{beat.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload CTA */}
      <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-violet-500/10 to-emerald-500/10 border border-white/[0.06] text-center">
        <span className="material-symbols-outlined text-white/40 text-4xl mb-4 block">
          cloud_upload
        </span>
        <h3 className="text-white font-semibold text-lg mb-2 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          上传你的节奏
        </h3>
        <p className="text-white/40 text-sm mb-4 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          分享你的创作，让更多人听到你的作品
        </p>
        <button className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-medium text-sm hover:shadow-lg hover:shadow-white/20 transition-all font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          <span className="material-symbols-outlined text-base">add</span>
          立即上传
        </button>
      </div>
    </div>
  )
}
