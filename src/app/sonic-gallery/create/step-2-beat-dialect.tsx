'use client'

import { useState } from 'react'

interface Step2BeatDialectProps {
  onNext: () => void
  onPrev: () => void
}

const dialects = [
  { id: 'mandarin', name: '普通话', region: '标准' },
  { id: 'cantonese', name: '粤语', region: '广东' },
  { id: 'sichuan', name: '四川话', region: '川渝' },
  { id: 'dongbei', name: '东北话', region: '东北' },
  { id: 'shandong', name: '山东话', region: '齐鲁' },
  { id: 'shanghai', name: '上海话', region: '吴语' },
  { id: 'henan', name: '河南话', region: '中原' },
  { id: 'hunan', name: '湖南话', region: '湘语' },
]

// Beat 库数据
const beatCategories = [
  {
    id: 'energetic',
    name: '激情',
    color: 'from-orange-500/20 to-red-500/20',
    icon: 'local_fire_department',
    beats: [
      { id: 'beat-1', name: 'Fire Drill', bpm: 140, duration: '2:30' },
      { id: 'beat-2', name: 'Thunder Road', bpm: 138, duration: '2:45' },
      { id: 'beat-3', name: 'Night Runner', bpm: 145, duration: '3:00' },
      { id: 'beat-4', name: 'Power Move', bpm: 142, duration: '2:20' },
      { id: 'beat-5', name: 'Street Kings', bpm: 136, duration: '2:55' },
    ],
  },
  {
    id: 'funny',
    name: '搞笑',
    color: 'from-yellow-500/20 to-amber-500/20',
    icon: 'sentiment_very_satisfied',
    beats: [
      { id: 'beat-6', name: 'Bouncy Town', bpm: 110, duration: '2:10' },
      { id: 'beat-7', name: 'Goofy Groove', bpm: 105, duration: '2:25' },
      { id: 'beat-8', name: 'Happy Days', bpm: 115, duration: '2:00' },
      { id: 'beat-9', name: 'Silly Walk', bpm: 108, duration: '2:35' },
      { id: 'beat-10', name: 'Comedy Club', bpm: 112, duration: '2:15' },
    ],
  },
  {
    id: 'lyrical',
    name: '抒情',
    color: 'from-blue-500/20 to-cyan-500/20',
    icon: 'favorite',
    beats: [
      { id: 'beat-11', name: 'Moonlit Path', bpm: 85, duration: '3:30' },
      { id: 'beat-12', name: 'Gentle Rain', bpm: 80, duration: '3:15' },
      { id: 'beat-13', name: 'Memory Lane', bpm: 88, duration: '3:00' },
      { id: 'beat-14', name: 'Soft Dreams', bpm: 82, duration: '3:45' },
      { id: 'beat-15', name: 'Heartsong', bpm: 86, duration: '3:20' },
    ],
  },
  {
    id: 'general',
    name: '通用',
    color: 'from-violet-500/20 to-purple-500/20',
    icon: 'music_note',
    beats: [
      { id: 'beat-16', name: 'Classic Flow', bpm: 120, duration: '2:40' },
      { id: 'beat-17', name: 'Smooth Operator', bpm: 118, duration: '2:50' },
      { id: 'beat-18', name: 'Urban Beat', bpm: 125, duration: '2:30' },
      { id: 'beat-19', name: 'Chill Vibes', bpm: 115, duration: '3:00' },
      { id: 'beat-20', name: 'Night Cruise', bpm: 122, duration: '2:45' },
    ],
  },
]

