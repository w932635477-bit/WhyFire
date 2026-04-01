'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useCoverContext } from './cover-context'
import { extractAudioFromVideo, isVideoFile } from '@/lib/audio/audio-extractor'
// 注意：不要从 @/lib/audio/index.ts 导入，会拉入 Node.js 模块 (child_process) 导致客户端构建失败

const MAX_UPLOAD_DURATION = 480 // SunoAPI 最多支持 8 分钟

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function Step1Upload({ onNext }: { onNext: () => void }) {
  const { state, dispatch } = useCoverContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [pasteUrl, setPasteUrl] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  // AbortController：取消进行中的请求（防止竞态条件）
  const abortRef = useRef<AbortController | null>(null)
  // Object URL 清理追踪
  const objectUrlRef = useRef<string | null>(null)

  // 判断是否为视频文件
  const isVideo = useMemo(() => {
    const name = state.song.fileName?.toLowerCase() || ''
    return name.match(/\.(mp4|mov|avi|mkv|flv|wmv|webm)$/) != null
  }, [state.song.fileName])

  // 当前播放用 ref
  const mediaRef = isVideo ? videoRef : audioRef

  // 构建预览音频 URL：文件用 blob URL，OSS 走 audio-proxy，外链直连
  const previewUrl = useMemo(() => {
    if (state.song.file && state.song.uploadStatus === 'completed') {
      return URL.createObjectURL(state.song.file)
    }
    if (state.song.url?.includes('.aliyuncs.com/')) {
      return `/api/audio-proxy?path=${encodeURIComponent(state.song.url.split('.aliyuncs.com/')[1])}`
    }
    return state.song.url
  }, [state.song.file, state.song.uploadStatus, state.song.url])

  // 释放 blob URL 避免内存泄漏
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const togglePlay = useCallback(() => {
    const m = mediaRef.current
    if (!m) return
    if (playing) { m.pause(); setPlaying(false) } else { m.play().catch(() => {}); setPlaying(true) }
  }, [playing, mediaRef])

  useEffect(() => {
    const m = mediaRef.current
    if (!m) return
    const tu = () => setTime(m.currentTime)
    const lm = () => setDur(m.duration)
    const en = () => setPlaying(false)
    m.addEventListener('timeupdate', tu)
    m.addEventListener('loadedmetadata', lm)
    m.addEventListener('ended', en)
    return () => { m.removeEventListener('timeupdate', tu); m.removeEventListener('loadedmetadata', lm); m.removeEventListener('ended', en) }
  }, [previewUrl, mediaRef])

  // 切换文件时重置播放状态
  useEffect(() => {
    setPlaying(false); setTime(0); setDur(0)
  }, [state.song.url])

  // 组件卸载时取消进行中的请求
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const handleFileSelect = async (file: File) => {
    // 取消之前的请求
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    const isAudio = file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|webm|m4a|aac|flac)$/i)
    const isVid = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|avi|mkv|flv|wmv|webm)$/i)
    if (!isAudio && !isVid) {
      dispatch({ type: 'SET_UPLOAD_STATUS', status: 'failed', error: '请上传音频或视频文件（MP3、MP4 等）' })
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      dispatch({ type: 'SET_UPLOAD_STATUS', status: 'failed', error: '文件过大，最大 500MB' })
      return
    }

    let uploadFile: File = file

    // 视频文件：先用 FFmpeg.wasm 提取音频，再上传音频
    if (isVideoFile(file)) {
      dispatch({ type: 'SET_SONG_FILE', file, fileName: file.name })
      dispatch({ type: 'SET_UPLOAD_STATUS', status: 'uploading', progress: 5 })

      try {
        const { audioBlob, audioUrl } = await extractAudioFromVideo(file, {
          onProgress: (p) => {
            dispatch({ type: 'SET_UPLOAD_STATUS', status: 'uploading', progress: Math.round(p * 40) })
          },
          outputFormat: 'mp3',
        })
        if (signal.aborted) return

        // 记录 Object URL 用于后续清理
        objectUrlRef.current = audioUrl

        // 用音频 blob 替代视频文件上传
        const mp3Name = file.name.replace(/\.[^.]+$/, '.mp3')
        uploadFile = new File([audioBlob], mp3Name, { type: 'audio/mpeg' })
        dispatch({ type: 'SET_SONG_FILE', file: uploadFile, fileName: mp3Name })
      } catch (err) {
        if (signal.aborted) return
        console.error('[CoverUpload] 视频提取音频失败:', err)
        dispatch({ type: 'SET_UPLOAD_STATUS', status: 'failed', error: '视频处理失败，请直接上传音频文件' })
        return
      }
    } else {
      dispatch({ type: 'SET_SONG_FILE', file, fileName: file.name })
      dispatch({ type: 'SET_UPLOAD_STATUS', status: 'uploading', progress: 0 })
    }

    try {
      const formData = new FormData()
      formData.append('audio', uploadFile)
      const res = await fetch('/api/cover/upload', { method: 'POST', body: formData, signal })
      if (signal.aborted) return
      const data = await res.json()
      if (data.code === 0 && data.data?.url) {
        dispatch({ type: 'SET_SONG_URL', url: data.data.url })
        dispatch({ type: 'SET_UPLOAD_STATUS', status: 'completed', progress: 100 })
        // 清理 Object URL
        if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null }
        onNext()
      } else {
        dispatch({ type: 'SET_UPLOAD_STATUS', status: 'failed', error: data.message || '上传失败' })
      }
    } catch (err) {
      if (signal.aborted) return
      dispatch({ type: 'SET_UPLOAD_STATUS', status: 'failed', error: '上传失败，请重试' })
    }
  }

  const handlePasteUrl = async () => {
    // 取消之前的请求
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    const url = pasteUrl.trim()
    if (!url.startsWith('http')) {
      dispatch({ type: 'SET_UPLOAD_STATUS', status: 'failed', error: '请输入有效的 URL' })
      return
    }

    // 直接音频文件链接（.mp3 等）：直接使用
    if (url.match(/\.(mp3|wav|ogg|webm|m4a|aac|flac|mp4|mov)(\?|$)/i)) {
      dispatch({ type: 'SET_SONG_URL', url })
      dispatch({ type: 'SET_UPLOAD_STATUS', status: 'completed', progress: 100 })
      onNext()
      return
    }

    // 分享链接（抖音、网易云等）：通过 resolve-url API 解析
    dispatch({ type: 'SET_UPLOAD_STATUS', status: 'uploading', progress: 30 })

    try {
      const res = await fetch('/api/cover/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal,
      })
      if (signal.aborted) return
      const data = await res.json()

      if (data.code === 0 && data.data?.url) {
        dispatch({ type: 'SET_SONG_URL', url: data.data.url })
        if (data.data.title) {
          dispatch({ type: 'SET_SONG_FILE', file: null, fileName: `${data.data.title}.mp3` })
        }
        dispatch({ type: 'SET_UPLOAD_STATUS', status: 'completed', progress: 100 })
        onNext()
      } else {
        dispatch({ type: 'SET_UPLOAD_STATUS', status: 'failed', error: data.message || '链接解析失败，请直接上传音频文件' })
      }
    } catch (err) {
      if (signal.aborted) return
      dispatch({ type: 'SET_UPLOAD_STATUS', status: 'failed', error: '链接解析失败，请直接上传音频文件' })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const isUploading = state.song.uploadStatus === 'uploading'
  const isCompleted = state.song.uploadStatus === 'completed'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[28px] font-extrabold tracking-[-0.02em] font-sans text-white">上传原唱</h2>
        <p className="text-white/50 text-[14px] mt-2 font-sans">上传你想翻唱的歌曲原声</p>
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative rounded-[20px] p-12 text-center cursor-pointer transition-all duration-500 bg-[#1C1C1E] ${
          isDragOver
            ? 'scale-[1.01]'
            : ''
        } ${isUploading ? 'pointer-events-none' : ''}`}
      >
        <input ref={fileInputRef} type="file" accept="audio/*,video/*,.mp3,.wav,.ogg,.webm,.m4a,.aac,.flac,.mp4,.mov,.avi,.mkv" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />

        {/* Ambient glow behind success state */}
        {isCompleted && (
          <div className="absolute inset-0 bg-[#10B981]/5 blur-[60px] rounded-full pointer-events-none" />
        )}

        {isUploading ? (
          <div className="relative space-y-4">
            <div className="w-12 h-12 rounded-full border-[2px] border-white/10 border-t-white animate-spin mx-auto" />
            <p className="text-white/50 text-[14px] font-sans">正在上传...</p>
          </div>
        ) : isCompleted ? (
          <div className="relative space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#10b981]/10 flex items-center justify-center mx-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-white text-[15px] font-medium font-sans">{state.song.fileName || '已设置歌曲 URL'}</p>
            <p className="text-white/25 text-[12px] font-sans">点击可重新选择</p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" className="mx-auto">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-white/50 text-[15px] font-sans">拖拽音频或视频文件到这里，或点击选择</p>
            <p className="text-white/25 text-[12px] font-sans">MP3、WAV、MP4、MOV · 最大 500MB</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-white/20 text-[12px] font-sans">或粘贴链接</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* URL input — pill-shaped */}
      <div className="flex items-center bg-[#1C1C1E] p-2 pl-6 rounded-full">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" className="flex-shrink-0">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <input
          type="url"
          value={pasteUrl}
          onChange={(e) => setPasteUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && pasteUrl.trim().startsWith('http') && handlePasteUrl()}
          placeholder="粘贴抖音、网易云、汽水音乐链接或音频URL"
          className="flex-1 bg-transparent border-none px-4 py-2 text-white text-[13px] placeholder:text-white/20 focus:outline-none font-sans"
        />
        <button
          onClick={handlePasteUrl}
          disabled={!pasteUrl.trim().startsWith('http')}
          className="bg-[#3A3A3C] text-white px-6 py-2 rounded-full text-xs font-bold font-sans hover:bg-[#48484A] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          确认
        </button>
      </div>

      {/* Error state */}
      {state.song.error && (
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span className="text-red-300/60 text-[13px] font-sans">{state.song.error}</span>
        </div>
      )}

      {/* Preview player */}
      {isCompleted && previewUrl && (
        <div className="bg-[#1C1C1E] rounded-2xl p-6">
          <div className="flex items-center gap-4">
            {/* Album art placeholder with play overlay */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-xl bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 hover:bg-[#333] active:scale-95 transition-all relative"
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="ml-0.5"><polygon points="8 5 20 12 8 19"/></svg>
              )}
            </button>

            {/* Track info + progress */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-medium font-sans truncate">{state.song.fileName || '粘贴的歌曲链接'}</p>
              <div className="flex justify-between mt-1 mb-2">
                <span className="text-white/30 text-[11px] font-sans tabular-nums">{fmt(time)}</span>
                <span className="text-white/30 text-[11px] font-sans tabular-nums">{fmt(dur)}</span>
              </div>
              {/* Sonic bar */}
              <div
                className="h-1 bg-[#353535] rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const m = mediaRef.current; if (!m || !dur) return
                  const r = e.currentTarget.getBoundingClientRect()
                  m.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur
                }}
              >
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-500" style={{ width: `${dur > 0 ? (time / dur) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Hidden media elements */}
          {isVideo ? (
            <video ref={videoRef} src={previewUrl} preload="metadata" className="hidden" />
          ) : (
            <audio ref={audioRef} src={previewUrl} preload="metadata" />
          )}
        </div>
      )}
    </div>
  )
}
