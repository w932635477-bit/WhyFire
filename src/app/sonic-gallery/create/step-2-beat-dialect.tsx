'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useCreateContext } from './create-context'

interface Step2BeatDialectProps {
  onNext: () => void
  onPrev: () => void
}

interface BeatInfo {
  id: string
  name: string
  url: string
  bpm: number
  duration: string
  styleTags: string
  energy: 'low' | 'medium' | 'high'
  mood: string[]
}

// UI 显示名称映射
const BGM_DISPLAY_NAMES: Record<string, string> = {
  'fortune-flow': '八方来财',
  'karma-dark': '因果',
  'apt-remix': 'APT.',
  'brazilian-phonk': 'BRAZIL',
  'warm-gray': '暖灰',
  'wonderful-01': '精彩01',
}

// BGM 列表（从 API 动态加载，这里作为 fallback）
const FALLBACK_BEATS: BeatInfo[] = [
  { id: 'fortune-flow', name: '八方来财', url: 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/bgm/八方来财.mp3', bpm: 137, duration: '1:45', styleTags: 'pop rap, upbeat, positive', energy: 'high', mood: ['happy', 'confident'] },
  { id: 'karma-dark', name: '因果', url: 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/bgm/因果-改.mp3', bpm: 110, duration: '2:28', styleTags: 'dark trap, drill, mysterious', energy: 'medium', mood: ['dark', 'mysterious'] },
  { id: 'apt-remix', name: 'APT.', url: 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/bgm/apt-改.mp3', bpm: 99, duration: '2:08', styleTags: 'trap, dark, heavy 808', energy: 'high', mood: ['aggressive', 'confident'] },
  { id: 'brazilian-phonk', name: 'BRAZIL', url: 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/bgm/brazli-改.mp3', bpm: 70, duration: '2:13', styleTags: 'brazilian phonk, drill, heavy bass', energy: 'high', mood: ['intense', 'energetic'] },
  { id: 'warm-gray', name: '暖灰', url: 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/bgm/暖灰-改.mp3', bpm: 78, duration: '1:41', styleTags: 'lo-fi, chill, ambient, smooth', energy: 'low', mood: ['relaxed', 'dreamy'] },
  { id: 'wonderful-01', name: '精彩01', url: 'https://whyfire-02.oss-cn-beijing.aliyuncs.com/bgm/精彩01.mp3', bpm: 120, duration: '2:16', styleTags: 'pop rap, upbeat, positive', energy: 'high', mood: ['happy', 'confident'] },
]

// 默认BGM - 八方来财（最火）
const DEFAULT_BEAT = FALLBACK_BEATS[0]

export function Step2BeatDialect({ onNext, onPrev }: Step2BeatDialectProps) {
  const { state, setDialect, setBeat, setCustomBeat } = useCreateContext()
  const [playingBeat, setPlayingBeat] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initializedRef = useRef(false)

  // 从 context 获取选中的方言和 beat
  const selectedDialect = state.dialect.selected
  const selectedBeat = state.beat.selected

  // 自动选择默认BGM（只执行一次）
  useEffect(() => {
    if (!initializedRef.current && !state.beat.selected && !state.beat.customBeatFile) {
      initializedRef.current = true
      setBeat(DEFAULT_BEAT.id)
    }
  }, [setBeat, state.beat.selected, state.beat.customBeatFile])

  // 获取当前选中beat的信息
  const getSelectedBeatInfo = useCallback(() => {
    return FALLBACK_BEATS.find(b => b.id === selectedBeat) || DEFAULT_BEAT
  }, [selectedBeat])

  // 播放/暂停 Beat
  const handlePlayBeat = useCallback((beat: BeatInfo) => {
    // 如果正在播放同一个 beat，则暂停
    if (playingBeat === beat.id && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlayingBeat(null)
      return
    }

    // 停止之前的播放
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    // 播放新的音频（使用 OSS URL）
    const audio = new Audio(beat.url)
    audioRef.current = audio
    audio.play()
    setPlayingBeat(beat.id)

    // 播放结束后重置
    audio.onended = () => {
      setPlayingBeat(null)
    }
  }, [playingBeat])

  // 处理自定义 Beat 上传
  const handleCustomBeatUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCustomBeat(file)
      setBeat(null)
    }
  }

  // 检查是否可以进入下一步（现在总是可以，因为自动选择了BGM）
  const canProceed = selectedBeat || state.beat.customBeatFile

  // 清理音频播放
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-emerald-400 text-sm font-medium tracking-wider uppercase mb-3 block">
          步骤二
        </span>
        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          选择你的声音风格
        </h2>
        <p className="text-white/40 text-base leading-relaxed font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          使用你的原声本色，或选择一种方言风格来演绎你的说唱
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
              选择声音风格
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 text-xs font-medium">
              选择一种
            </span>
          </div>

          {/* Original Voice - 突出显示 */}
          <div className="mb-4">
            <button
              onClick={() => setDialect('original')}
              className={`group relative w-full flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 ${
                selectedDialect === 'original'
                  ? 'bg-gradient-to-r from-violet-500/20 to-emerald-500/20 border-2 border-violet-500/50 shadow-lg shadow-violet-500/10'
                  : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedDialect === 'original'
                  ? 'bg-gradient-to-br from-violet-500 to-emerald-500'
                  : 'bg-white/[0.05] group-hover:bg-white/[0.08]'
              }`}>
                <span className={`material-symbols-outlined text-2xl ${
                  selectedDialect === 'original' ? 'text-white' : 'text-white/50'
                }`}>
                  person
                </span>
              </div>
              <div className="flex-1 text-left">
                <span className={`text-xl font-semibold block mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
                  selectedDialect === 'original' ? 'text-white' : 'text-white/80 group-hover:text-white'
                }`}>
                  原声
                </span>
                <span className={`text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
                  selectedDialect === 'original' ? 'text-violet-300' : 'text-white/40'
                }`}>
                  使用你的原始声音本色，不添加方言口音
                </span>
              </div>
              {selectedDialect === 'original' && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-violet-500/30 text-violet-300 text-xs font-medium">
                    推荐
                  </span>
                  <span className="material-symbols-outlined text-violet-400 text-2xl">check_circle</span>
                </div>
              )}
            </button>
          </div>

          {/* Dialect Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              或选择方言风格
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Dialect Grid - 9种方言 */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
            {state.dialect.dialects.filter(d => d.id !== 'original').map((dialect) => (
              <button
                key={dialect.id}
                onClick={() => setDialect(dialect.id)}
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
                精选伴奏
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                已自动选择
              </span>
            </div>

            {/* Beat List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FALLBACK_BEATS.map((beat) => (
                <button
                  key={beat.id}
                  onClick={() => {
                    setBeat(beat.id)
                    setCustomBeat(null)
                  }}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    selectedBeat === beat.id
                      ? 'bg-white/[0.05] border border-white/[0.15]'
                      : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
                  }`}
                >
                  {/* Play Button */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      playingBeat === beat.id
                        ? 'bg-emerald-500 text-black'
                        : 'bg-white/[0.05] text-white/60 group-hover:bg-white/[0.08]'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayBeat(beat)
                    }}
                  >
                    <span className="material-symbols-outlined text-base">
                      {playingBeat === beat.id ? 'pause' : 'play_arrow'}
                    </span>
                  </div>

                  {/* Beat Info */}
                  <div className="flex-1 text-left">
                    <h4 className="text-white/80 font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                      {beat.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white/35 text-xs">
                        {beat.bpm} BPM
                      </span>
                      <span className="text-white/20 text-xs">·</span>
                      <span className="text-white/35 text-xs">
                        {beat.duration}
                      </span>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {selectedBeat === beat.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Beat Upload - 或上传自定义伴奏 */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white/30 text-xs">或者</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleCustomBeatUpload}
              className="hidden"
            />
            <div
              className={`p-5 rounded-2xl transition-colors cursor-pointer group ${
                state.beat.customBeatFile
                  ? 'bg-gradient-to-br from-violet-500/10 to-emerald-500/10 border-2 border-violet-500/30'
                  : 'bg-white/[0.02] border border-white/[0.04] border-dashed hover:border-white/[0.1]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white/50 text-lg">
                    cloud_upload
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white/80 font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    上传自定义伴奏
                  </h4>
                  <p className="text-white/35 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    拖拽音频文件或点击浏览（支持 MP3、WAV、FLAC）
                  </p>
                  {state.beat.customBeatFile && (
                    <p className="text-emerald-400/80 text-xs mt-2">✓ {state.beat.customBeatFile.name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Current Selection Card */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-violet-400 text-xs font-medium tracking-wider uppercase">
                当前选择
              </span>
              <span className="material-symbols-outlined text-violet-400 text-2xl">
                music_note
              </span>
            </div>
            <h3 className="text-white font-semibold text-xl mb-3 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              {getSelectedBeatInfo().name}
            </h3>
            <p className="text-white/40 text-sm leading-relaxed mb-4 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              精选热门伴奏，自动匹配最佳节奏
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
                <h4 className="text-white font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">节拍分析</h4>
                <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif']">{getSelectedBeatInfo().bpm} BPM</p>
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
      <div className="flex flex-col-reverse sm:flex-row justify-between items-end gap-4 pt-6 border-t border-white/[0.04]">
        <div className="w-full sm:w-auto">
          <button
            onClick={onPrev}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white/60 hover:text-white hover:bg-white/[0.03] transition-all min-h-[48px] w-full sm:w-auto font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
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
          className="group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 active:scale-95 min-h-[48px] w-full sm:w-auto btn-press font-['PingFang_SC','Noto_Sans_SC',sans-serif] bg-white text-black hover:shadow-lg hover:shadow-white/20"
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
