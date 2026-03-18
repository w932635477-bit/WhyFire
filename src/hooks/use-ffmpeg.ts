/**
 * useFFmpeg Hook
 * 提供 FFmpeg.wasm 的 React Hook 封装
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { FFmpegClient, getFFmpegClient } from '@/lib/ffmpeg/ffmpeg-client'
import type { FFmpegProgress, SharedArrayBufferSupport } from '@/lib/ffmpeg/types'

export interface UseFFmpegReturn {
  /** FFmpeg 是否已加载完成 */
  loaded: boolean
  /** FFmpeg 是否正在加载 */
  loading: boolean
  /** 加载错误 */
  error: Error | null
  /** 加载进度 (0-1) */
  progress: number
  /** FFmpeg 客户端实例 */
  client: FFmpegClient | null
  /** 是否支持多线程 */
  multiThread: boolean
  /** SharedArrayBuffer 支持情况 */
  sharedArrayBufferSupport: SharedArrayBufferSupport | null
  /** 加载 FFmpeg */
  load: (options?: { multiThread?: boolean }) => Promise<void>
  /** 终止 FFmpeg */
  terminate: () => Promise<void>
}

export interface UseFFmpegOptions {
  /** 是否自动加载 */
  autoLoad?: boolean
  /** 是否使用多线程 */
  multiThread?: boolean
  /** 加载完成回调 */
  onLoad?: () => void
  /** 加载错误回调 */
  onError?: (error: Error) => void
  /** 进度回调 */
  onProgress?: (progress: number) => void
}

/**
 * useFFmpeg Hook
 * @param options 配置选项
 * @returns FFmpeg 状态和操作方法
 */
export function useFFmpeg(options: UseFFmpegOptions = {}): UseFFmpegReturn {
  const {
    autoLoad = false,
    multiThread = true,
    onLoad,
    onError,
    onProgress,
  } = options

  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)
  const [client, setClient] = useState<FFmpegClient | null>(null)
  const [isMultiThread, setIsMultiThread] = useState(false)
  const [sharedArrayBufferSupport, setSharedArrayBufferSupport] =
    useState<SharedArrayBufferSupport | null>(null)

  // 检测 SharedArrayBuffer 支持
  useEffect(() => {
    const support = FFmpegClient.checkSharedArrayBufferSupport()
    setSharedArrayBufferSupport(support)
  }, [])

  // 加载 FFmpeg
  const load = useCallback(
    async (loadOptions?: { multiThread?: boolean }) => {
      if (loaded || loading) {
        return
      }

      setLoading(true)
      setError(null)
      setProgress(0)

      try {
        const ffmpegClient = getFFmpegClient()
        setClient(ffmpegClient)

        const useMultiThread = loadOptions?.multiThread ?? multiThread

        await ffmpegClient.load({
          multiThread: useMultiThread,
          onProgress: (p) => {
            setProgress(p)
            onProgress?.(p)
          },
          onLog: ({ type, message }) => {
            // 只在开发环境输出日志
            if (process.env.NODE_ENV === 'development') {
              console.log(`[FFmpeg ${type}]`, message)
            }
          },
        })

        setLoaded(true)
        setIsMultiThread(ffmpegClient.isMultiThread())
        setProgress(1)
        onLoad?.()
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setLoading(false)
        onError?.(error)
        console.error('[useFFmpeg] 加载失败:', error)
      } finally {
        setLoading(false)
      }
    },
    [loaded, loading, multiThread, onLoad, onError, onProgress]
  )

  // 终止 FFmpeg
  const terminate = useCallback(async () => {
    if (client) {
      await client.terminate()
      setLoaded(false)
      setLoading(false)
      setProgress(0)
      setClient(null)
      setIsMultiThread(false)
    }
  }, [client])

  // 自动加载
  useEffect(() => {
    if (autoLoad && !loaded && !loading && !error) {
      load()
    }
  }, [autoLoad, loaded, loading, error, load])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 注意：这里不终止 FFmpeg，因为使用的是单例模式
      // 如果需要清理，请手动调用 terminate()
    }
  }, [])

  return {
    loaded,
    loading,
    error,
    progress,
    client,
    multiThread: isMultiThread,
    sharedArrayBufferSupport,
    load,
    terminate,
  }
}

/**
 * useFFmpegProgress Hook
 * 用于监听 FFmpeg 执行进度
 */
export function useFFmpegProgress(
  client: FFmpegClient | null,
  onProgress: (progress: FFmpegProgress) => void
) {
  useEffect(() => {
    if (!client) return

    client.onProgress(onProgress)
  }, [client, onProgress])
}
