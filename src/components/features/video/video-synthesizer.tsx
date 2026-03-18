'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  VideoSynthesizer,
  SynthesisProgress,
  SynthesisStage,
  VideoSynthesizerResult,
  downloadVideoBlob,
  revokeVideoUrl,
} from '@/lib/ffmpeg/video-synthesizer'
import { useFFmpeg } from '@/hooks/use-ffmpeg'
import type { LyricLine } from '@/lib/subtitle/subtitle-styles'
import type { SubtitleConfig } from '@/lib/subtitle/subtitle-styles'
import { PRESET_STYLES, SubtitleStyle } from '@/lib/subtitle/subtitle-styles'

/**
 * Video Synthesizer Component Props
 */
export interface VideoSynthesizerProps {
  /** Video file to process */
  videoFile: File | Blob
  /** Audio file or URL */
  audioFile: File | Blob | string
  /** Lyrics with timing information */
  lyrics: LyricLine[]
  /** Subtitle configuration (optional) */
  subtitleConfig?: SubtitleConfig
  /** Progress callback */
  onProgress?: (progress: number) => void
  /** Completion callback */
  onComplete: (videoBlob: Blob) => void
  /** Error callback */
  onError: (error: Error) => void
  /** Custom class name */
  className?: string
  /** Auto-start synthesis */
  autoStart?: boolean
  /** Show preview after completion */
  showPreview?: boolean
}

/**
 * Progress stage display configuration
 */
const STAGE_CONFIG: Record<SynthesisStage, { label: string; icon: string }> = {
  idle: { label: 'Ready', icon: '⏸️' },
  'loading-ffmpeg': { label: 'Loading FFmpeg', icon: '⏳' },
  'writing-video': { label: 'Processing Video', icon: '🎬' },
  'writing-audio': { label: 'Processing Audio', icon: '🎵' },
  'generating-subtitles': { label: 'Generating Subtitles', icon: '📝' },
  synthesizing: { label: 'Synthesizing', icon: '⚙️' },
  'reading-output': { label: 'Finalizing', icon: '📤' },
  complete: { label: 'Complete', icon: '✅' },
  error: { label: 'Error', icon: '❌' },
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Progress Bar Component
 */
function ProgressBar({
  progress,
  stage,
  message,
}: {
  progress: number
  stage: SynthesisStage
  message: string
}) {
  const config = STAGE_CONFIG[stage]
  const percentage = Math.round(progress * 100)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className="text-sm font-medium text-white">{config.label}</span>
        </div>
        <span className="text-sm text-gray-400">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {message && (
        <p className="mt-2 text-xs text-gray-400 truncate">{message}</p>
      )}
    </div>
  )
}

/**
 * Video Preview Component
 */
function VideoPreview({
  videoUrl,
  onDownload,
  onClose,
}: {
  videoUrl: string
  onDownload: () => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    return () => {
      // Cleanup URL when component unmounts
      revokeVideoUrl(videoUrl)
    }
  }, [videoUrl])

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onDownload}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Video
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

/**
 * Style Selector Component
 */
