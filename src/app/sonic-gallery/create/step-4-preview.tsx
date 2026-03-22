'use client'

import { useState } from 'react'

interface Step4PreviewProps {
  onPrev: () => void
}

export function Step4Preview({ onPrev }: Step4PreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isEditingLyrics, setIsEditingLyrics] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(0)
  const [lyrics, setLyrics] = useState(`(前奏)

老子们成都的节奏在夜里跳动
穿越雾都的街道，节奏不停在燃烧
方言的魅力，让你感受到地道的味道
每一句押韵，都是文化的传承

(副歌)
川渝的调调，带你去飘摇
东北的味儿，老铁杠杠滴
粤语的韵脚，听着真带感
普通话的标准，全国都传遍

(尾奏)
这就是咱们的方言Rap
独特的韵味，你值得拥有`)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
      {/* Left Column */}
      <div className="lg:col-span-4 space-y-8">
        {/* Header */}
        <div>
          <span className="text-emerald-400 text-sm font-medium tracking-wider uppercase mb-3 block">
            步骤四
          </span>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            预览你的杰作
          </h1>
          <p className="text-white/40 text-sm leading-relaxed font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            你的 AI 方言说唱作品已准备就绪。试听确认后，保存到你的音乐库。
          </p>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-4">
          {[
            { label: '歌词生成', status: 'done' as const, time: '0.8秒' },
            { label: '节奏对齐', status: 'done' as const, time: '1.2秒' },
            { label: '最终混音', status: 'done' as const, time: '2.4秒' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.status === 'done'
                  ? 'bg-emerald-500/20'
                  : 'bg-violet-500/20'
              }`}>
                {item.status === 'done' ? (
                  <span className="material-symbols-outlined text-emerald-400 text-base">
                    check
                  </span>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    {item.label}
                  </span>
                  <span className={`text-xs ${
                    item.status === 'done' ? 'text-white/40' : 'text-violet-400'
                  }`}>
                    {item.status === 'done' ? item.time : `${item.progress}%`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Parameter Adjustment */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400 text-lg">
                tune
              </span>
              <span className="text-white font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                参数调整
              </span>
            </div>
            <button
              onClick={() => { setSpeed(1.0); setPitch(0); }}
              className="text-white/40 text-xs hover:text-white/60 transition-colors font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
            >
              重置
            </button>
          </div>

          {/* Speed Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">语速</span>
              <span className="text-white/60 text-xs font-mono">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/[0.1] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-violet-500 [&::-webkit-slider-thumb]:to-emerald-500"
            />
            <div className="flex justify-between text-white/30 text-xs">
              <span>0.5x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Pitch Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">音调</span>
              <span className="text-white/60 text-xs font-mono">{pitch > 0 ? '+' : ''}{pitch}</span>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="1"
              value={pitch}
              onChange={(e) => setPitch(parseInt(e.target.value))}
              className="w-full h-1 bg-white/[0.1] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-violet-500 [&::-webkit-slider-thumb]:to-emerald-500"
            />
            <div className="flex justify-between text-white/30 text-xs">
              <span>-5</span>
              <span>0</span>
              <span>+5</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          {/* Primary Actions */}
          <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-emerald-500 text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            <span className="material-symbols-outlined text-lg">download</span>
            导出音频
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.03] border border-white/[0.06] transition-all font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              <span className="material-symbols-outlined text-base">share</span>
              分享
            </button>
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.03] border border-white/[0.06] transition-all font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              <span className="material-symbols-outlined text-base">save</span>
              保存
            </button>
          </div>

          <button
            onClick={onPrev}
            className="w-full py-3 text-white/30 hover:text-white/60 text-sm transition-colors font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
          >
            返回修改
          </button>
        </div>
      </div>

      {/* Right Column - Player Card */}
      <div className="lg:col-span-8">
        <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-violet-900/30 to-emerald-900/30">
          {/* Background Image */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Content */}
          <div className="relative h-full p-8 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-emerald-400 text-xs font-medium tracking-wider uppercase">
                  正在预览
                </span>
                <h2 className="text-white text-2xl font-bold mt-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  成都漂移
                </h2>
                <p className="text-white/40 text-sm mt-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  川渝陷阱 · 粤语版
                </p>
              </div>
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>

            {/* Waveform */}
            <div className="flex items-end justify-between h-24 gap-0.5">
              {[20, 40, 70, 55, 90, 45, 100, 75, 30, 65, 85, 40, 60, 95, 50, 80, 35, 55, 25, 45, 70, 60, 40, 85].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all duration-150 ${
                    i < 10 ? 'bg-gradient-to-t from-violet-500 to-emerald-500' : 'bg-white/20'
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* Lyrics Display */}
            <div className="space-y-2 text-center mb-4">
              <p className="text-white/30 text-base italic font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                老子们成都的节奏在夜里跳动
              </p>
              <p className="text-white text-xl font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                穿越雾都的街道，节奏不停在燃烧...
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-8">
              <button className="text-white/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">skip_previous</span>
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20"
              >
                <span className="material-symbols-outlined text-3xl">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button className="text-white/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">skip_next</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lyrics Edit Section */}
        <div className="mt-6 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400 text-lg">
                lyrics
              </span>
              <span className="text-white font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                歌词
              </span>
            </div>
            <button
              onClick={() => setIsEditingLyrics(!isEditingLyrics)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isEditingLyrics
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              {isEditingLyrics ? '完成编辑' : '编辑歌词'}
            </button>
          </div>

          {isEditingLyrics ? (
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="w-full h-48 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-white/80 text-sm resize-none focus:outline-none focus:border-violet-500/30 font-['PingFang_SC','Noto_Sans_SC',sans-serif] leading-relaxed"
              placeholder="在此编辑歌词..."
            />
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 h-48 overflow-y-auto">
              <pre className="text-white/60 text-sm whitespace-pre-wrap font-['PingFang_SC','Noto_Sans_SC',sans-serif] leading-relaxed">
                {lyrics}
              </pre>
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="material-symbols-outlined text-sm">text_fields</span>
              <span>{lyrics.length} 字</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="material-symbols-outlined text-sm">music_note</span>
              <span>约 45 秒</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
