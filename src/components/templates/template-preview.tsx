'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Check } from 'lucide-react'
import { useState, useRef } from 'react'
import type { VideoTemplate } from '@/types/templates'

interface TemplatePreviewProps {
  template: VideoTemplate
  onClose: () => void
  onUse: () => void
}

export function TemplatePreview({ template, onClose, onUse }: TemplatePreviewProps) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-card rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Video */}
          <div className="relative aspect-video bg-black">
            {template.previewVideoUrl ? (
              <video
                ref={videoRef}
                src={template.previewVideoUrl}
                className="w-full h-full"
                loop
                playsInline
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            ) : (
              <img
                src={template.thumbnailUrl}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            )}

            {/* Play Button */}
            {template.previewVideoUrl && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                {playing ? (
                  <Pause className="w-16 h-16 text-white" />
                ) : (
                  <Play className="w-16 h-16 text-white" />
                )}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">{template.name}</h2>
            <p className="text-muted mb-4">{template.description}</p>

            {/* Template Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted">Duration:</span>
                <span className="font-medium">{template.duration}s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted">Aspect Ratio:</span>
                <span className="font-medium">{template.aspectRatio}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted">Style:</span>
                <span className="font-medium capitalize">{template.style}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted">Category:</span>
                <span className="font-medium capitalize">{template.category}</span>
              </div>
            </div>

            {/* Customizable Fields */}
            {template.customizableFields.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">Customizable Content:</h4>
                <div className="flex flex-wrap gap-2">
                  {template.customizableFields.map((field) => (
                    <span
                      key={field.key}
                      className="px-3 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/30"
                    >
                      {field.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg border border-border hover:bg-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onUse}
                className="px-6 py-3 rounded-lg btn-cta text-white font-medium flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Use This Template
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
