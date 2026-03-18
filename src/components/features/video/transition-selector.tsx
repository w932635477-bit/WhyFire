'use client'

import { motion } from 'framer-motion'
import { VIDEO_TRANSITIONS, type TransitionType } from '@/lib/ffmpeg/transitions'
import { cn } from '@/lib/utils'

interface TransitionSelectorProps {
  selected: TransitionType
  onSelect: (transition: TransitionType) => void
  duration?: number
  onDurationChange?: (duration: number) => void
}

export function TransitionSelector({
  selected,
  onSelect,
  duration = 0.5,
  onDurationChange
}: TransitionSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Object.values(VIDEO_TRANSITIONS).map((transition) => (
          <motion.button
            key={transition.id}
            onClick={() => onSelect(transition.id)}
            className={cn(
              'relative rounded-xl p-3 border-2 transition-all',
              selected === transition.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-2xl mb-1">{transition.icon}</div>
            <div className="font-medium text-sm">{transition.name}</div>
          </motion.button>
        ))}
      </div>

      {selected !== 'none' && (
        <div className="flex items-center gap-4">
          <label className="text-sm text-muted">转场时长:</label>
          <input
            type="range"
            min="0.2"
            max="2"
            step="0.1"
            value={duration}
            onChange={(e) => onDurationChange?.(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm w-12">{duration}s</span>
        </div>
      )}
    </div>
  )
}
