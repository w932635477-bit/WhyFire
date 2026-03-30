'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useCoverContext, COVER_DIALECTS } from './cover-context'
import { fetchTimestampedLyrics } from '@/lib/services/create-api'
import { convertAlignedWordsToLyricLines } from '@/lib/subtitle/suno-lyrics-converter'

function genBars(seed: string, n: number): number[] {
  const b: number[] = []
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  for (let i = 0; i < n; i++) { h = ((h << 5) - h + i * 31) | 0; b.push(Math.max(20, Math.min(100, Math.abs(h % 100)))) }
  return b
}

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

const N = 60
const BARS = genBars('whyfire-cover-v5', N)

/** 等待时的趣味提示 */
const FUN_TIPS = [
  '四川话翻唱最受欢迎 🌶️',
  '粤语翻唱最容易上热门',
  '东北话翻唱自带喜剧效果',
  '一首好的方言翻唱，能传播到全国',
  '翻唱比原创更容易被搜索到',
  '方言是文化传承的活化石',
  '热门歌 + 方言 = 传播密码',
]

export function Step3Preview({ onPrev }: { onPrev: () => void }) {
  const { state, dispatch } = useCoverContext()
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const tipRef = useRef<NodeJS.Timeout | null>(null)
  const [tipIndex, setTipIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef<number>(0)

  // Original song player state (for generating wait screen)
  const origAudioRef = useRef<HTMLAudioElement>(null)
  const [origPlaying, setOrigPlaying] = useState(false)
  const [origTime, setOrigTime] = useState(0)
  const [origDur, setOrigDur] = useState(0)
  const [origMuted, setOrigMuted] = useState(false)

  const dialectName = COVER_DIALECTS.find(d => d.id === state.dialect.selected)?.name || '方言'

  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) } else { a.play(); setPlaying(true) }
  }, [playing])

  const doSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || !dur) return
    const r = e.currentTarget.getBoundingClientRect()
    a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur
  }, [dur])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const tu = () => setTime(a.currentTime)
    const lm = () => setDur(a.duration)
    const en = () => setPlaying(false)
    a.addEventListener('timeupdate', tu)
    a.addEventListener('loadedmetadata', lm)
    a.addEventListener('ended', en)
    return () => { a.removeEventListener('timeupdate', tu); a.removeEventListener('loadedmetadata', lm); a.removeEventListener('ended', en) }
  }, [state.result.audioUrl])

  // 轮询翻唱任务状态
  const pollCoverStatus = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/cover/generate?taskId=${taskId}`)
      const d = await res.json()

      if (d.code !== 0 || !d.data) {
        dispatch({ type: 'SET_RESULT', result: { status: 'failed', error: d.message || '查询失败', progress: 0 } })
        return
      }

      const { status, step, stepName, progress, message, audioUrl, audioId, sunoTaskId, duration, lyrics, dialect } = d.data

      if (status === 'completed') {
        dispatch({
          type: 'SET_RESULT',
          result: { status: 'completed', taskId, audioId, audioUrl, sunoTaskId, duration, lyrics, progress: 100, progressMessage: '完成' },
        })
        return
      }

      if (status === 'failed') {
        dispatch({ type: 'SET_RESULT', result: { status: 'failed', error: d.data.error || '翻唱生成失败', progress: 0 } })
        return
      }

      // 更新进度
      dispatch({
        type: 'SET_RESULT',
        result: { progress: progress || 0, progressMessage: stepName || message || '处理中...' },
      })

      // 继续轮询
      pollRef.current = setTimeout(() => pollCoverStatus(taskId), 3000)
    } catch {
      dispatch({ type: 'SET_RESULT', result: { status: 'failed', error: '网络错误，请重试', progress: 0 } })
    }
  }, [dispatch])

  // 轮询 MV 任务状态
  const pollMVStatus = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/cover/music-video?taskId=${taskId}`)
      const d = await res.json()

      if (d.code !== 0 || !d.data) {
        dispatch({ type: 'SET_MV_RESULT', result: { mvStatus: 'failed', mvProgress: 0 } })
        return
      }

      const { status, videoUrl } = d.data

      if (status === 'completed') {
        dispatch({ type: 'SET_MV_RESULT', result: { mvStatus: 'completed', mvVideoUrl: videoUrl, mvTaskId: taskId, mvProgress: 100 } })
        return
      }

      if (status === 'failed') {
        dispatch({ type: 'SET_MV_RESULT', result: { mvStatus: 'failed', mvProgress: 0 } })
        return
      }

      // 继续轮询
      pollRef.current = setTimeout(() => pollMVStatus(taskId), 3000)
    } catch {
      dispatch({ type: 'SET_MV_RESULT', result: { mvStatus: 'failed', mvProgress: 0 } })
    }
  }, [dispatch])

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
      if (tipRef.current) clearTimeout(tipRef.current)
    }
  }, [])

  // 趣味提示轮换
  useEffect(() => {
    if (state.result.status !== 'generating') return
    tipRef.current = setTimeout(() => {
      setTipIndex(i => (i + 1) % FUN_TIPS.length)
    }, 5000)
    return () => { if (tipRef.current) clearTimeout(tipRef.current) }
  }, [state.result.status, tipIndex])

  // Auto-play original song when entering generating state
  useEffect(() => {
    if (state.result.status !== 'generating' || !state.song.url) return
    const a = origAudioRef.current
    if (!a) return

    const tu = () => setOrigTime(a.currentTime)
    const lm = () => {
      setOrigDur(a.duration)
      // Attempt auto-play once metadata is loaded
      a.play().then(() => setOrigPlaying(true)).catch(() => {
        // Browser blocked autoplay, user needs to click play
        setOrigPlaying(false)
      })
    }
    const en = () => setOrigPlaying(false)

    a.addEventListener('timeupdate', tu)
    a.addEventListener('loadedmetadata', lm)
    a.addEventListener('ended', en)

    // If already loaded, try auto-play immediately
    if (a.readyState >= 1 && a.duration) {
      a.play().then(() => setOrigPlaying(true)).catch(() => setOrigPlaying(false))
    }

    return () => {
      a.removeEventListener('timeupdate', tu)
      a.removeEventListener('loadedmetadata', lm)
      a.removeEventListener('ended', en)
      a.pause()
      setOrigPlaying(false)
    }
  }, [state.result.status, state.song.url])

  // Sync mute state to audio element
  useEffect(() => {
    const a = origAudioRef.current
    if (a) a.muted = origMuted
  }, [origMuted])

  // 计时器：显示已等待时间
  useEffect(() => {
    if (state.result.status !== 'generating') {
      setElapsed(0)
      return
    }
    startTimeRef.current = Date.now()
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [state.result.status])

  const doGenerate = async () => {
    startTimeRef.current = Date.now()
    setElapsed(0)
    dispatch({ type: 'SET_RESULT', result: { status: 'generating', progress: 0, progressMessage: '提交翻唱任务...' } })
    try {
      const res = await fetch('/api/cover/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `cover-${Date.now()}`, songUrl: state.song.url, dialect: state.dialect.selected,
          customLyrics: state.lyrics.mode === 'custom' ? state.lyrics.customLyrics : state.lyrics.mode === 'ai-generate' ? state.lyrics.generatedLyrics : undefined,
          brandMessage: state.lyrics.mode === 'ai-generate' ? state.lyrics.brandMessage : undefined,
          vocalGender: state.vocalGender,
        }),
      })
      const d = await res.json()
      if (d.code === 0 && d.data?.taskId) {
        dispatch({ type: 'SET_RESULT', result: { taskId: d.data.taskId, progress: 5, progressMessage: '任务已提交' } })
        // 开始轮询
        pollCoverStatus(d.data.taskId)
      } else {
        dispatch({ type: 'SET_RESULT', result: { status: 'failed', error: d.message || '翻唱生成失败', progress: 0 } })
      }
    } catch {
      dispatch({ type: 'SET_RESULT', result: { status: 'failed', error: '生成失败，请重试', progress: 0 } })
    }
  }

  const doMV = async () => {
    if (!state.result.sunoTaskId || !state.result.audioId) return
    dispatch({ type: 'SET_MV_RESULT', result: { mvStatus: 'generating', mvProgress: 0 } })
    try {
      const res = await fetch('/api/cover/music-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: state.result.sunoTaskId, audioId: state.result.audioId, domainName: 'whyfire.com' }),
      })
      const d = await res.json()
      if (d.code === 0 && d.data?.taskId) {
        dispatch({ type: 'SET_MV_RESULT', result: { mvStatus: 'generating', mvTaskId: d.data.taskId, mvProgress: 10 } })
        // 开始轮询 MV
        pollMVStatus(d.data.taskId)
      } else {
        dispatch({ type: 'SET_MV_RESULT', result: { mvStatus: 'failed', mvProgress: 0 } })
      }
    } catch {
      dispatch({ type: 'SET_MV_RESULT', result: { mvStatus: 'failed', mvProgress: 0 } })
    }
  }

  const doShare = async () => {
    const url = state.result.ktvVideoUrl || state.result.mvVideoUrl || state.result.audioUrl
    if (!url) return
    if (navigator.share) { try { await navigator.share({ title: `${dialectName}翻唱`, url }) } catch {} }
    else { await navigator.clipboard.writeText(url) }
  }

  const doDownload = () => {
    const url = state.result.ktvVideoUrl || state.result.mvVideoUrl || state.result.audioUrl
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    const isKtv = url === state.result.ktvVideoUrl
    const ext = isKtv || state.result.mvVideoUrl ? 'mp4' : 'mp3'
    a.download = `方言翻唱-${dialectName}-${Date.now()}.${ext}`
    a.click()
  }

  const doKTV = async () => {
    if (!state.result.sunoTaskId || !state.result.audioId) return
    if (!state.result.mvVideoUrl && !state.result.audioUrl) return

    dispatch({ type: 'SET_KTV', payload: { ktvStatus: 'fetching-lyrics', ktvProgress: 5, ktvMessage: '获取歌词时间戳...' } })

    try {
      // Step 1: 获取时间戳歌词
      const tsResult = await fetchTimestampedLyrics({
        taskId: state.result.sunoTaskId,
        audioId: state.result.audioId,
      })

      if (!tsResult.alignedWords || tsResult.alignedWords.length === 0) {
        dispatch({ type: 'SET_KTV', payload: { ktvStatus: 'failed', ktvProgress: 0, ktvMessage: '未获取到歌词时间戳' } })
        return
      }

      dispatch({ type: 'SET_KTV', payload: { ktvStatus: 'generating', ktvProgress: 15, ktvMessage: '转换歌词格式...' } })

      // Step 2: 转换为 LyricLineWithWords
      const lyricLines = convertAlignedWordsToLyricLines(tsResult.alignedWords)

      if (lyricLines.length === 0) {
        dispatch({ type: 'SET_KTV', payload: { ktvStatus: 'failed', ktvProgress: 0, ktvMessage: '歌词转换失败' } })
        return
      }

      // Step 3: 下载视频源
      dispatch({ type: 'SET_KTV', payload: { ktvProgress: 20, ktvMessage: '下载视频...' } })

      const videoSourceUrl = state.result.mvVideoUrl || state.result.audioUrl!
      const videoResponse = await fetch(videoSourceUrl)
      const videoBlob = await videoResponse.blob()

      dispatch({ type: 'SET_KTV', payload: { ktvProgress: 30, ktvMessage: '加载 FFmpeg...' } })

      // Step 4: 使用 VideoSynthesizer 合成 KTV 视频
      const { createVideoSynthesizer } = await import('@/lib/ffmpeg/video-synthesizer')
      const synthesizer = createVideoSynthesizer()
      const result = await synthesizer.synthesize({
        videoFile: videoBlob,
        audioFile: state.result.audioUrl!,
        lyrics: lyricLines,
        effectsConfig: { subtitleEffect: 'karaoke-plus' },
        disableAudioMix: !!state.result.mvVideoUrl,
        outputFilename: `ktv-${dialectName}-${Date.now()}.mp4`,
        onProgress: (p) => {
          const pct = Math.round(30 + p.overallProgress * 65)
          const stageMsg = p.stage === 'loading-ffmpeg' ? '加载 FFmpeg...'
            : p.stage === 'writing-video' ? '写入视频...'
            : p.stage === 'generating-subtitles' ? '生成字幕...'
            : p.stage === 'synthesizing' ? '渲染 KTV 歌词...'
            : p.stage === 'reading-output' ? '导出视频...'
            : p.message
          dispatch({ type: 'SET_KTV', payload: { ktvProgress: pct, ktvMessage: stageMsg } })
        },
      })

      dispatch({ type: 'SET_KTV', payload: { ktvStatus: 'completed', ktvProgress: 100, ktvVideoUrl: result.url, ktvMessage: '完成' } })
    } catch (err) {
      console.error('[KTV] 生成失败:', err)
      dispatch({
        type: 'SET_KTV',
        payload: { ktvStatus: 'failed', ktvProgress: 0, ktvMessage: err instanceof Error ? err.message : 'KTV 生成失败' },
      })
    }
  }

  const lyricsLabel = state.lyrics.mode === 'original'
    ? '保留原歌词'
    : state.lyrics.mode === 'custom'
    ? `自定义（${state.lyrics.customLyrics.length} 字）`
    : `AI 创作（${state.lyrics.generatedLyrics.length} 字）`

  const pct = dur > 0 ? time / dur : 0

  // ===== Generating =====
  if (state.result.status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8">
        {/* 旋转音符 + 环境光晕 */}
        <div className="relative w-28 h-28">
          <div className="absolute -z-10 w-[200px] h-[200px] bg-[#8B5CF6]/5 blur-[60px] rounded-full" />
          <div className="absolute inset-0 rounded-full" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
        </div>

        {/* 状态文案 */}
        <div className="text-center space-y-2">
          <p className="text-white text-[20px] font-semibold tracking-tight font-sans">正在生成{dialectName}翻唱</p>
          <p className="text-white/50 text-[14px] font-sans transition-all duration-500">{state.result.progressMessage || 'AI 正在用方言重新演绎...'}</p>
        </div>

        {/* 真实进度条 */}
        <div className="w-56 space-y-2">
          <div className="h-[3px] bg-[#353535] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.max(5, state.result.progress)}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #10b981)',
              }}
            />
          </div>
          <p className="text-white/30 text-[11px] font-sans text-right tabular-nums">
            {Math.round(state.result.progress)}%{elapsed > 0 && ` · ${elapsed}秒`}
          </p>
        </div>

        {/* 趣味提示 */}
        <div className="h-5 flex items-center">
          <p className="text-white/30 text-[12px] font-sans animate-fade-in" key={tipIndex}>
            {FUN_TIPS[tipIndex]}
          </p>
        </div>

        {/* 原曲播放器 - 等待时聆听 */}
        {state.song.url && (
          <div className="w-72 mt-2 p-4 rounded-2xl bg-[#1C1C1E] space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const a = origAudioRef.current
                  if (!a) return
                  if (origPlaying) { a.pause(); setOrigPlaying(false) }
                  else { a.play().then(() => setOrigPlaying(true)).catch(() => setOrigPlaying(false)) }
                }}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 hover:bg-white/15 active:scale-95 transition-all"
              >
                {origPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" className="ml-0.5"><polygon points="8 5 20 12 8 19"/></svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white/50 text-[12px] font-semibold font-sans truncate">听听原曲</p>
                <p className="text-white/25 text-[10px] font-sans">等待时解解闷</p>
              </div>
              <button
                onClick={() => setOrigMuted(m => !m)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                {origMuted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white/30" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white/50" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
              </button>
            </div>

            {/* Progress bar */}
            <div
              className="h-[2px] bg-[#353535] rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const a = origAudioRef.current
                if (!a || !origDur) return
                const r = e.currentTarget.getBoundingClientRect()
                a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * origDur
              }}
            >
              <div
                className="h-full rounded-full bg-white/40 transition-all duration-300"
                style={{ width: `${origDur > 0 ? (origTime / origDur) * 100 : 0}%` }}
              />
            </div>

            <div className="flex justify-between">
              <span className="text-white/20 text-[9px] font-sans tabular-nums">{fmt(origTime)}</span>
              <span className="text-white/20 text-[9px] font-sans tabular-nums">{fmt(origDur)}</span>
            </div>

            <audio ref={origAudioRef} src={state.song.url} preload="auto" loop={false} />
          </div>
        )}
      </div>
    )
  }

  // ===== Completed =====
  if (state.result.status === 'completed') {
    return (
      <div className="space-y-6">
        {/* Success */}
        <div className="flex items-center gap-4 p-6 rounded-2xl bg-[#10b981]/5">
          <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <p className="text-white text-[16px] font-semibold tracking-tight font-sans">{dialectName}翻唱完成</p>
            <p className="text-white/40 text-[12px] font-sans mt-0.5">{state.result.duration ? `${Math.round(state.result.duration)} 秒` : ''}  · 方言回响</p>
          </div>
        </div>

        {/* Player */}
        {state.result.audioUrl && (
          <div className="p-6 rounded-2xl bg-[#1C1C1E]">
            <div className="flex items-center gap-5 mb-6">
              <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform">
                {playing ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="black"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="black" className="ml-0.5"><polygon points="8 5 20 12 8 19"/></svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[16px] font-semibold tracking-tight font-sans truncate">{dialectName}翻唱</p>
                <p className="text-white/30 text-[12px] font-sans mt-0.5">方言回响</p>
              </div>
            </div>

            {/* Waveform */}
            <div className="flex items-center gap-[1px] h-12 mb-3 cursor-pointer" onClick={doSeek}>
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[1.5px] rounded-full transition-all duration-300"
                  style={{ height: `${h}%`, background: i / N <= pct ? 'white' : '#353535' }}
                />
              ))}
            </div>

            <div className="flex justify-between">
              <span className="text-white/30 text-[10px] font-sans tabular-nums">{fmt(time)}</span>
              <span className="text-white/30 text-[10px] font-sans tabular-nums">{fmt(dur || state.result.duration || 0)}</span>
            </div>

            <audio ref={audioRef} src={state.result.audioUrl} preload="metadata" />
          </div>
        )}

        {/* 歌词展示 */}
        {state.result.lyrics && (
          <div className="p-6 rounded-2xl bg-[#1C1C1E]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/50 text-[14px] font-semibold font-sans">歌词</p>
              <span className="text-white/30 text-[10px] font-sans">{state.result.lyrics.length} 字</span>
            </div>
            <div className="text-white/30 text-[13px] leading-[1.8] font-sans whitespace-pre-wrap max-h-[240px] overflow-y-auto">
              {state.result.lyrics}
            </div>
          </div>
        )}

        {/* MV */}
        <div className="p-6 rounded-2xl bg-[#1C1C1E]">
          <div className="flex items-center justify-between mb-5">
            <p className="text-white/50 text-[14px] font-semibold font-sans">MV 视频</p>
            <span className="text-white/30 text-[10px] font-sans">可直接发抖音</span>
          </div>

          {state.result.mvStatus === 'idle' && (
            <button onClick={doMV} className="w-full py-4 rounded-2xl bg-[#2a2a2a] text-white/60 text-[13px] font-semibold font-sans hover:bg-[#353535] transition-colors active:scale-96 flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              生成音乐视频
            </button>
          )}

          {state.result.mvStatus === 'generating' && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-center gap-3 py-3">
                <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
                <span className="text-white/50 text-[13px] font-sans">MV 生成中...</span>
              </div>
              <div className="h-[2px] bg-[#353535] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(10, state.result.mvProgress || 30)}%`,
                    background: 'linear-gradient(90deg, #8b5cf6, #10b981)',
                  }}
                />
              </div>
              <p className="text-white/30 text-[11px] font-sans text-center">预计 1-3 分钟</p>
            </div>
          )}

          {state.result.mvStatus === 'completed' && state.result.mvVideoUrl && (
            <video src={state.result.mvVideoUrl} controls className="w-full rounded-2xl" style={{ maxHeight: '360px' }} />
          )}

          {state.result.mvStatus === 'failed' && (
            <div className="text-center py-4 space-y-2">
              <p className="text-white/30 text-[12px] font-sans">MV 生成失败</p>
              <button onClick={doMV} className="text-white/30 text-[12px] hover:text-white/50 font-sans">重试</button>
            </div>
          )}
        </div>

        {/* KTV 歌词视频 — 仅在有歌词文本时显示（翻唱保留原词模式无逐词数据） */}
        {((state.result.mvStatus === 'completed' && state.result.lyrics) || state.result.ktvStatus !== 'idle') && (
          <div className="p-6 rounded-2xl bg-[#1C1C1E]">
            <div className="flex items-center justify-between mb-5">
              <p className="text-white/50 text-[14px] font-semibold font-sans">KTV 歌词视频</p>
              <span className="text-white/30 text-[10px] font-sans">逐字高亮</span>
            </div>

            {state.result.ktvStatus === 'idle' && (
              <button onClick={doKTV} className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600/10 to-emerald-600/10 text-white/70 text-[13px] font-semibold font-sans hover:from-purple-600/15 hover:to-emerald-600/15 transition-colors active:scale-96 flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                生成 KTV 歌词视频
              </button>
            )}

            {(state.result.ktvStatus === 'fetching-lyrics' || state.result.ktvStatus === 'generating') && (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-center gap-3 py-3">
                  <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-purple-400 animate-spin" />
                  <span className="text-white/50 text-[13px] font-sans">{state.result.ktvMessage || '处理中...'}</span>
                </div>
                <div className="h-[2px] bg-[#353535] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(10, state.result.ktvProgress || 15)}%`,
                      background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
                    }}
                  />
                </div>
                <p className="text-white/30 text-[11px] font-sans text-center">FFmpeg 客户端渲染，无需服务器</p>
              </div>
            )}

            {state.result.ktvStatus === 'completed' && state.result.ktvVideoUrl && (
              <div className="space-y-4">
                <video src={state.result.ktvVideoUrl} controls className="w-full rounded-2xl" style={{ maxHeight: '360px' }} />
                <button onClick={() => {
                  const a = document.createElement('a')
                  a.href = state.result.ktvVideoUrl!
                  a.download = `KTV-${dialectName}-${Date.now()}.mp4`
                  a.click()
                }} className="w-full py-3 rounded-xl bg-purple-600/20 text-purple-300 text-[12px] font-semibold font-sans hover:bg-purple-600/30 transition-colors flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  下载 KTV 视频
                </button>
              </div>
            )}

            {state.result.ktvStatus === 'failed' && (
              <div className="text-center py-4 space-y-2">
                <p className="text-white/30 text-[12px] font-sans">{state.result.ktvMessage || 'KTV 生成失败'}</p>
                <button onClick={doKTV} className="text-white/30 text-[12px] hover:text-white/50 font-sans">重试</button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={doDownload} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white font-bold text-[14px] font-sans shadow-[0_8px_32px_rgba(139,92,246,0.3)] active:scale-96 transition-all flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            下载
          </button>
          <button onClick={doShare} className="flex-1 py-4 rounded-2xl bg-[#2a2a2a] text-white/60 font-semibold text-[14px] font-sans hover:bg-[#353535] transition-all flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            分享
          </button>
        </div>
      </div>
    )
  }

  // ===== Failed =====
  if (state.result.status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/5 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div className="text-center space-y-2">
          <p className="text-white text-[20px] font-semibold tracking-tight font-sans">翻唱生成失败</p>
          <p className="text-white/40 text-[13px] font-sans">{state.result.error}</p>
        </div>
        <button onClick={doGenerate} className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white font-bold text-[13px] font-sans shadow-[0_8px_32px_rgba(139,92,246,0.3)] active:scale-96 transition-all">重试</button>
      </div>
    )
  }

  // ===== Initial =====
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[32px] font-bold tracking-tight font-sans">确认生成</h2>
        <p className="text-white/40 text-[14px] font-sans mt-2">检查设置，开始 AI 方言翻唱</p>
      </div>

      <div className="p-7 rounded-2xl bg-[#1C1C1E] space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-sans mb-2">方言</p>
            <p className="text-white text-[18px] font-semibold font-sans">{dialectName}</p>
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-sans mb-2">人声</p>
            <p className="text-white text-[18px] font-semibold font-sans">{state.vocalGender === 'm' ? '男声' : '女声'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-sans mb-2">歌词</p>
            <p className="text-white/50 text-[13px] font-sans">{lyricsLabel}</p>
          </div>
        </div>
      </div>

      <button onClick={doGenerate} className="w-full py-[18px] rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white font-bold text-[15px] font-sans shadow-[0_8px_32px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2.5 active:scale-96 transition-all">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        开始翻唱
      </button>

      <p className="text-center text-white/30 text-[11px] font-sans">预计 1-2 分钟 · 翻唱完成后可生成 MV</p>
    </div>
  )
}
