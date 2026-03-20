'use client'

import { useState, useEffect, useRef } from 'react'
import type { MiniMaxDialect, MiniMaxMusicStyle, MusicGenerationResult } from '@/lib/minimax/types'

/**
 * 音乐生成器组件属性
 */
export interface MusicGeneratorProps {
  /** 歌词内容 */
  lyrics: string
  /** 方言选择 */
  dialect: MiniMaxDialect
  /** 音乐风格 */
  style: MiniMaxMusicStyle
  /** 音乐生成成功回调 */
  onMusicGenerated: (audioUrl: string, taskId: string) => void
  /** 错误回调 */
  onError: (error: Error) => void
  /** 下一步回调 */
  onNext?: () => void
  /** 可选: 初始任务ID (用于恢复状态) */
  initialTaskId?: string
  /** 可选: 自定义类名 */
  className?: string
}

/**
 * 音乐生成状态
 */
type MusicStatus = 'idle' | 'generating' | 'polling' | 'completed' | 'failed'

/**
 * 进度阶段配置
 */
const PROGRESS_STAGES = {
  pending: { label: '等待处理', progress: 10 },
  processing: { label: '生成中...', progress: 60 },
  completed: { label: '完成', progress: 100 },
  failed: { label: '失败', progress: 0 },
}

/**
 * 音乐生成组件
 *
 * 功能:
 * 1. 显示音乐生成按钮
 * 2. 调用 /api/music/generate 创建任务
 * 3. 轮询 /api/music/status 查询状态
 * 4. 显示进度条和当前阶段
 * 5. 完成后播放预览
 * 6. 下载音频文件
 */
