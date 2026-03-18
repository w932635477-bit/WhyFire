'use client'

import React, { useMemo, useCallback, useEffect, useState } from 'react'
import {
  SubtitleConfig,
  LyricLine,
  SubtitleStyle,
  PRESET_STYLES,
  getCSSPosition
} from '@/lib/subtitle/subtitle-styles'

interface SubtitlePreviewProps {
  lyrics: LyricLine[]
  config: SubtitleConfig
  currentTime: number // Current playback time in milliseconds
  onConfigChange?: (config: SubtitleConfig) => void
  className?: string
}

/**
 * Get the active lyric line at current time
 */
function getActiveLine(lyrics: LyricLine[], currentTime: number): LyricLine | null {
  return lyrics.find(
    line => currentTime >= line.startTime && currentTime <= line.endTime
  ) || null
}

/**
 * Get word highlighting progress for karaoke style
 */
function getWordProgress(line: LyricLine, currentTime: number): Map<string, number> {
  const progress = new Map<string, number>()

  if (!line.words) {
    return progress
  }

  line.words.forEach(word => {
    if (currentTime < word.startTime) {
      progress.set(word.text, 0)
    } else if (currentTime >= word.endTime) {
      progress.set(word.text, 1)
    } else {
      const wordDuration = word.endTime - word.startTime
      const elapsed = currentTime - word.startTime
      progress.set(word.text, elapsed / wordDuration)
    }
  })

  return progress
}

/**
 * Get inline styles for the subtitle container
 */
function getContainerStyles(config: SubtitleConfig): React.CSSProperties {
  const positionStyles = getCSSPosition(config.position)

  return {
    position: 'absolute',
    left: '50%',
    textAlign: 'center',
    padding: '10px 20px',
    borderRadius: '8px',
    ...positionStyles
  }
}

/**
 * Get text styles based on config
 */
function getTextStyles(config: SubtitleConfig): React.CSSProperties {
  const baseStyles: React.CSSProperties = {
    fontSize: `${config.fontSize}px`,
    fontFamily: config.fontFamily,
    fontWeight: config.style === 'bounce' ? 'bold' : 'normal',
    lineHeight: 1.4,
    margin: 0,
    textShadow: config.shadowEnabled
      ? '2px 2px 4px rgba(0, 0, 0, 0.8)'
      : 'none'
  }

  switch (config.style) {
    case 'neon':
      return {
        ...baseStyles,
        color: config.primaryColor,
        textShadow: `
          0 0 5px ${config.primaryColor},
          0 0 10px ${config.primaryColor},
          0 0 20px ${config.primaryColor},
          0 0 40px ${config.secondaryColor}
        `
      }

    case 'gradient':
      return {
        ...baseStyles,
        background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }

    default:
      return {
        ...baseStyles,
        color: config.primaryColor
      }
  }
}

/**
 * Render karaoke style with word-by-word highlighting
 */
function KaraokeText({
  line,
  config,
  currentTime
}: {
  line: LyricLine
  config: SubtitleConfig
  currentTime: number
}) {
  const wordProgress = getWordProgress(line, currentTime)

  if (!line.words || line.words.length === 0) {
    return <span style={getTextStyles(config)}>{line.text}</span>
  }

  return (
    <span style={{ display: 'inline' }}>
      {line.words.map((word, index) => {
        const progress = wordProgress.get(word.text) || 0

        return (
          <span
            key={index}
            style={{
              position: 'relative',
              display: 'inline-block',
              fontSize: `${config.fontSize}px`,
              fontFamily: config.fontFamily
            }}
          >
            {/* Background (unhighlighted) text */}
            <span
              style={{
                ...getTextStyles(config),
                color: config.secondaryColor
              }}
            >
              {word.text}
            </span>
            {/* Foreground (highlighted) text with clip */}
            <span
              style={{
                ...getTextStyles(config),
                position: 'absolute',
                left: 0,
                top: 0,
                color: config.primaryColor,
                clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
                transition: 'clip-path 0.05s linear'
              }}
            >
              {word.text}
            </span>
          </span>
        )
      })}
    </span>
  )
}

/**
 * Render bounce style with animation
 */
function BounceText({
  line,
  config,
  currentTime
}: {
  line: LyricLine
  config: SubtitleConfig
  currentTime: number
}) {
  const [bounce, setBounce] = useState(false)
  const lineStart = line.startTime
  const lineDuration = line.endTime - line.startTime

  useEffect(() => {
    if (currentTime >= lineStart && currentTime <= line.endTime) {
      // Trigger bounce animation at certain intervals
      const interval = setInterval(() => {
        setBounce(prev => !prev)
      }, 300)

      return () => clearInterval(interval)
    }
  }, [currentTime, lineStart, line.endTime])

  const progress = Math.min(1, (currentTime - lineStart) / lineDuration)

  return (
    <span
      style={{
        ...getTextStyles(config),
        display: 'inline-block',
        transform: bounce ? 'scale(1.1)' : 'scale(1)',
        opacity: progress < 0.1 ? progress * 10 : (progress > 0.9 ? (1 - progress) * 10 : 1),
        transition: 'transform 0.15s ease-out, opacity 0.1s linear'
      }}
    >
      {line.text}
    </span>
  )
}

