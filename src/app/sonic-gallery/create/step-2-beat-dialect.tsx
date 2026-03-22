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
  bpm: number
  duration: string
}

// Beat 库数据 - 使用占位音频 URL（实际项目中替换为真实音频）
const beatCategories = [
  {
    id: 'energetic',
    name: '激情',
    icon: 'local_fire_department',
    beats: [
      { id: 'beat-1', name: 'Fire Drill', bpm: 140, duration: '2:30', audioUrl: '/beats/fire-drill.mp3' },
      { id: 'beat-2', name: 'Thunder Road', bpm: 138, duration: '2:45', audioUrl: '/beats/thunder-road.mp3' },
      { id: 'beat-3', name: 'Night Runner', bpm: 145, duration: '3:00', audioUrl: '/beats/night-runner.mp3' },
      { id: 'beat-4', name: 'Power Move', bpm: 142, duration: '2:20', audioUrl: '/beats/power-move.mp3' },
      { id: 'beat-5', name: 'Street Kings', bpm: 136, duration: '2:55', audioUrl: '/beats/street-kings.mp3' },
    ],
  },
  {
    id: 'funny',
    name: '搞笑',
    icon: 'sentiment_very_satisfied',
    beats: [
      { id: 'beat-6', name: 'Bouncy Town', bpm: 110, duration: '2:10', audioUrl: '/beats/bouncy-town.mp3' },
      { id: 'beat-7', name: 'Goofy Groove', bpm: 105, duration: '2:25', audioUrl: '/beats/goofy-groove.mp3' },
      { id: 'beat-8', name: 'Happy Days', bpm: 115, duration: '2:00', audioUrl: '/beats/happy-days.mp3' },
      { id: 'beat-9', name: 'Silly Walk', bpm: 108, duration: '2:35', audioUrl: '/beats/silly-walk.mp3' },
      { id: 'beat-10', name: 'Comedy Club', bpm: 112, duration: '2:15', audioUrl: '/beats/comedy-club.mp3' },
    ],
  },
  {
    id: 'lyrical',
    name: '抒情',
    icon: 'favorite',
    beats: [
      { id: 'beat-11', name: 'Moonlit Path', bpm: 85, duration: '3:30', audioUrl: '/beats/moonlit-path.mp3' },
      { id: 'beat-12', name: 'Gentle Rain', bpm: 80, duration: '3:15', audioUrl: '/beats/gentle-rain.mp3' },
      { id: 'beat-13', name: 'Memory Lane', bpm: 88, duration: '3:00', audioUrl: '/beats/memory-lane.mp3' },
      { id: 'beat-14', name: 'Soft Dreams', bpm: 82, duration: '3:45', audioUrl: '/beats/soft-dreams.mp3' },
      { id: 'beat-15', name: 'Heartsong', bpm: 86, duration: '3:20', audioUrl: '/beats/heartsong.mp3' },
    ],
  },
  {
    id: 'general',
    name: '通用',
    icon: 'music_note',
    beats: [
      { id: 'beat-16', name: 'Classic Flow', bpm: 120, duration: '2:40', audioUrl: '/beats/classic-flow.mp3' },
      { id: 'beat-17', name: 'Smooth Operator', bpm: 118, duration: '2:50', audioUrl: '/beats/smooth-operator.mp3' },
      { id: 'beat-18', name: 'Urban Beat', bpm: 125, duration: '2:30', audioUrl: '/beats/urban-beat.mp3' },
      { id: 'beat-19', name: 'Chill Vibes', bpm: 115, duration: '3:00', audioUrl: '/beats/chill-vibes.mp3' },
      { id: 'beat-20', name: 'Night Cruise', bpm: 122, duration: '2:45', audioUrl: '/beats/night-cruise.mp3' },
    ],
  },
]

// 获取所有 beat 的映射
const allBeats = beatCategories.flatMap(c => c.beats).reduce((acc, beat) => {
  acc[beat.id] = beat
  return acc
}, {} as Record<string, typeof beatCategories[0]['beats'][0] & { audioUrl: string }>)

