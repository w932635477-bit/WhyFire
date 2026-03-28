'use client'

import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Upload, X, File, Image, Video, AlertCircle, CheckCircle } from 'lucide-react'

// 上传文件类型
export interface UploadedFile {
  id: string
  file: File
  preview?: string
  type: 'video' | 'image'
  status: 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

// 文件类型配置
const FILE_CONFIGS = {
  video: {
    extensions: ['.mp4', '.mov'],
    maxSize: 100 * 1024 * 1024, // 100MB
    mimeTypes: ['video/mp4', 'video/quicktime'],
  },
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif'],
    maxSize: 20 * 1024 * 1024, // 20MB
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },
}

interface MediaUploaderProps {
  onUpload: (files: UploadedFile[]) => void
  maxVideoSize?: number // 默认 100MB
  maxImageSize?: number // 默认 20MB
  accept?: string[]
  multiple?: boolean
  className?: string
}

export function MediaUploader({
  onUpload,
  maxVideoSize = FILE_CONFIGS.video.maxSize,
  maxImageSize = FILE_CONFIGS.image.maxSize,
  accept = [...FILE_CONFIGS.video.extensions, ...FILE_CONFIGS.image.extensions],
  multiple = true,
  className,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 获取文件类型
  const getFileType = (file: File): 'video' | 'image' | null => {
    if (FILE_CONFIGS.video.mimeTypes.includes(file.type)) return 'video'
    if (FILE_CONFIGS.image.mimeTypes.includes(file.type)) return 'image'
    return null
  }

  // 验证文件
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const fileType = getFileType(file)

    if (!fileType) {
      return { valid: false, error: '不支持的文件格式，仅支持 mp4/mov/jpg/png/gif' }
    }

    const maxSize = fileType === 'video' ? maxVideoSize : maxImageSize
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024)
      return { valid: false, error: `文件过大，${fileType === 'video' ? '视频' : '图片'}最大支持 ${maxSizeMB}MB` }
    }

    return { valid: true }
  }

  // 生成预览
  const generatePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const fileType = getFileType(file)
      if (fileType === 'image') {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => resolve(undefined)
        reader.readAsDataURL(file)
      } else if (fileType === 'video') {
        const video = document.createElement('video')
        video.preload = 'metadata'

        // 设置超时，避免在测试环境中卡住
        const timeout = setTimeout(() => {
          resolve(undefined)
          URL.revokeObjectURL(video.src)
        }, 3000)

        video.onloadedmetadata = () => {
          video.currentTime = 1
        }
        video.onseeked = () => {
          clearTimeout(timeout)
          try {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth || 100
            canvas.height = video.videoHeight || 100
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/jpeg', 0.8))
          } catch {
            resolve(undefined)
          }
          URL.revokeObjectURL(video.src)
        }
        video.onerror = () => {
          clearTimeout(timeout)
          resolve(undefined)
        }
        video.src = URL.createObjectURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  // 模拟上传进度
  const simulateUpload = async (uploadedFile: UploadedFile): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, progress: 100, status: 'success' }
                : f
            )
          )
          resolve()
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, progress: Math.round(progress) }
                : f
            )
          )
        }
      }, 200)
    })
  }

  // 处理文件
  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList)
    const newFiles: UploadedFile[] = []

    for (const file of fileArray) {
      const validation = validateFile(file)
      const fileType = getFileType(file)
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const uploadedFile: UploadedFile = {
        id,
        file,
        type: fileType!,
        status: validation.valid ? 'uploading' : 'error',
        progress: 0,
        error: validation.error,
      }

      // 生成预览
      if (validation.valid) {
        uploadedFile.preview = await generatePreview(file)
      }

      newFiles.push(uploadedFile)
    }

    setFiles((prev) => [...prev, ...newFiles])

    // 模拟上传有效文件
    const validFiles = newFiles.filter((f) => f.status === 'uploading')
    await Promise.all(validFiles.map(simulateUpload))

    // 通知父组件
    const successFiles = validFiles.map((f) => ({
      ...f,
      status: 'success' as const,
      progress: 100,
    }))
    if (successFiles.length > 0) {
      onUpload(successFiles)
    }
  }, [maxVideoSize, maxImageSize, onUpload])

  // 删除文件
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // 拖拽事件
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }

  // 点击上传
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles)
    }
    // 重置 input 以便可以重复选择相同文件
    e.target.value = ''
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 拖拽上传区域 */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer',
          'bg-card hover:bg-card-hover',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(',')}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <div className={cn(
            'rounded-full p-4 transition-colors',
            isDragging ? 'bg-primary/20 text-primary' : 'bg-muted/20 text-muted'
          )}>
            <Upload className="h-8 w-8" />
          </div>

          <div>
            <p className="text-base font-medium text-foreground">
              {isDragging ? '松开鼠标上传文件' : '拖拽文件到这里，或点击上传'}
            </p>
            <p className="mt-1 text-sm text-muted">
              支持 mp4/mov/jpg/png/gif 格式，视频最大 100MB，图片最大 20MB
            </p>
          </div>
        </div>
      </div>

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg bg-card p-3 border border-border"
            >
              {/* 预览缩略图 */}
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {file.type === 'video' ? (
                      <Video className="h-6 w-6 text-muted" />
                    ) : (
                      <Image className="h-6 w-6 text-muted" />
                    )}
                  </div>
                )}

                {/* 类型标识 */}
                <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] text-white">
                  {file.type === 'video' ? '视频' : '图片'}
                </div>
              </div>

              {/* 文件信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.file.name}
                  </p>
                  {file.status === 'success' && (
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-success" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-error" />
                  )}
                </div>

                <p className="text-xs text-muted">
                  {formatFileSize(file.file.size)}
                </p>

                {/* 上传进度条 */}
                {file.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      上传中 {file.progress}%
                    </p>
                  </div>
                )}

                {/* 错误提示 */}
                {file.status === 'error' && file.error && (
                  <p className="mt-1 text-xs text-error">
                    {file.error}
                  </p>
                )}
              </div>

              {/* 删除按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(file.id)
                }}
                className="flex-shrink-0 rounded-full p-1.5 text-muted hover:bg-muted/20 hover:text-foreground transition-colors"
                title="删除"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