/**
 * Style selector component
 */
function StyleSelector({
  currentStyle,
  onStyleChange
}: {
  currentStyle: SubtitleStyle
  onStyleChange: (style: SubtitleStyle) => void
}) {
  const styles: SubtitleStyle[] = ['karaoke', 'bounce', 'gradient', 'neon']

  return (
    <div className="flex gap-2 flex-wrap">
      {styles.map(style => (
        <button
          key={style}
          onClick={() => onStyleChange(style)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            currentStyle === style
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {style.charAt(0).toUpperCase() + style.slice(1)}
        </button>
      ))}
    </div>
  )
}

/**
 * Config editor component
 */
function ConfigEditor({
  config,
  onChange
}: {
  config: SubtitleConfig
  onChange: (config: SubtitleConfig) => void
}) {
  const handleStyleChange = useCallback((style: SubtitleStyle) => {
    onChange({ ...PRESET_STYLES[style] })
  }, [onChange])

  const handleValueChange = useCallback((key: keyof SubtitleConfig, value: string | number | boolean) => {
    onChange({ ...config, [key]: value })
  }, [config, onChange])

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Preset Style
        </label>
        <StyleSelector
          currentStyle={config.style}
          onStyleChange={handleStyleChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Font Size
          </label>
          <input
            type="number"
            value={config.fontSize}
            onChange={(e) => handleValueChange('fontSize', parseInt(e.target.value))}
            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 text-sm"
            min={12}
            max={120}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Position
          </label>
          <select
            value={config.position}
            onChange={(e) => handleValueChange('position', e.target.value as 'bottom' | 'top' | 'center')}
            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 text-sm"
          >
            <option value="bottom">Bottom</option>
            <option value="center">Center</option>
            <option value="top">Top</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Primary Color
          </label>
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => handleValueChange('primaryColor', e.target.value)}
            className="w-full h-9 bg-gray-700 rounded-md cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Secondary Color
          </label>
          <input
            type="color"
            value={config.secondaryColor}
            onChange={(e) => handleValueChange('secondaryColor', e.target.value)}
            className="w-full h-9 bg-gray-700 rounded-md cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="shadowEnabled"
          checked={config.shadowEnabled}
          onChange={(e) => handleValueChange('shadowEnabled', e.target.checked)}
          className="w-4 h-4 rounded bg-gray-700 border-gray-600"
        />
        <label htmlFor="shadowEnabled" className="text-sm text-gray-300">
          Enable Shadow
        </label>
      </div>
    </div>
  )
}

/**
 * Main subtitle preview component
 */
export function SubtitlePreview({
  lyrics,
  config,
  currentTime,
  onConfigChange,
  className = ''
}: SubtitlePreviewProps) {
  const activeLine = useMemo(
    () => getActiveLine(lyrics, currentTime),
    [lyrics, currentTime]
  )

  const handleConfigChange = useCallback((newConfig: SubtitleConfig) => {
    onConfigChange?.(newConfig)
  }, [onConfigChange])

  const renderStyledText = useCallback(() => {
    if (!activeLine) return null

    switch (config.style) {
      case 'karaoke':
        return (
          <KaraokeText
            line={activeLine}
            config={config}
            currentTime={currentTime}
          />
        )

      case 'bounce':
        return (
          <BounceText
            line={activeLine}
            config={config}
            currentTime={currentTime}
          />
        )

      case 'gradient':
      case 'neon':
      default:
        return (
          <span style={getTextStyles(config)}>
            {activeLine.text}
          </span>
        )
    }
  }, [activeLine, config, currentTime])

  return (
    <div className={`relative ${className}`}>
      {/* Preview area */}
      <div
        className="relative bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: '16/9', backgroundColor: '#1a1a2e' }}
      >
        {/* Video placeholder background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-600 text-sm">Video Preview Area</div>
        </div>

        {/* Subtitle overlay */}
        <div style={getContainerStyles(config)}>
          {activeLine && renderStyledText()}
        </div>

        {/* Time indicator */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 font-mono bg-black/50 px-2 py-1 rounded">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Config editor */}
      {onConfigChange && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Subtitle Settings
          </h3>
          <ConfigEditor config={config} onChange={handleConfigChange} />
        </div>
      )}

      {/* Lyrics overview */}
      <div className="mt-4 bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-300 mb-2">
          Lyrics Timeline
        </h3>
        <div className="space-y-1">
          {lyrics.map((line, index) => {
            const isActive = activeLine?.id === line.id
            return (
              <div
                key={line.id || index}
                className={`flex items-center gap-3 py-1 px-2 rounded ${
                  isActive ? 'bg-purple-600/30' : ''
                }`}
              >
                <span className="text-xs text-gray-500 font-mono w-24 shrink-0">
                  {formatTime(line.startTime)}
                </span>
                <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {line.text}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Format time in MM:SS format
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default SubtitlePreview
