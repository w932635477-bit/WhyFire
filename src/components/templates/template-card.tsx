'use client'

import { motion } from 'framer-motion'
import { Play, Star, Crown, Clock } from 'lucide-react'
import type { VideoTemplate } from '@/types/templates'

interface TemplateCardProps {
  template: VideoTemplate
  onPreview: () => void
  onUse: () => void
}

export function TemplateCard({ template, onPreview, onUse }: TemplateCardProps) {
  return (
    <motion.div
      className="group relative rounded-xl overflow-hidden border border-border bg-card"
      whileHover={{ y: -4 }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={template.thumbnailUrl}
          alt={template.name}
          className="w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={onPreview}
            className="p-3 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors"
          >
            <Play className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={onUse}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/80 transition-colors"
          >
            Use Template
          </button>
        </div>

        {/* Premium Badge */}
        {template.premium && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded bg-yellow-500/90 text-xs font-medium text-black flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-xs text-white flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {template.duration}s
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold mb-1 truncate">{template.name}</h3>
        <p className="text-sm text-muted line-clamp-2 mb-2">{template.description}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span>{template.rating.toFixed(1)}</span>
          </div>
          <span className="text-muted">{template.useCount.toLocaleString()} uses</span>
        </div>
      </div>
    </motion.div>
  )
}
