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

export function Step2BeatDialect({ onNext, onPrev }: Step2BeatDialectProps) {
  const [selectedDialect, setSelectedDialect] = useState('cantonese')

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

          {/* Beat Upload */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-50" />
            <div className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/[0.04] border-dashed hover:border-violet-500/30 transition-colors cursor-pointer group">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-white/60 text-3xl">
                    cloud_upload
                  </span>
                </div>
                <h4 className="text-white font-semibold text-lg mb-2 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  上传伴奏
                </h4>
                <p className="text-white/40 text-sm mb-6 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  拖拽音频文件或点击浏览（支持 MP3、WAV、FLAC）
                </p>
                <div className="flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-violet-400 text-base">speed</span>
                    <span className="text-xs text-white/50 font-mono">节奏 --</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-base">schedule</span>
                    <span className="text-xs text-white/50 font-mono">时长 00:00</span>
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
      <div className="flex justify-between pt-6 border-t border-white/[0.04]">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white/60 hover:text-white hover:bg-white/[0.03] transition-all font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          上一步
        </button>
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
