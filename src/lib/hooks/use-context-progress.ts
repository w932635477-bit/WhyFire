/**
 * 上下文进度 Hook
 * 用于在 React 组件中追踪和显示上下文使用情况
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ContextTracker,
  ContextProgress,
  generateContextReport,
  getStatusBarProgress,
  generateProgressBar,
} from '@/lib/utils/context-progress'

export interface UseContextProgressOptions {
  /** 是否在控制台输出进度报告 */
  logToConsole?: boolean
  /** 是否在接近限制时显示警告 */
  showWarnings?: boolean
  /** 自定义警告回调 */
  onWarning?: (progress: ContextProgress) => void
}

export interface UseContextProgressReturn {
  /** 当前进度 */
  progress: ContextProgress | null
  /** 进度条字符串 */
  progressBar: string
  /** 状态栏格式 */
  statusBar: string
  /** 完整报告 */
  report: string
  /** 添加用户消息 */
  addUserMessage: (content: string) => void
  /** 添加助手消息 */
  addAssistantMessage: (content: string) => void
  /** 重置追踪器 */
  reset: () => void
  /** 追踪器实例 */
  tracker: ContextTracker
}

/**
 * 上下文进度 Hook
 */
export function useContextProgress(
  options: UseContextProgressOptions = {}
): UseContextProgressReturn {
  const { logToConsole = true, showWarnings = true, onWarning } = options

  const trackerRef = useRef<ContextTracker>(new ContextTracker())
  const [progress, setProgress] = useState<ContextProgress | null>(null)

  // 更新进度
  const updateProgress = useCallback(() => {
    const newProgress = trackerRef.current.getProgress()
    setProgress(newProgress)

    if (logToConsole) {
      console.log(trackerRef.current.getReport())
    }

    // 检查是否需要显示警告
    if (showWarnings && (newProgress.level === 'warning' || newProgress.level === 'critical' || newProgress.level === 'danger')) {
      if (onWarning) {
        onWarning(newProgress)
      } else {
        // 默认警告行为
        console.warn(`[Context Progress] ${newProgress.level.toUpperCase()}: ${newProgress.percentage.toFixed(1)}% used`)
      }
    }

    return newProgress
  }, [logToConsole, showWarnings, onWarning])

  // 添加用户消息
  const addUserMessage = useCallback((content: string) => {
    trackerRef.current.addMessage('user', content)
    updateProgress()
  }, [updateProgress])

  // 添加助手消息
  const addAssistantMessage = useCallback((content: string) => {
    trackerRef.current.addMessage('assistant', content)
    updateProgress()
  }, [updateProgress])

  // 重置
  const reset = useCallback(() => {
    trackerRef.current.reset()
    setProgress(null)
  }, [])

  // 生成显示内容
  const progressBar = progress ? generateProgressBar(progress.percentage) : ''
  const statusBar = progress ? getStatusBarProgress(progress) : '📊 0%'
  const report = progress ? generateContextReport(progress) : ''

  return {
    progress,
    progressBar,
    statusBar,
    report,
    addUserMessage,
    addAssistantMessage,
    reset,
    tracker: trackerRef.current,
  }
}

/**
 * 上下文进度显示组件 Props
 */
export interface ContextProgressDisplayProps {
  /** 进度信息 */
  progress: ContextProgress | null
  /** 显示模式 */
  mode?: 'full' | 'compact' | 'minimal'
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 获取进度条颜色类名
 */
export function getProgressColorClass(level: ContextProgress['level']): string {
  switch (level) {
    case 'danger':
      return 'bg-red-500'
    case 'critical':
      return 'bg-purple-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'info':
      return 'bg-cyan-500'
    default:
      return 'bg-green-500'
  }
}

/**
 * 获取进度条文本颜色类名
 */
export function getProgressTextColorClass(level: ContextProgress['level']): string {
  switch (level) {
    case 'danger':
      return 'text-red-400'
    case 'critical':
      return 'text-purple-400'
    case 'warning':
      return 'text-yellow-400'
    case 'info':
      return 'text-cyan-400'
    default:
      return 'text-green-400'
  }
}

// 导出工具函数和类型
export { generateProgressBar, type ContextProgress } from '@/lib/utils/context-progress'
