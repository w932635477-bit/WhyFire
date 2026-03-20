'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * 视频文件信息
 */
export interface VideoFileInfo {
  file: File
  url: string
  duration: number
  width: number
  height: number
  thumbnail: string
  size: number
}

/**
 * 视频上传区域 Props
 */
export interface VideoUploadZoneProps {
  /** 上传回调 */
  onUpload: (info: VideoFileInfo) => void
  /** 最大文件大小 (bytes) */
  maxSize?: number
  /** 支持的格式 */
  acceptFormats?: string[]
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * 格式化时长
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * 从视频文件提取元数据
 */
async function extractVideoMetadata(file: File): Promise<{
  duration: number
  width: number
  height: number
  thumbnail: string
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      const duration = video.duration
      const width = video.videoWidth
      const height = video.videoHeight

      // 生成缩略图
      video.currentTime = Math.min(1, duration * 0.1) // 取10%处或1秒
    }

    video.onseeked = () => {
      // 创建 canvas 截取缩略图
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // 限制缩略图尺寸
      const maxWidth = 320
      const maxHeight = 180
      let thumbWidth = video.videoWidth
      let thumbHeight = video.videoHeight

      if (thumbWidth > maxWidth) {
        thumbHeight = (thumbHeight * maxWidth) / thumbWidth
        thumbWidth = maxWidth
      }
      if (thumbHeight > maxHeight) {
        thumbWidth = (thumbWidth * maxHeight) / thumbHeight
        thumbHeight = maxHeight
      }

      canvas.width = thumbWidth
      canvas.height = thumbHeight

      ctx?.drawImage(video, 0, 0, thumbWidth, thumbHeight)
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7)

      URL.revokeObjectURL(url)

      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        thumbnail,
      })
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法读取视频文件'))
    }

    video.src = url
    video.load()
  })
}

/**
 * 视频拖拽上传组件
 */
export function VideoUploadZone({
  onUpload,
  maxSize = 200 * 1024 * 1024, // 默认 200MB
  acceptFormats = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
  disabled = false,
  className = '',
}: VideoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewInfo, setPreviewInfo] = useState<VideoFileInfo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * 处理文件验证和上传
   */
  const processFile = useCallback(async (file: File) => {
    setError(null)
    setIsProcessing(true)

    try {
      // 验证文件类型
      if (!acceptFormats.includes(file.type)) {
        throw new Error(`不支持的文件格式: ${file.type}`)
      }

      // 验证文件大小
      if (file.size > maxSize) {
        throw new Error(`文件过大，最大支持 ${formatFileSize(maxSize)}`)
      }

      // 提取视频元数据
      const metadata = await extractVideoMetadata(file)

      // 验证视频时长 (最长 5 分钟)
      if (metadata.duration > 300) {
        throw new Error('视频时长不能超过 5 分钟')
      }

      const info: VideoFileInfo = {
        file,
        url: URL.createObjectURL(file),
        ...metadata,
        size: file.size,
      }

      setPreviewInfo(info)
      onUpload(info)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
      setPreviewInfo(null)
    } finally {
      setIsProcessing(false)
    }
  }, [acceptFormats, maxSize, onUpload])

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  /**
   * 处理文件放下
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [disabled, processFile])

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  /**
   * 点击触发文件选择
   */
  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }, [disabled])

  /**
   * 清除预览
   */
  const handleClear = useCallback(() => {
    if (previewInfo) {
      URL.revokeObjectURL(previewInfo.url)
    }
    setPreviewInfo(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [previewInfo])

  return (
    <div className={`w-full ${className}`}>
      <AnimatePresence mode="wait">
        {previewInfo ? (
          // 预览状态
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden"
          >
            {/* 视频预览 */}
            <div className="aspect-video relative bg-black">
              <video
                src={previewInfo.url}
                className="w-full h-full object-contain"
                controls
              />
            </div>

            {/* 文件信息 */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center">
                  <span className="text-lg">📹</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium truncate max-w-[200px]">
                    {previewInfo.file.name}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {formatFileSize(previewInfo.size)} • {formatDuration(previewInfo.duration)} • {previewInfo.width}x{previewInfo.height}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        ) : (
          // 上传区域
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onClick={handleClick}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-8
                transition-all duration-200 cursor-pointer
                ${isDragging
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-white/10 hover:border-violet-500/50 hover:bg-white/[0.02]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* 隐藏的文件输入 */}
              <input
                ref={inputRef}
                type="file"
                accept={acceptFormats.join(',')}
                onChange={handleFileSelect}
                disabled={disabled}
                className="hidden"
              />

              {/* 内容区 */}
              <div className="flex flex-col items-center text-center">
                {isProcessing ? (
                  <>
                    <div className="w-12 h-12 mb-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    <p className="text-white font-medium">正在处理视频...</p>
                    <p className="text-zinc-500 text-sm mt-1">请稍候</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-pink-500/20 flex items-center justify-center">
                      <span className="text-3xl">📹</span>
                    </div>
                    <p className="text-white font-medium mb-1">
                      {isDragging ? '松开以上传视频' : '添加视频素材'}
                    </p>
                    <p className="text-zinc-500 text-sm">
                      拖拽视频文件或点击选择
                    </p>
                    <p className="text-zinc-600 text-xs mt-2">
                      支持 MP4, MOV, WebM • 最大 {formatFileSize(maxSize)} • 最长 5 分钟
                    </p>
                    <p className="text-zinc-600 text-xs mt-1">
                      💡 原视频音频将被替换为生成的 Rap 音乐
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default VideoUploadZone
