'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Film, Plus } from 'lucide-react'
import { VideoGridProps } from '@/types/video'
import { VideoCard } from './video-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function VideoGrid({
  videos,
  loading,
  hasMore,
  onLoadMore,
  onDelete,
  onDownload,
}: VideoGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  // Loading skeleton
  if (loading && videos.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[var(--color-card)] rounded-lg overflow-hidden border border-[var(--color-border)]"
          >
            <div className="aspect-video bg-[var(--color-background)] animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-[var(--color-background)] rounded animate-pulse w-3/4" />
              <div className="h-3 bg-[var(--color-background)] rounded animate-pulse w-1/2" />
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!loading && videos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 px-4"
      >
        <div className="w-24 h-24 rounded-full bg-[var(--color-card)] flex items-center justify-center mb-6">
          <Film className="w-12 h-12 text-[var(--color-muted)]" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">还没有作品</h2>
        <p className="text-[var(--color-muted)] text-center mb-6 max-w-md">
          开始创作你的第一个 AI Rap 视频吧！只需几步，即可生成专业级创意短视频。
        </p>
        <Link href="/create">
          <Button
            size="lg"
            className="btn-cta"
          >
            <Plus className="w-5 h-5 mr-2" />
            开始创作
          </Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <div>
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <VideoCard
              video={video}
              onDelete={onDelete}
              onDownload={onDownload}
            />
          </motion.div>
        ))}
      </div>

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-8">
          {loading && (
            <div className="flex items-center gap-2 text-[var(--color-muted)]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>加载中...</span>
            </div>
          )}
        </div>
      )}

      {/* End of List */}
      {!hasMore && videos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-[var(--color-muted)]"
        >
          已显示全部 {videos.length} 个作品
        </motion.div>
      )}
    </div>
  )
}