export function Step2BeatDialect({ onNext, onPrev }: Step2BeatDialectProps) {
  const [selectedDialect, setSelectedDialect] = useState('cantonese')
  const [selectedBeat, setSelectedBeat] = useState<string | null>(null)
  const [playingBeat, setPlayingBeat] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('energetic')

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-emerald-400 text-sm font-medium tracking-wider uppercase mb-3 block">
          步骤二
        </span>
        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          选择你的声音灵魂
        </h2>
        <p className="text-white/40 text-base leading-relaxed font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          每种方言都有独特的韵律魅力，选择一种方言来定义你的说唱风格
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dialect Selection */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section Title */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white/40">language</span>
            <h3 className="text-white font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              方言库
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 text-xs font-medium">
              选择一种
            </span>
          </div>

          {/* Dialect Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dialects.map((dialect) => (
              <button
                key={dialect.id}
                onClick={() => setSelectedDialect(dialect.id)}
                className={`group relative flex flex-col items-center justify-center p-5 rounded-2xl transition-all duration-300 ${
                  selectedDialect === dialect.id
                    ? 'bg-gradient-to-br from-violet-500/10 to-emerald-500/10 border-2 border-violet-500/30'
                    : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
                }`}
              >
                <span className={`text-lg font-medium mb-1 transition-colors font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
                  selectedDialect === dialect.id ? 'text-white' : 'text-white/70 group-hover:text-white'
                }`}>
                  {dialect.name}
                </span>
                <span className={`text-xs tracking-wider transition-colors ${
                  selectedDialect === dialect.id ? 'text-violet-400' : 'text-white/30'
                }`}>
                  {dialect.region}
                </span>
                {selectedDialect === dialect.id && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" />
                )}
              </button>
            ))}
          </div>

          {/* Beat Library Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white/40">graphic_eq</span>
              <h3 className="text-white font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                Beat 库
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 text-xs font-medium">
                20 首预设
              </span>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {beatCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white border border-white/20`
                      : 'bg-white/[0.03] text-white/50 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {category.icon}
                  </span>
                  {category.name}
                </button>
              ))}
            </div>

            {/* Beat List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {beatCategories.find(c => c.id === activeCategory)?.beats.map((beat) => (
                <button
                  key={beat.id}
                  onClick={() => setSelectedBeat(beat.id)}
                  className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                    selectedBeat === beat.id
                      ? 'bg-gradient-to-r from-violet-500/10 to-emerald-500/10 border border-violet-500/30'
                      : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
                  }`}
                >
                  {/* Play Button */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      playingBeat === beat.id
                        ? 'bg-emerald-500 text-black'
                        : 'bg-white/[0.05] text-white/60 group-hover:bg-white/10'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setPlayingBeat(playingBeat === beat.id ? null : beat.id)
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {playingBeat === beat.id ? 'pause' : 'play_arrow'}
                    </span>
                  </div>

                  {/* Beat Info */}
                  <div className="flex-1 text-left">
                    <h4 className="text-white font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                      {beat.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-white/40 text-xs">
                        {beat.bpm} BPM
                      </span>
                      <span className="text-white/30 text-xs">•</span>
                      <span className="text-white/40 text-xs">
                        {beat.duration}
                      </span>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {selectedBeat === beat.id && (
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Beat Upload - 或上传自定义伴奏 */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white/40 text-sm">或者</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] border-dashed hover:border-violet-500/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-white/60 text-2xl">
                    cloud_upload
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    上传自定义伴奏
                  </h4>
                  <p className="text-white/40 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    拖拽音频文件或点击浏览（支持 MP3、WAV、FLAC）
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-violet-400 text-sm">speed</span>
                    <span className="text-xs text-white/50">自动检测 BPM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Style Card */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-violet-400 text-xs font-medium tracking-wider uppercase">
                当前风格
              </span>
              <span className="material-symbols-outlined text-violet-400 text-2xl">
                mood
              </span>
            </div>
            <h3 className="text-white font-semibold text-xl mb-3 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              幽默风
            </h3>
            <p className="text-white/40 text-sm leading-relaxed mb-4 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              系统将自动捕捉歌词中的梗点，利用方言韵律进行趣味化演绎。
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <span className="material-symbols-outlined text-emerald-400 text-base">check</span>
                <span className="font-['PingFang_SC','Noto_Sans_SC',sans-serif]">智能押韵增强</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <span className="material-symbols-outlined text-emerald-400 text-base">check</span>
                <span className="font-['PingFang_SC','Noto_Sans_SC',sans-serif]">语调情绪模拟</span>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-400 text-xl">
                  bolt
                </span>
              </div>
              <div>
                <h4 className="text-white font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">实时分析</h4>
                <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">等待上传</p>
              </div>
            </div>
            {/* Waveform Placeholder */}
            <div className="flex items-end justify-between h-10 gap-0.5">
              {[20, 40, 60, 35, 80, 45, 70, 30, 55, 40, 65, 25].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-violet-500/30 to-emerald-500/30 rounded-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-end pt-6 border-t border-white/[0.04]">
        <div>
          <button
            onClick={onPrev}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white/60 hover:text-white hover:bg-white/[0.03] transition-all font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            上一步
          </button>
        </div>
        {/* 下一步预览 */}
        <div className="hidden md:block text-right">
          <p className="text-white/30 text-xs mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">下一步</p>
          <div className="flex items-center justify-end gap-2">
            <span className="text-white/50 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              AI 帮你生成个性化歌词
            </span>
            <span className="material-symbols-outlined text-violet-400 text-lg">lyrics</span>
          </div>
        </div>
        <button
          onClick={onNext}
          className="group inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-semibold text-base hover:shadow-lg hover:shadow-white/20 transition-all duration-300 active:scale-95 font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
        >
          下一步
          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  )
}
