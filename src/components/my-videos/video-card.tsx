'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Trash2, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { VideoCardProps } from '@/types/video'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function VideoCard({ video, onDelete, onDownload }: VideoCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(video.id)
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    await onDownload(video)
    setIsDownloading(false)
  }

  const getStatusIcon = () => {
    switch (video.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusLabel = () => {
    switch (video.status) {
      case 'completed':
        return '已完成'
      case 'processing':
        return '处理中'
      case 'failed':
        return '失败'
      default:
        return ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group relative bg-[var(--color-card)] rounded-lg overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[var(--color-background)]">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
        />

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(video.duration)}
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          {getStatusIcon()}
          <span>{getStatusLabel()}</span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownload}
            disabled={isDownloading || video.status !== 'completed'}
            className="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-hover)]"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-[var(--color-foreground)] truncate mb-1">
          {video.title}
        </h3>
        <p className="text-sm text-[var(--color-muted)]">{formatDate(video.createdAt)}</p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--color-card)] rounded-lg p-6 max-w-sm w-full border border-[var(--color-border)]"
          >
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-[var(--color-muted)] mb-4">
              确定要删除视频 "{video.title}" 吗？此操作无法撤销。
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    删除中...
                  </>
                ) : (
                  '删除'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