function StyleSelector({
  currentStyle,
  onStyleChange,
  disabled,
}: {
  currentStyle: SubtitleStyle
  onStyleChange: (style: SubtitleStyle) => void
  disabled: boolean
}) {
  const styles: SubtitleStyle[] = ['karaoke', 'bounce', 'gradient', 'neon']

  return (
    <div className="flex gap-2 flex-wrap">
      {styles.map((style) => (
        <button
          key={style}
          onClick={() => onStyleChange(style)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            currentStyle === style
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {style.charAt(0).toUpperCase() + style.slice(1)}
        </button>
      ))}
    </div>
  )
}

/**
 * Main Video Synthesizer Component
 */
export function VideoSynthesizerComponent({
  videoFile,
  audioFile,
  lyrics,
  subtitleConfig = PRESET_STYLES.karaoke,
  onProgress,
  onComplete,
  onError,
  className = '',
  autoStart = false,
  showPreview = true,
}: VideoSynthesizerProps) {
  // State
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [result, setResult] = useState<VideoSynthesizerResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progressInfo, setProgressInfo] = useState<SynthesisProgress>({
    stage: 'idle',
    progress: 0,
    overallProgress: 0,
    message: 'Ready to start',
  })
  const [currentStyle, setCurrentStyle] = useState<SubtitleStyle>(subtitleConfig.style)
  const [currentConfig, setCurrentConfig] = useState<SubtitleConfig>(subtitleConfig)

  // Refs
  const synthesizerRef = useRef<VideoSynthesizer | null>(null)

  // FFmpeg hook for checking readiness
  const { loaded: ffmpegLoaded, loading: ffmpegLoading } = useFFmpeg({
    autoLoad: false,
  })

  /**
   * Handle style change
   */
  const handleStyleChange = useCallback((style: SubtitleStyle) => {
    setCurrentStyle(style)
    setCurrentConfig(PRESET_STYLES[style])
  }, [])

  /**
   * Start video synthesis
   */
  const startSynthesis = useCallback(async () => {
    if (isSynthesizing) return

    setIsSynthesizing(true)
    setError(null)
    setResult(null)

    try {
      // Create synthesizer
      synthesizerRef.current = new VideoSynthesizer(currentConfig)

      // Start synthesis
      const synthesisResult = await synthesizerRef.current.synthesize({
        videoFile,
        audioFile,
        lyrics,
        subtitleConfig: currentConfig,
        onProgress: (info) => {
          setProgressInfo(info)
          onProgress?.(info.overallProgress)
        },
      })

      setResult(synthesisResult)
      onComplete(synthesisResult.blob)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      onError(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsSynthesizing(false)
    }
  }, [videoFile, audioFile, lyrics, currentConfig, isSynthesizing, onProgress, onComplete, onError])

  /**
   * Reset synthesis state
   */
  const resetSynthesis = useCallback(() => {
    setResult(null)
    setError(null)
    setProgressInfo({
      stage: 'idle',
      progress: 0,
      overallProgress: 0,
      message: 'Ready to start',
    })
  }, [])

  /**
   * Download the synthesized video
   */
  const handleDownload = useCallback(() => {
    if (result) {
      downloadVideoBlob(result.blob, result.filename)
    }
  }, [result])

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !isSynthesizing && !result && !error) {
      startSynthesis()
    }
  }, [autoStart, isSynthesizing, result, error, startSynthesis])

  return (
    <div className={`bg-gray-900 rounded-xl p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Video Synthesizer</h2>
        <p className="text-sm text-gray-400">
          Combine video, audio, and subtitles into your final video
        </p>
      </div>

      {/* Style Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Subtitle Style
        </label>
        <StyleSelector
          currentStyle={currentStyle}
          onStyleChange={handleStyleChange}
          disabled={isSynthesizing}
        />
      </div>

      {/* Input Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-400 mb-1">Video</p>
          <p className="text-white font-medium truncate">
            {videoFile instanceof File ? videoFile.name : 'Video data'}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {formatFileSize(videoFile.size)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-400 mb-1">Audio</p>
          <p className="text-white font-medium truncate">
            {typeof audioFile === 'string'
              ? audioFile.split('/').pop()
              : audioFile instanceof File
              ? audioFile.name
              : 'Audio data'}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {typeof audioFile !== 'string' && formatFileSize(audioFile.size)}
          </p>
        </div>
      </div>

      {/* Lyrics Info */}
      <div className="bg-gray-800 rounded-lg p-3">
        <p className="text-gray-400 text-sm mb-1">Lyrics</p>
        <p className="text-white font-medium">{lyrics.length} lines</p>
      </div>

      {/* Progress or Result */}
      {result && showPreview ? (
        <VideoPreview
          videoUrl={result.url}
          onDownload={handleDownload}
          onClose={resetSynthesis}
        />
      ) : (
        <div className="space-y-4">
          {/* Progress Bar */}
          {(isSynthesizing || progressInfo.stage !== 'idle') && (
            <ProgressBar
              progress={progressInfo.overallProgress}
              stage={progressInfo.stage}
              message={progressInfo.message}
            />
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">⚠️</span>
                <div>
                  <p className="text-red-400 font-medium">Synthesis Failed</p>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={startSynthesis}
            disabled={isSynthesizing || ffmpegLoading}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
              isSynthesizing
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isSynthesizing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Synthesizing...
              </span>
            ) : (
              'Start Synthesis'
            )}
          </button>

          {/* Result Info */}
          {result && !showPreview && (
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✅</span>
                  <div>
                    <p className="text-green-400 font-medium">Synthesis Complete!</p>
                    <p className="text-green-300 text-sm">
                      {formatFileSize(result.size)} - {formatDuration(result.duration)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage Timeline (when synthesizing) */}
      {isSynthesizing && (
        <div className="border-t border-gray-800 pt-4">
          <p className="text-xs font-medium text-gray-500 mb-3">STAGES</p>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(STAGE_CONFIG) as SynthesisStage[])
              .filter((s) => !['idle', 'error', 'complete'].includes(s))
              .map((stage) => {
                const config = STAGE_CONFIG[stage]
                const isActive = progressInfo.stage === stage
                const isComplete =
                  Object.keys(STAGE_CONFIG).indexOf(progressInfo.stage) >
                  Object.keys(STAGE_CONFIG).indexOf(stage)

                return (
                  <div
                    key={stage}
                    className={`flex items-center gap-2 p-2 rounded-md ${
                      isActive
                        ? 'bg-purple-600/20 border border-purple-500/50'
                        : isComplete
                        ? 'bg-green-600/10 border border-green-500/30'
                        : 'bg-gray-800 border border-gray-700'
                    }`}
                  >
                    <span
                      className={`text-sm ${
                        isActive ? 'opacity-100' : isComplete ? 'opacity-70' : 'opacity-40'
                      }`}
                    >
                      {config.icon}
                    </span>
                    <span
                      className={`text-xs ${
                        isActive
                          ? 'text-white'
                          : isComplete
                          ? 'text-green-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {config.label}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoSynthesizerComponent
