'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SCENE_CONFIGS,
  type SceneType,
} from '@/types'
import type { MiniMaxDialect } from '@/lib/minimax/types'
import { VideoUploadZone, type VideoFileInfo } from '@/components/features/creation/video-upload-zone'
import type { LyricLine } from '@/lib/subtitle/subtitle-styles'
import { VideoSynthesizer, type SynthesisProgress } from '@/lib/ffmpeg/video-synthesizer'

/**
 * 将歌词文本转换为带时间戳的 LyricLine 数组
 * 基于总时长均匀分配每行歌词的时间
 */
function parseLyricsToLines(lyricsText: string, totalDurationMs: number = 30000): LyricLine[] {
  const lines = lyricsText.split('\n').filter(line => line.trim())
  const lineCount = lines.length
  const durationPerLine = totalDurationMs / lineCount

  return lines.map((text, index) => ({
    id: `line-${index}`,
    text: text.trim(),
    startTime: Math.round(index * durationPerLine),
    endTime: Math.round((index + 1) * durationPerLine),
  }))
}

type CreationPhase = 'input' | 'creating-lyrics' | 'lyrics-preview' | 'creating-music' | 'done' | 'video-synthesis' | 'creating-video' | 'video-done' | 'error'

const DIALECTS: { id: MiniMaxDialect; label: string; flag: string }[] = [
  { id: 'mandarin', label: '普通话', flag: '🇨🇳' },
  { id: 'cantonese', label: '粤语', flag: '🇭🇰' },
  { id: 'english', label: 'English', flag: '🇺🇸' },
]

// Mock history data
const MOCK_HISTORY = [
  { id: '1', title: '蓝牙耳机推广', scene: 'product', dialect: 'mandarin', createdAt: '2分钟前', duration: '30s' },
  { id: '2', title: 'Daily Grind', scene: 'funny', dialect: 'english', createdAt: '1小时前', duration: '30s' },
  { id: '3', title: '漫威英雄混剪', scene: 'ip', dialect: 'mandarin', createdAt: '昨天', duration: '30s' },
]

export default function CreatePage() {
  const [scene, setScene] = useState<SceneType>('product')
  const [dialect, setDialect] = useState<MiniMaxDialect>('mandarin')
  const [description, setDescription] = useState('')

  const [phase, setPhase] = useState<CreationPhase>('input')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [displayedLyrics, setDisplayedLyrics] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 视频合成相关状态
  const [videoFile, setVideoFile] = useState<VideoFileInfo | null>(null)
  const [synthesisProgress, setSynthesisProgress] = useState(0)
  const [synthesisStage, setSynthesisStage] = useState('')
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const credits = 28

  // Typewriter effect (only for lyrics generation)
  useEffect(() => {
    if (phase === 'creating-lyrics' && lyrics) {
      let index = 0
      const interval = setInterval(() => {
        if (index <= lyrics.length) {
          setDisplayedLyrics(lyrics.slice(0, index))
          index += 3
        } else {
          clearInterval(interval)
        }
      }, 20)
      return () => clearInterval(interval)
    }
  }, [phase, lyrics])

  // Progress animation for lyrics generation
  useEffect(() => {
    if (phase === 'creating-lyrics') {
      const steps = ['✍️ 写词中', '🤔 构思押韵', '📝 填词中', '✨ 润色中']
      let stepIndex = 0
      setCurrentStep(steps[0])

      const stepInterval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length
        setCurrentStep(steps[stepIndex])
      }, 2000)

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 2, 90))
      }, 200)

      return () => {
        clearInterval(stepInterval)
        clearInterval(progressInterval)
      }
    }
  }, [phase])

  // Progress animation for music generation
  useEffect(() => {
    if (phase === 'creating-music') {
      const steps = ['🎵 编曲中', '🎙️ 录音中', '🎧 混音中', '🔊 渲染中']
      let stepIndex = 0
      setCurrentStep(steps[0])

      const stepInterval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length
        setCurrentStep(steps[stepIndex])
      }, 3000)

      const progressInterval = setInterval(() => {
        setProgress(p => {
          if (p < 20) return p + 1
          if (p < 50) return p + 0.5
          if (p < 90) return p + 0.3
          return p
        })
      }, 300)

      return () => {
        clearInterval(stepInterval)
        clearInterval(progressInterval)
      }
    }
  }, [phase])

  // 视频合成逻辑
  useEffect(() => {
    if (phase === 'creating-video' && videoFile && audioBlob) {
      const synthesizer = new VideoSynthesizer()
      const lyricLines = parseLyricsToLines(lyrics, 30000)

      const steps = ['🎬 加载视频', '🎵 处理音频', '📝 生成字幕', '⚙️ 合成中', '📤 导出中']
      let stepIndex = 0
      setSynthesisStage(steps[0])

      const stepInterval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length
        setSynthesisStage(steps[stepIndex])
      }, 3000)

      const startSynthesis = async () => {
        try {
          const result = await synthesizer.synthesize({
            videoFile: videoFile.file,
            audioFile: audioBlob,
            lyrics: lyricLines,
            onProgress: (info: SynthesisProgress) => {
              setSynthesisProgress(info.overallProgress * 100)
            },
          })

          setOutputVideoUrl(result.url)
          setPhase('video-done')
        } catch (error) {
          console.error('Video synthesis failed:', error)
          setErrorMessage(error instanceof Error ? error.message : '视频合成失败')
          setPhase('error')
        } finally {
          clearInterval(stepInterval)
        }
      }

      startSynthesis()

      return () => {
        clearInterval(stepInterval)
      }
    }
  }, [phase, videoFile, audioBlob, lyrics])

  // 生成歌词
  const handleGenerateLyrics = useCallback(async () => {
    if (!description.trim()) return

    setPhase('creating-lyrics')
    setProgress(0)
    setLyrics('')
    setDisplayedLyrics('')
    setAudioUrl(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/lyrics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene,
          dialect,
          productInfo: scene === 'product' ? {
            name: description.split('，')[0] || description.slice(0, 20),
            sellingPoints: description.split(/[，,、]/).slice(1, 4).filter(Boolean)
          } : undefined,
          funnyInfo: scene === 'funny' ? {
            theme: description.split('，')[0] || description.slice(0, 20),
            keywords: description.split(/[，,、]/).slice(1, 4).filter(Boolean)
          } : undefined,
          ipInfo: scene === 'ip' ? {
            name: description.split('，')[0] || description.slice(0, 20),
            coreElements: description.split(/[，,、]/).slice(1, 4).filter(Boolean)
          } : undefined,
          vlogInfo: scene === 'vlog' ? {
            activities: description.split(/[，,、]/).slice(0, 3).filter(Boolean),
            location: '',
            mood: 'chill'
          } : undefined,
        }),
      })

      const data = await response.json()

      if (data.code !== 0 || !data.data?.content) {
        throw new Error(data.message || '歌词生成失败')
      }

      setLyrics(data.data.content)
      setPhase('lyrics-preview')

    } catch (error) {
      console.error('Lyrics generation failed:', error)
      setPhase('error')
      setErrorMessage(error instanceof Error ? error.message : '歌词生成失败，请重试')
    }
  }, [description, scene, dialect])

  // 生成音乐
  const handleGenerateMusic = useCallback(async () => {
    if (!lyrics.trim()) return

    setPhase('creating-music')
    setProgress(0)
    setAudioUrl(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics,
          dialect,
          style: 'rap',
          duration: 30,
        }),
      })

      const data = await response.json()

      if (data.code !== 0 || !data.data?.audioUrl) {
        throw new Error(data.message || '音乐生成失败')
      }

      setProgress(100)
      setAudioUrl(data.data.audioUrl)
      setPhase('done')

    } catch (error) {
      console.error('Music generation failed:', error)
      setPhase('error')
      setErrorMessage(error instanceof Error ? error.message : '音乐生成失败，请重试')
    }
  }, [lyrics, dialect])

  const handleReset = () => {
    setPhase('input')
    setProgress(0)
    setCurrentStep('')
    setLyrics('')
    setDisplayedLyrics('')
    setAudioUrl(null)
    setErrorMessage(null)
    setVideoFile(null)
    setSynthesisProgress(0)
    setSynthesisStage('')
    setOutputVideoUrl(null)
    setAudioBlob(null)
  }

  const handleDownload = async () => {
    if (!audioUrl) return
    try {
      const response = await fetch(audioUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `whyfire-rap-${Date.now()}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Create</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="text-violet-400">💎</span>
            <span className="text-sm font-medium">{credits} 积分</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">
            <AnimatePresence mode="wait">
              {/* ========== INPUT PHASE ========== */}
              {phase === 'input' && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="space-y-6"
                >
                  {/* Scene Selection - Suno Style Cards */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                      场景选择
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {SCENE_CONFIGS.map((config) => (
                        <button
                          key={config.id}
                          onClick={() => setScene(config.id)}
                          className={`
                            relative p-4 rounded-xl text-left transition-all duration-200
                            ${scene === config.id
                              ? 'bg-violet-500/10 border-2 border-violet-500'
                              : 'bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{config.icon}</span>
                            <div>
                              <div className="font-medium text-sm">{config.name}</div>
                              <div className="text-xs text-zinc-500 mt-0.5">{config.description}</div>
                            </div>
                          </div>
                          {scene === config.id && (
                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-violet-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Prompt Input - Suno Style Large Textarea */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                      描述你的创意
                    </label>
                    <div className="relative">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={getPlaceholder(scene)}
                        className="w-full h-48 px-5 py-4 bg-white/[0.02] border border-white/5 rounded-xl text-white placeholder-zinc-600 text-base leading-relaxed resize-none focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.03] transition-all"
                      />
                      <div className="absolute bottom-4 right-4 text-xs text-zinc-600">
                        {description.length} / 500
                      </div>
                    </div>
                  </div>

                  {/* Dialect Selection - Suno Style Pills */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                      语言风格
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DIALECTS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setDialect(d.id)}
                          className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${dialect === d.id
                              ? 'bg-white text-black'
                              : 'bg-white/[0.02] text-zinc-400 border border-white/5 hover:border-white/10 hover:text-white'
                            }
                          `}
                        >
                          <span className="mr-1.5">{d.flag}</span>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Options Toggle - Suno Style */}
                  <div className="flex items-center justify-between py-4 border-t border-white/5">
                    <div className="text-sm text-zinc-400">
                      <span className="font-medium text-white">高级选项</span>
                      <span className="ml-2 text-zinc-500">自定义歌词、BPM 等</span>
                    </div>
                    <button className="text-violet-400 text-sm font-medium hover:text-violet-300 transition-colors">
                      展开 →
                    </button>
                  </div>

                  {/* Generate Button - Suno Style */}
                  <button
                    onClick={handleGenerateLyrics}
                    disabled={!description.trim()}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:from-zinc-800 disabled:to-zinc-800 text-white disabled:text-zinc-500 font-semibold text-base rounded-xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 disabled:shadow-none"
                  >
                    <span className="flex items-center justify-center gap-3">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      生成 Rap
                      <span className="text-sm font-normal opacity-75">· 2 积分</span>
                    </span>
                  </button>
                </motion.div>
              )}

              {/* ========== CREATING LYRICS PHASE ========== */}
              {(phase === 'creating-lyrics') && (
                <motion.div
                  key="creating-lyrics"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Generation Status */}
                  <div className="text-center py-8">
                    <motion.div
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-violet-500/10 border border-violet-500/20"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div
                        className="w-2 h-2 rounded-full bg-violet-500"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-violet-300 font-medium">{currentStep || '✍️ 写词中'}</span>
                    </motion.div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">歌词生成中</span>
                      <span className="text-zinc-300 font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-violet-600 to-violet-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <p className="text-center text-sm text-zinc-500">
                    正在为您创作专属歌词，请稍候...
                  </p>
                </motion.div>
              )}

              {/* ========== LYRICS PREVIEW PHASE (Editable) ========== */}
              {phase === 'lyrics-preview' && lyrics && (
                <motion.div
                  key="lyrics-preview"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Header */}
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
                      <span className="text-violet-400">📝</span>
                      <span className="text-violet-300 font-medium">歌词已生成，可编辑</span>
                    </div>
                  </div>

                  {/* Editable Lyrics */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-300">歌词内容</span>
                      <span className="text-xs text-zinc-500">{lyrics.length} 字</span>
                    </div>
                    <div className="p-4">
                      <textarea
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="w-full h-64 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-lg text-zinc-300 text-sm leading-relaxed resize-none focus:outline-none focus:border-violet-500/50 font-mono"
                        placeholder="歌词内容..."
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setPhase('input')
                        setLyrics('')
                      }}
                      className="py-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white font-medium text-sm rounded-xl transition-all"
                    >
                      ← 重新描述
                    </button>
                    <button
                      onClick={handleGenerateMusic}
                      disabled={!lyrics.trim()}
                      className="py-3.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:from-zinc-800 disabled:to-zinc-800 text-white disabled:text-zinc-500 font-medium text-sm rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      <span>🎵</span>
                      生成音乐
                    </button>
                  </div>

                  <p className="text-center text-xs text-zinc-600">
                    💡 您可以直接编辑上面的歌词内容，然后再生成音乐
                  </p>
                </motion.div>
              )}

              {/* ========== CREATING MUSIC PHASE ========== */}
              {phase === 'creating-music' && (
                <motion.div
                  key="creating-music"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Generation Status */}
                  <div className="text-center py-8">
                    <motion.div
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-emerald-300 font-medium">{currentStep || '🎵 编曲中'}</span>
                    </motion.div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">音乐生成中</span>
                      <span className="text-zinc-300 font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-violet-600 via-violet-500 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Lyrics Preview (Read-only) */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-300">歌词</span>
                      <span className="text-xs text-zinc-500">{lyrics.length} 字</span>
                    </div>
                    <div className="p-4 max-h-32 overflow-y-auto">
                      <p className="text-zinc-500 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                        {lyrics}
                      </p>
                    </div>
                  </div>

                  {/* Music Visualization */}
                  <div className="flex justify-center py-4">
                    <div className="flex items-end gap-1.5 h-16">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 bg-gradient-to-t from-violet-600 to-emerald-500 rounded-full"
                          animate={{
                            height: [16, 48 + Math.random() * 16, 16],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.08,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-center text-sm text-zinc-500">
                    正在为您的歌词配乐，预计等待 1-2 分钟...
                  </p>
                </motion.div>
              )}

              {/* ========== DONE PHASE ========== */}
              {phase === 'done' && audioUrl && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Success Header */}
                  <div className="text-center py-6">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-emerald-300 font-medium">创作完成</span>
                    </div>
                  </div>

                  {/* Audio Player - Suno Style Card */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    {/* Cover Art Area */}
                    <div className="aspect-video bg-gradient-to-br from-violet-600/20 to-emerald-600/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">{SCENE_CONFIGS.find(c => c.id === scene)?.icon}</div>
                        <div className="text-lg font-semibold">{dialect === 'mandarin' ? '普通话' : dialect === 'cantonese' ? '粤语' : 'English'} Rap</div>
                        <div className="text-sm text-zinc-500 mt-1">30 秒</div>
                      </div>
                    </div>

                    {/* Audio Controls */}
                    <div className="p-5">
                      <audio
                        controls
                        src={audioUrl}
                        className="w-full h-12"
                        autoPlay
                      />
                    </div>
                  </div>

                  {/* Lyrics Card */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5">
                      <span className="text-sm font-medium text-zinc-300">歌词</span>
                    </div>
                    <div className="p-5">
                      <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                        {lyrics}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons - Suno Style */}
                  <div className="space-y-3">
                    {/* 视频合成入口 - 突出显示 */}
                    <button
                      onClick={() => {
                        // 先下载音频 Blob 以便后续合成
                        fetch(audioUrl)
                          .then(res => res.blob())
                          .then(blob => {
                            setAudioBlob(blob)
                            setPhase('video-synthesis')
                          })
                          .catch(() => {
                            setPhase('video-synthesis')
                          })
                      }}
                      className="w-full py-4 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-semibold text-base rounded-xl transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-3"
                    >
                      <span>🎬</span>
                      合成视频
                      <span className="text-sm font-normal opacity-75">· 添加视频素材</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleDownload}
                        className="py-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 text-white font-medium text-sm rounded-xl transition-all"
                      >
                        ⬇️ 下载音频
                      </button>
                      <button
                        onClick={handleReset}
                        className="py-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 text-white font-medium text-sm rounded-xl transition-all"
                      >
                        ✨ 再创作一个
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========== VIDEO SYNTHESIS PHASE ========== */}
              {phase === 'video-synthesis' && (
                <motion.div
                  key="video-synthesis"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="space-y-6"
                >
                  {/* Header */}
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-pink-500/10 border border-pink-500/20">
                      <span className="text-pink-400">🎬</span>
                      <span className="text-pink-300 font-medium">添加视频素材</span>
                    </div>
                  </div>

                  {/* 音频预览 */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600/30 to-pink-500/30 flex items-center justify-center">
                        <span className="text-xl">🎵</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">音频已就绪</p>
                        <p className="text-zinc-500 text-xs">{lyrics.length} 字歌词 · 30 秒</p>
                      </div>
                      {audioUrl && (
                        <audio controls src={audioUrl} className="h-8 w-40" />
                      )}
                    </div>
                  </div>

                  {/* 视频上传区域 */}
                  <VideoUploadZone
                    onUpload={(info) => {
                      setVideoFile(info)
                      setPhase('creating-video')
                    }}
                    maxSize={100 * 1024 * 1024}
                  />

                  {/* 返回按钮 */}
                  <button
                    onClick={() => setPhase('done')}
                    className="w-full py-3 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    ← 返回
                  </button>
                </motion.div>
              )}

              {/* ========== CREATING VIDEO PHASE ========== */}
              {phase === 'creating-video' && videoFile && (
                <motion.div
                  key="creating-video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Header */}
                  <div className="text-center py-4">
                    <motion.div
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-pink-500/10 border border-pink-500/20"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div
                        className="w-2 h-2 rounded-full bg-pink-500"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-pink-300 font-medium">{synthesisStage || '🎬 合成中'}</span>
                    </motion.div>
                  </div>

                  {/* 视频预览 */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    <div className="aspect-video">
                      <video
                        src={videoFile.url}
                        className="w-full h-full object-contain"
                        muted
                      />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">视频合成中</span>
                      <span className="text-zinc-300 font-mono">{Math.round(synthesisProgress)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-pink-600 to-violet-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${synthesisProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Music Visualization */}
                  <div className="flex justify-center py-4">
                    <div className="flex items-end gap-1.5 h-16">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 bg-gradient-to-t from-pink-600 to-violet-500 rounded-full"
                          animate={{
                            height: [16, 48 + Math.random() * 16, 16],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.08,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-center text-sm text-zinc-500">
                    正在将音乐与视频合成，预计等待 1-2 分钟...
                  </p>

                  {/* 取消按钮 */}
                  <button
                    onClick={() => {
                      setVideoFile(null)
                      setPhase('video-synthesis')
                    }}
                    className="w-full py-3 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    取消
                  </button>
                </motion.div>
              )}

              {/* ========== VIDEO DONE PHASE ========== */}
              {phase === 'video-done' && outputVideoUrl && (
                <motion.div
                  key="video-done"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Success Header */}
                  <div className="text-center py-6">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-pink-500/10 border border-pink-500/20">
                      <span className="text-pink-400">✓</span>
                      <span className="text-pink-300 font-medium">视频合成完成</span>
                    </div>
                  </div>

                  {/* Video Player */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    <div className="aspect-video">
                      <video
                        src={outputVideoUrl}
                        controls
                        className="w-full h-full object-contain"
                        autoPlay
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(outputVideoUrl)
                          const blob = await response.blob()
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `whyfire-video-${Date.now()}.mp4`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        } catch (error) {
                          console.error('Download failed:', error)
                        }
                      }}
                      className="py-3.5 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-pink-500/20"
                    >
                      ⬇️ 下载视频
                    </button>
                    <button
                      onClick={handleReset}
                      className="py-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 text-white font-medium text-sm rounded-xl transition-all"
                    >
                      ✨ 再创作一个
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========== ERROR PHASE ========== */}
              {phase === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">😢</div>
                  <p className="text-red-400 font-medium mb-2">创作失败</p>
                  <p className="text-zinc-500 text-sm mb-6">{errorMessage}</p>
                  <button
                    onClick={handleReset}
                    className="px-8 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-white font-medium rounded-xl transition-all"
                  >
                    重新开始
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Right Sidebar - History Panel */}
      <aside className="w-80 border-l border-white/5 bg-[#0a0a0a] hidden lg:block">
        <div className="h-14 border-b border-white/5 flex items-center px-5">
          <h2 className="text-sm font-semibold text-zinc-300">创作历史</h2>
        </div>
        <div className="p-4 space-y-2">
          {MOCK_HISTORY.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] hover:border-white/10 cursor-pointer transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600/30 to-emerald-600/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">
                    {item.scene === 'product' && '📦'}
                    {item.scene === 'funny' && '😂'}
                    {item.scene === 'ip' && '🎬'}
                    {item.scene === 'vlog' && '📹'}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                    <span>{item.dialect === 'mandarin' ? '普通话' : item.dialect === 'cantonese' ? '粤语' : 'English'}</span>
                    <span>·</span>
                    <span>{item.duration}</span>
                  </div>
                  <div className="text-xs text-zinc-600 mt-1">{item.createdAt}</div>
                </div>
                {/* Play Icon */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Load More */}
          <button className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            查看更多 →
          </button>
        </div>
      </aside>
    </div>
  )
}

function getPlaceholder(scene: SceneType): string {
  const placeholders: Record<SceneType, string> = {
    product: '描述你想推广的产品或服务...\n\n例如：一款无线蓝牙耳机，主打音质好、续航长、性价比高',
    funny: '描述你想创作的搞笑主题...\n\n例如：打工人早起的一天，闹钟响了不想起，地铁挤成沙丁鱼',
    ip: '描述你想混剪的IP内容...\n\n例如：漫威英雄高光时刻，钢铁侠打响指，美国队长举起盾牌',
    vlog: '描述你想记录的Vlog内容...\n\n例如：周末去咖啡店打卡，阳光很好，点了杯拿铁，心情超棒',
  }
  return placeholders[scene]
}