export function MusicGenerator({
  lyrics,
  dialect,
  style,
  onMusicGenerated,
  onError,
  onNext,
  initialTaskId,
  className = '',
}: MusicGeneratorProps) {
  // 状态
  const [status, setStatus] = useState<MusicStatus>('idle')
  const [taskId, setTaskId] = useState<string | null>(initialTaskId || null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 轮询定时器
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingCountRef = useRef(0)
  const MAX_POLLING_ATTEMPTS = 100 // 最多轮询 100 次 (约 5 分钟)

  /**
   * 清理轮询定时器
   */
  const clearPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    pollingCountRef.current = 0
  }

  /**
   * 组件卸载时清理
   */
  useEffect(() => {
    return () => {
      clearPolling()
    }
  }, [])

  /**
   * 轮询任务状态
   */
  const pollTaskStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/music/status?taskId=${id}`)
      const result = await response.json()

      if (result.code !== 0) {
        throw new Error(result.message || '查询任务状态失败')
      }

      const data: MusicGenerationResult = result.data

      // 更新进度和阶段
      const stageConfig = PROGRESS_STAGES[data.status]
      setCurrentStage(stageConfig.label)

      // 计算进度 (添加一些随机性让进度更自然)
      if (data.status === 'pending') {
        setProgress(10 + Math.random() * 20)
      } else if (data.status === 'processing') {
        setProgress(30 + Math.random() * 50)
      } else {
        setProgress(stageConfig.progress)
      }

      // 检查完成状态
      if (data.status === 'completed' && data.audioUrl) {
        clearPolling()
        setStatus('completed')
        setAudioUrl(data.audioUrl)
        onMusicGenerated(data.audioUrl, id)
        return
      }

      // 检查失败状态
      if (data.status === 'failed') {
        clearPolling()
        setStatus('failed')
        setErrorMessage(data.error || '音乐生成失败')
        onError(new Error(data.error || '音乐生成失败'))
        return
      }

      // 检查轮询次数
      pollingCountRef.current++
      if (pollingCountRef.current >= MAX_POLLING_ATTEMPTS) {
        clearPolling()
        setStatus('failed')
        setErrorMessage('任务超时,请重试')
        onError(new Error('任务超时'))
      }
    } catch (error) {
      console.error('[MusicGenerator] 轮询失败:', error)
      // 轮询失败不立即中断,继续尝试
    }
  }

  /**
   * 开始轮询
   */
  const startPolling = (id: string) => {
    setStatus('polling')
    pollingCountRef.current = 0

    // 立即查询一次
    pollTaskStatus(id)

    // 每 3 秒轮询一次
    pollingIntervalRef.current = setInterval(() => {
      pollTaskStatus(id)
    }, 3000)
  }

  /**
   * 开始生成音乐
   */
  const handleGenerate = async () => {
    if (!lyrics || lyrics.trim().length === 0) {
      onError(new Error('歌词内容不能为空'))
      return
    }

    setStatus('generating')
    setProgress(5)
    setCurrentStage('AI 正在创作音乐...')
    setErrorMessage(null)

    try {
      // 创建 AbortController 用于超时控制（180 秒超时）
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000)

      // 调用生成 API
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics,
          dialect,
          style,
          duration: 30,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (result.code !== 0) {
        throw new Error(result.message || '创建音乐生成任务失败')
      }

      // 检查是否直接返回了音频 URL（同步模式）
      if (result.data.audioUrl) {
        setProgress(100)
        setCurrentStage('完成')
        setStatus('completed')
        setAudioUrl(result.data.audioUrl)
        onMusicGenerated(result.data.audioUrl, result.data.taskId)
        return
      }

      // 如果是异步模式，开始轮询
      const newTaskId = result.data.taskId
      setTaskId(newTaskId)
      setProgress(10)
      setCurrentStage(PROGRESS_STAGES.pending.label)

      // 开始轮询状态
      startPolling(newTaskId)
    } catch (error) {
      console.error('[MusicGenerator] 生成失败:', error)
      setStatus('failed')
      setProgress(0)
      const err = error instanceof Error ? error : new Error('未知错误')
      setErrorMessage(err.name === 'AbortError' ? '请求超时，请重试' : err.message)
      onError(err)
    }
  }

  /**
   * 重新生成
   */
  const handleRetry = () => {
    clearPolling()
    setTaskId(null)
    setAudioUrl(null)
    setProgress(0)
    setCurrentStage('')
    setErrorMessage(null)
    setStatus('idle')
  }

  /**
   * 下载音频
   */
  const handleDownload = async () => {
    if (!audioUrl) return

    try {
      const response = await fetch(audioUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `whyfire-music-${taskId}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[MusicGenerator] 下载失败:', error)
      onError(new Error('下载失败'))
    }
  }

  // 渲染
  return (
    <div className={`bg-dark-800 rounded-xl p-6 border border-dark-700 ${className}`}>
      <h2 className="text-xl font-semibold mb-6">生成 Rap 音乐</h2>

      {/* 空闲状态 - 显示生成按钮 */}
      {status === 'idle' && (
        <div className="text-center py-12">
          <button
            onClick={handleGenerate}
            disabled={!lyrics}
            className="gradient-btn px-8 py-4 rounded-xl font-medium text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            点击生成音乐
          </button>
          <p className="text-gray-500 text-sm mt-4">
            AI 将为歌词配上 {style.toUpperCase()} 风格的伴奏
          </p>
          {!lyrics && (
            <p className="text-red-400 text-sm mt-2">请先生成歌词</p>
          )}
        </div>
      )}

      {/* 生成中状态 - 显示进度 */}
      {(status === 'generating' || status === 'polling') && (
        <div className="py-8">
          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{currentStage}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 提示信息 */}
          <p className="text-gray-500 text-sm text-center">
            音乐生成通常需要 1-2 分钟，AI 正在为你创作独特旋律...
          </p>

          {/* 任务 ID */}
          {taskId && (
            <p className="text-gray-600 text-xs text-center mt-2">
              任务 ID: {taskId}
            </p>
          )}
        </div>
      )}

      {/* 完成状态 - 显示播放器和下载 */}
      {status === 'completed' && audioUrl && (
        <div>
          <div className="bg-dark-700 rounded-lg p-4 mb-4">
            <audio controls src={audioUrl} className="w-full" />
          </div>

          <div className="flex gap-3 justify-between">
            <button
              onClick={handleRetry}
              className="px-4 py-2 border border-dark-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              重新生成
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2 border border-primary-500 text-primary-500 rounded-lg hover:bg-primary-500 hover:text-white transition-colors"
              >
                下载音频
              </button>
              {onNext && (
                <button
                  onClick={onNext}
                  className="gradient-btn px-6 py-2 rounded-lg font-medium text-white"
                >
                  下一步：选择视频
                </button>
              )}
            </div>
          </div>

          {/* 任务 ID */}
          {taskId && (
            <p className="text-gray-600 text-xs text-center mt-4">
              任务 ID: {taskId}
            </p>
          )}
        </div>
      )}

      {/* 失败状态 - 显示错误和重试 */}
      {status === 'failed' && (
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">生成失败</p>
            {errorMessage && (
              <p className="text-sm mt-2">{errorMessage}</p>
            )}
          </div>

          <button
            onClick={handleRetry}
            className="gradient-btn px-6 py-3 rounded-lg font-medium text-white"
          >
            重新生成
          </button>
        </div>
      )}
    </div>
  )
}

export default MusicGenerator
