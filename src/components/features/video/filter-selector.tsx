'use client'

import { motion } from 'framer-motion'
import { VIDEO_FILTERS, type FilterType } from '@/lib/ffmpeg/filters'
import { cn } from '@/lib/utils'

interface FilterSelectorProps {
  /** 当前选中的滤镜 */
  selected: FilterType
  /** 滤镜选择回调 */
  onSelect: (filter: FilterType) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 滤镜选择器组件
 * 用于选择视频滤镜效果
 */
export function FilterSelector({
  selected,
  onSelect,
  disabled = false,
  className,
}: FilterSelectorProps) {
  const filters = Object.values(VIDEO_FILTERS)

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {filters.map((filter) => {
          const isSelected = selected === filter.id

          return (
            <motion.button
              key={filter.id}
              onClick={() => !disabled && onSelect(filter.id)}
              disabled={disabled}
              className={cn(
                'relative rounded-xl p-4 border-2 transition-all text-left',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                disabled && 'opacity-50 cursor-not-allowed',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
              )}
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.98 }}
              aria-pressed={isSelected}
              aria-label={`选择滤镜: ${filter.name}`}
            >
              {/* 滤镜图标 */}
              <div className="text-3xl mb-2" role="img" aria-hidden="true">
                {filter.icon}
              </div>

              {/* 滤镜名称 */}
              <div className="font-medium text-sm">{filter.name}</div>

              {/* 滤镜描述 */}
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {filter.description}
              </div>

              {/* 选中指示器 */}
              {isSelected && (
                <motion.div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  aria-hidden="true"
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 紧凑型滤镜选择器
 * 适用于空间受限的场景
 */
export function FilterSelectorCompact({
  selected,
  onSelect,
  disabled = false,
  className,
}: FilterSelectorProps) {
  const filters = Object.values(VIDEO_FILTERS)

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isSelected = selected === filter.id

          return (
            <motion.button
              key={filter.id}
              onClick={() => !disabled && onSelect(filter.id)}
              disabled={disabled}
              className={cn(
                'relative rounded-lg px-3 py-2 border transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                disabled && 'opacity-50 cursor-not-allowed',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card hover:border-primary/50'
              )}
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.98 }}
              aria-pressed={isSelected}
              aria-label={`选择滤镜: ${filter.name}`}
            >
              <span className="flex items-center gap-2">
                <span role="img" aria-hidden="true">
                  {filter.icon}
                </span>
                <span className="text-sm font-medium">{filter.name}</span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 滤镜预览卡片
 * 带有预览图的滤镜选择
 */
export function FilterPreviewCard({
  filter,
  isSelected,
  onSelect,
  disabled = false,
}: {
  filter: (typeof VIDEO_FILTERS)[FilterType]
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      className={cn(
        'relative rounded-xl overflow-hidden border-2 transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50'
      )}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      aria-pressed={isSelected}
      aria-label={`选择滤镜: ${filter.name}`}
    >
      {/* 预览区域 */}
      <div className="aspect-video bg-muted relative">
        {filter.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={filter.preview}
            alt={`${filter.name} 预览`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {filter.icon}
          </div>
        )}

        {/* 选中遮罩 */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              ✓
            </div>
          </div>
        )}
      </div>

      {/* 信息区域 */}
      <div className="p-3 bg-card">
        <div className="font-medium text-sm">{filter.name}</div>
        <div className="text-xs text-muted-foreground mt-1">{filter.description}</div>
      </div>
    </motion.button>
  )
}

export default FilterSelector
