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
  const { state, setDialect, setBeat } = useCreateContext()
  const [playingBeat, setPlayingBeat] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const initializedRef = useRef(false)

  // 从 context 获取选中的方言和 beat
  const selectedDialect = state.dialect.selected
  const selectedBeat = state.beat.selected

  // 自动选择默认BGM（只执行一次）
  useEffect(() => {
    if (!initializedRef.current && !state.beat.selected) {
      initializedRef.current = true
      setBeat(DEFAULT_BEAT.id)
    }
  }, [setBeat, state.beat.selected])

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

  // 检查是否可以进入下一步（现在总是可以，因为自动选择了BGM）
  const canProceed = !!selectedBeat

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
    <div className="space-y-6">
      {/* Header - 简洁 */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1 font-sans">
          选择声音风格
        </h2>
        <p className="text-white/40 text-sm font-sans">
          使用原声本色，或选择方言风格演绎你的说唱
        </p>
      </div>

      {/* Dialect Selection - 横向滚动 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-white/40 text-lg">language</span>
          <h3 className="text-white font-semibold text-sm font-sans">声音风格</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {state.dialect.dialects.map((dialect) => (
            <button
              key={dialect.id}
              onClick={() => setDialect(dialect.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                selectedDialect === dialect.id
                  ? 'bg-white/[0.1] border border-white/[0.2] text-white'
                  : 'bg-white/[0.03] border border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
              }`}
            >
              {dialect.id === 'original' ? (
                <span className="material-symbols-outlined text-base">
                  {selectedDialect === 'original' ? 'check_circle' : 'person'}
                </span>
              ) : (
                <span className="text-sm font-medium font-sans">{dialect.name}</span>
              )}
              <span className="text-xs font-sans">{dialect.region}</span>
              {dialect.id === 'original' && selectedDialect === 'original' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">推荐</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Beat Selection - 紧凑列表 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-white/40 text-lg">graphic_eq</span>
          <h3 className="text-white font-semibold text-sm font-sans">精选伴奏</h3>
          <span className="text-white/30 text-xs">（已自动选择）</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FALLBACK_BEATS.map((beat) => (
            <button
              key={beat.id}
              onClick={() => setBeat(beat.id)}
              className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                selectedBeat === beat.id
                  ? 'bg-white/[0.06] border border-white/[0.15]'
                  : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  playingBeat === beat.id
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/[0.05] text-white/50 group-hover:bg-white/[0.08]'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayBeat(beat)
                }}
              >
                <span className="material-symbols-outlined text-sm">
                  {playingBeat === beat.id ? 'pause' : 'play_arrow'}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-white/80 font-medium text-sm font-sans truncate">{beat.name}</h4>
                <span className="text-white/35 text-xs">{beat.bpm} BPM · {beat.duration}</span>
              </div>
              {selectedBeat === beat.id && (
                <span className="material-symbols-outlined text-emerald-400 text-sm flex-shrink-0">check</span>
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