export function Step2BeatDialect({ onNext, onPrev }: Step2BeatDialectProps) {
  const { state, setDialect, setBeat, setCustomBeat } = useCreateContext()
  const [playingBeat, setPlayingBeat] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('energetic')
  const [audioProgress, setAudioProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // 从 context 获取选中的方言和 beat
  const selectedDialect = state.dialect.selected
  const selectedBeat = state.beat.selected

  // 初始化音频上下文
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
    }
    return audioContextRef.current
  }, [])

  // 播放 Beat
  const handlePlayBeat = useCallback((beatId: string) => {
    // 如果正在播放同一个 beat，则暂停
    if (playingBeat === beatId && audioRef.current) {
      audioRef.current.pause()
      setPlayingBeat(null)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    // 停止之前的播放
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // 创建新的音频元素
    const beat = allBeats[beatId]
    if (!beat) return

    // 使用 Web Audio API 播放
    try {
      const audio = new Audio(beat.audioUrl)
      audio.crossOrigin = 'anonymous'
      audioRef.current = audio

      // 连接到音频分析器
      const ctx = initAudioContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const source = ctx.createMediaElementSource(audio)
      source.connect(analyserRef.current!)
      analyserRef.current!.connect(ctx.destination)

      // 监听播放进度
      audio.addEventListener('timeupdate', () => {
        setAudioProgress((audio.currentTime / audio.duration) * 100)
      })

      audio.addEventListener('ended', () => {
        setPlayingBeat(null)
        setAudioProgress(0)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      })

      audio.addEventListener('error', (e) => {
        console.warn('Audio load error, using fallback oscillator')
        // 使用振荡器作为后备
        playFallbackOscillator(beat.bpm, beatId)
      })

      audio.play().catch(() => {
        // 如果播放失败，使用振荡器作为后备
        playFallbackOscillator(beat.bpm, beatId)
      })

      setPlayingBeat(beatId)
    } catch (error) {
      console.warn('Audio playback failed, using fallback')
      playFallbackOscillator(beat.bpm, beatId)
    }
  }, [playingBeat, initAudioContext])

  // 后备振荡器播放（当音频文件不可用时）
  const playFallbackOscillator = useCallback((bpm: number, beatId: string) => {
    try {
      const ctx = initAudioContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      // 创建简单的节拍
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // 根据 BPM 设置频率
      oscillator.frequency.value = 220 + (bpm - 100) * 2
      oscillator.type = 'sawtooth'

      // 设置音量包络
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)

      setPlayingBeat(beatId)

      // 0.5秒后停止
      setTimeout(() => {
        if (playingBeat === beatId) {
          setPlayingBeat(null)
        }
      }, 500)
    } catch (e) {
      console.error('Fallback oscillator failed:', e)
      setPlayingBeat(null)
    }
  }, [initAudioContext, playingBeat])

  // 处理自定义 Beat 上传
  const handleCustomBeatUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCustomBeat(file)
      setBeat(null) // 清除预设选择
    }
  }

  // 检查是否可以进入下一步
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
            {state.dialect.dialects.map((dialect) => (
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
                Beat 库
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 text-xs font-medium">
                20 首预设
              </span>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {beatCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px] ${
                    activeCategory === category.id
                      ? 'bg-white/[0.08] text-white border border-white/[0.15]'
                      : 'bg-white/[0.02] text-white/50 border border-white/[0.05] hover:bg-white/[0.04]'
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {beatCategories.find(c => c.id === activeCategory)?.beats.map((beat) => (
                <button
                  key={beat.id}
                  onClick={() => { setBeat(beat.id); setCustomBeat(null); }}
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
                      handlePlayBeat(beat.id)
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
                <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-full bg-white/[0.02] border border-white/[0.05]">
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
          disabled={!canProceed}
          className={`group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 active:scale-95 min-h-[48px] w-full sm:w-auto btn-press font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
            canProceed
              ? 'bg-white text-black hover:shadow-lg hover:shadow-white/20'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {canProceed ? '下一步' : '请选择 Beat'}
          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  )
}
