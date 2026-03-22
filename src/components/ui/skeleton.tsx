'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'shimmer' | 'none'
}

/**
 * Skeleton 加载占位组件
 * 用于在内容加载时显示占位符
 */
export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton-shimmer',
    none: '',
  }

  return (
    <div
      className={cn(
        'bg-white/[0.06]',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  )
}

/**
 * 歌词卡片骨架屏
 */
export function LyricsSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="40%" height={16} />
          <Skeleton width="60%" height={12} />
        </div>
      </div>
      {/* Content */}
      <div className="space-y-3">
        <Skeleton height={14} className="w-full" />
        <Skeleton height={14} className="w-[90%]" />
        <Skeleton height={14} className="w-[95%]" />
        <Skeleton height={14} className="w-[85%]" />
        <Skeleton height={14} className="w-[92%]" />
        <Skeleton height={14} className="w-[78%]" />
      </div>
    </div>
  )
}

/**
 * Beat 列表骨架屏
 */
export function BeatListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <Skeleton variant="circular" width={36} height={36} />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={10} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 波形骨架屏
 */
export function WaveformSkeleton() {
  return (
    <div className="flex items-end justify-between h-24 gap-0.5">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-white/20 rounded-sm skeleton-shimmer"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
      ))}
    </div>
  )
}

/**
 * 卡片骨架屏
 */
export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton variant="rounded" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height={16} />
          <Skeleton width="100%" height={12} />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height={12} className="w-full" />
        <Skeleton height={12} className="w-[90%]" />
        <Skeleton height={12} className="w-[95%]" />
      </div>
    </div>
  )
}

/**
 * 方言网格骨架屏
 */
export function DialectGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]"
        >
          <Skeleton width="50%" height={18} className="mb-1" />
          <Skeleton width="30%" height={12} />
        </div>
      ))}
    </div>
  )
}

/**
 * 进度骨架屏
 */
export function ProgressSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1 flex items-center justify-between">
            <Skeleton width="30%" height={14} />
            <Skeleton width="15%" height={12} />
          </div>
        </div>
      ))}
    </div>
  )
}
