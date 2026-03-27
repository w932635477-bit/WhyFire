'use client'

import { useState, useRef, useEffect } from 'react'
import { useCreateContext } from './create-context'
import { generateMusic, ApiError } from '@/lib/services/create-api'

interface Step4PreviewProps {
  onPrev: () => void
}

export function Step4Preview({ onPrev }: Step4PreviewProps) {
  const { state, setPreviewParams, setPlaying, setLyrics } = useCreateContext()
  const [isEditingLyrics, setIsEditingLyrics] = useState(false)
  const [editedLyrics, setEditedLyrics] = useState(state.lyrics.generatedLyrics)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateProgress, setGenerateProgress] = useState(0)
  const [generateStep, setGenerateStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [wordTimestamps, setWordTimestamps] = useState<Array<{
    text: string
    beginTime: number
    endTime: number
  }> | null>(null)
  const [rapInfo, setRapInfo] = useState<{
    duration?: number
  } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 从 context 获取状态
  const { speed, pitch, isPlaying } = state.preview
  const lyrics = state.lyrics.generatedLyrics
  const selectedDialect = state.dialect.dialects.find(d => d.id === state.dialect.selected)
  const selectedBeat = state.beat.selected
  const referenceAudioId = state.voiceCloning.referenceAudioId  // Seed-VC 零样本克隆使用参考音频 ID

  // 获取当前高亮的歌词行
  const getCurrentLyricLine = () => {
    if (!wordTimestamps || currentTime === 0) return { current: '', next: '' }

    const currentWord = wordTimestamps.find(
      (w) => currentTime >= w.beginTime / 1000 && currentTime <= w.endTime / 1000
    )

    if (!currentWord) {
      // 找下一个即将播放的词
      const nextWord = wordTimestamps.find((w) => w.beginTime / 1000 > currentTime)
      return {
        current: '',
        next: nextWord?.text || ''
      }
    }

    // 找当前词之后的词
    const currentIndex = wordTimestamps.indexOf(currentWord)
    const nextWords = wordTimestamps
      .slice(currentIndex + 1, currentIndex + 6)
      .map(w => w.text)
      .join('')

    return {
      current: currentWord.text,
      next: nextWords
    }
  }

  const { current: currentLyric, next: nextLyric } = getCurrentLyricLine()

  const handleSpeedChange = (newSpeed: number) => {
    setPreviewParams({ speed: newSpeed })
  }

  const handlePitchChange = (newPitch: number) => {
    setPreviewParams({ pitch: newPitch })
  }

  const handlePlayPause = () => {
    if (!audioRef.current && !audioUrl) {
      // 如果还没有生成音频，先生成
      handleGenerateMusic()
      return
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setPlaying(!isPlaying)
    }
  }

  const handleSaveLyrics = () => {
    setLyrics(editedLyrics)
    setIsEditingLyrics(false)
  }

  const handleReset = () => {
    setPreviewParams({ speed: 1.0, pitch: 0 })
  }

  // 生成音乐 (D-Lite 方案)
  const handleGenerateMusic = async () => {
    if (!lyrics) {
      setError('请先生成歌词')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerateProgress(0)
    setGenerateStep('初始化...')

    try {
      const result = await generateMusic({
        lyrics,
        dialect: state.dialect.selected,
        style: 'rap',
        bgmId: selectedBeat || undefined,  // 传递选中的 BGM ID
        referenceAudioId: referenceAudioId || undefined,
      })

      setGenerateProgress(100)
      setGenerateStep('生成完成!')

      if (result.audioUrl) {
        setAudioUrl(result.audioUrl)

        // 保存 Rap 信息
        setRapInfo({
          duration: result.duration,
        })

        // 保存时间戳数据（如果有）
        if (result.wordTimestamps) {
          setWordTimestamps(result.wordTimestamps)
        }

        // 创建音频元素
        const audio = new Audio(result.audioUrl)
        audioRef.current = audio

        audio.addEventListener('ended', () => {
          setPlaying(false)
          setCurrentTime(0)
        })

        audio.addEventListener('error', () => {
          setError('音频加载失败')
        })

        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime)
        })
      }
    } catch (err) {
      console.error('音乐生成失败:', err)
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('音乐生成失败，请稍后重试')
      }
      setGenerateStep('')
    } finally {
      setIsGenerating(false)
    }
  }

  // 清理音频
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // 进度时间线数据
  const progressSteps = [
    { label: '歌词生成', status: 'done' as const, time: '0.8秒' },
    { label: '节奏对齐', status: isGenerating ? 'processing' as const : (audioUrl ? 'done' as const : 'pending' as const), time: isGenerating ? `${generateProgress}%` : '1.2秒' },
    { label: '最终混音', status: audioUrl ? 'done' as const : 'pending' as const, time: audioUrl ? '2.4秒' : '-' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 max-w-5xl mx-auto">
      {/* Left Column */}
      <div className="lg:col-span-4 space-y-6 lg:space-y-8 order-2 lg:order-1">
        {/* Header */}
        <div>
          <span className="text-emerald-400 text-sm font-medium tracking-wider uppercase mb-3 block">
            步骤四
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            预览你的杰作
          </h1>
          <p className="text-white/40 text-sm leading-relaxed font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            你的 AI 方言说唱作品已准备就绪。试听确认后，保存到你的音乐库。
          </p>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-4">
          {progressSteps.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.status === 'done'
                  ? 'bg-emerald-500/20'
                  : item.status === 'processing'
                  ? 'bg-violet-500/20'
                  : 'bg-white/[0.05]'
              }`}>
                {item.status === 'done' ? (
                  <span className="material-symbols-outlined text-emerald-400 text-base">
                    check
                  </span>
                ) : item.status === 'processing' ? (
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                ) : (
                  <span className="text-white/30 text-xs">{i + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
                    item.status === 'pending' ? 'text-white/40' : 'text-white'
                  }`}>
                    {item.label}
                  </span>
                  <span className={`text-xs ${
                    item.status === 'processing' ? 'text-violet-400' : 'text-white/40'
                  }`}>
                    {item.time}
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
              onClick={handleReset}
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
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
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
              onChange={(e) => handlePitchChange(parseInt(e.target.value))}
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
          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-400 text-lg">error</span>
              <div className="flex-1">
                <p className="text-red-400 text-sm font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  {error}
                </p>
                <button
                  onClick={handleGenerateMusic}
                  className="text-red-400/70 text-xs mt-2 hover:text-red-400 transition-colors font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
                >
                  点击重试
                </button>
              </div>
            </div>
          )}

          {/* Generate Button (if no audio yet) */}
          {!audioUrl && !isGenerating && (
            <button
              onClick={handleGenerateMusic}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-emerald-500 text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all btn-press min-h-[48px] font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              生成音乐
            </button>
          )}

          {/* Generating State */}
          {isGenerating && (
            <div className="w-full p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-violet-400 text-lg animate-spin">progress_activity</span>
                <span className="text-violet-400 font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  正在生成音乐...
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.1] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${generateProgress}%` }}
                />
              </div>
              <p className="text-white/40 text-xs mt-2 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                预计需要 30-60 秒，请耐心等待
              </p>
            </div>
          )}

          {/* Primary Actions (after generation) */}
          {audioUrl && !isGenerating && (
            <>
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-emerald-500 text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all btn-press min-h-[48px] font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                <span className="material-symbols-outlined text-lg">download</span>
                导出音频
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.03] border border-white/[0.06] transition-all btn-press min-h-[48px] font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  <span className="material-symbols-outlined text-base">share</span>
                  分享
                </button>
                <button className="flex items-center justify-center gap-2 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.03] border border-white/[0.06] transition-all btn-press min-h-[48px] font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  <span className="material-symbols-outlined text-base">save</span>
                  保存
                </button>
              </div>

              {/* Regenerate Button */}
              <button
                onClick={handleGenerateMusic}
                className="w-full py-2 text-white/40 hover:text-white/60 text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px] font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                重新生成
              </button>
            </>
          )}

          <button
            onClick={onPrev}
            className="w-full py-3 text-white/30 hover:text-white/60 text-sm transition-colors font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
          >
            返回修改
          </button>

          {/* 免费重试政策说明 */}
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-sm">info</span>
              <span className="text-emerald-400/80 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                💡 中间步骤可以无限次修改，只有最终导出才计入使用次数
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Player Card */}
      <div className="lg:col-span-8 order-1 lg:order-2">
        <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] bg-gradient-to-br from-violet-900/30 to-emerald-900/30">
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
          <div className="relative h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-emerald-400 text-xs font-medium tracking-wider uppercase">
                  正在预览
                </span>
                <h2 className="text-white text-xl sm:text-2xl font-bold mt-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  成都漂移
                </h2>
                <p className="text-white/40 text-sm mt-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  {selectedDialect?.name || '方言'}版
                </p>
              </div>
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all min-w-[44px] min-h-[44px]">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>

            {/* Waveform / Loading State / Error */}
            <div className="flex items-end justify-between h-24 gap-0.5 relative">
              {isGenerating ? (
                // Loading shimmer effect
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-violet-400 text-lg animate-spin">progress_activity</span>
                    <span className="text-violet-400 text-sm font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    正在生成音乐... {generateProgress}%
                  </span>
                  </div>
                </div>
              ) : error ? (
                // Error state
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                    <span className="text-red-400 text-sm font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                      生成失败
                    </span>
                  </div>
                </div>
              ) : audioUrl ? (
                // Real waveform bars (animated when playing)
                [...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-all duration-150 ${
                      isPlaying
                        ? 'bg-gradient-to-t from-violet-500 to-emerald-500'
                        : 'bg-white/20'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.random() * 80 + 20}%` : `${20 + Math.random() * 30}%`,
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                ))
              ) : (
                // Idle state - click to generate
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-white/20 text-3xl mb-2">music_note</span>
                    <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                      点击播放按钮生成音乐
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lyrics Display - 同步高亮 */}
            <div className="space-y-1 sm:space-y-2 text-center mb-2 sm:mb-4 px-2">
              {wordTimestamps ? (
                <>
                  <p className="text-white/30 text-sm sm:text-base italic font-['PingFang_SC','Noto_Sans_SC',sans-serif] truncate">
                    {nextLyric || '...'}
                  </p>
                  <p className="text-white text-lg sm:text-xl font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif] truncate animate-pulse">
                    {currentLyric || (isPlaying ? '...' : '点击播放')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white/30 text-sm sm:text-base italic font-['PingFang_SC','Noto_Sans_SC',sans-serif] truncate">
                    {lyrics.split('\n')[0]?.slice(0, 15) || '歌词预览...'}
                  </p>
                  <p className="text-white text-lg sm:text-xl font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif] truncate">
                    {lyrics.split('\n')[1]?.slice(0, 20) || '生成音乐后可同步显示'}
                  </p>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              <button className="text-white/40 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">skip_previous</span>
              </button>
              <button
                onClick={handlePlayPause}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20 min-w-[44px] min-h-[44px]"
              >
                <span className="material-symbols-outlined text-2xl sm:text-3xl">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button className="text-white/40 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
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
            <div className="space-y-3">
              <textarea
                value={editedLyrics}
                onChange={(e) => setEditedLyrics(e.target.value)}
                className="w-full h-48 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-white/80 text-sm resize-none focus:outline-none focus:border-violet-500/30 font-['PingFang_SC','Noto_Sans_SC',sans-serif] leading-relaxed"
                placeholder="在此编辑歌词..."
              />
              <button
                onClick={handleSaveLyrics}
                className="w-full py-2 bg-violet-500/20 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/30 transition-colors font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
              >
                保存修改
              </button>
            </div>
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
