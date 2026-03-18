import {
  SubtitleConfig,
  LyricLine,
  LyricWord,
  PRESET_STYLES,
  SubtitleStyle,
  getASSAlignment
} from './subtitle-styles'

/**
 * Format milliseconds to ASS time format (H:MM:SS.cc)
 */
export function formatASSTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

/**
 * Format milliseconds to SRT time format (HH:MM:SS,mmm)
 */
export function formatSRTTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const milliseconds = ms % 1000

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`
}

/**
 * Convert hex color to ASS color format (&HBBGGRR&)
 */
export function formatASSColor(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '')

  // Parse RGB values
  const r = cleanHex.substring(0, 2)
  const g = cleanHex.substring(2, 4)
  const b = cleanHex.substring(4, 6)

  // Return in BGR order (ASS format)
  return `&H00${b}${g}${r}&`
}

/**
 * Parse LRC format lyrics with timestamps
 * Format: [00:00.00]Lyrics text
 */
export function parseLRC(lrcText: string): LyricLine[] {
  const lines: LyricLine[] = []
  const lineRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.+)/g

  let match
  let lineIndex = 0

  while ((match = lineRegex.exec(lrcText)) !== null) {
    const minutes = parseInt(match[1], 10)
    const seconds = parseInt(match[2], 10)
    const centiseconds = match[3].length === 2
      ? parseInt(match[3], 10) * 10
      : parseInt(match[3], 10)

    const startTime = (minutes * 60 + seconds) * 1000 + centiseconds
    const text = match[4].trim()

    if (text) {
      lines.push({
        id: `line-${lineIndex}`,
        text,
        startTime,
        endTime: startTime + 3000 // Default 3 seconds duration
      })
      lineIndex++
    }
  }

  // Calculate end times based on next line's start time
  for (let i = 0; i < lines.length - 1; i++) {
    lines[i].endTime = lines[i + 1].startTime
  }

  return lines
}

/**
 * Parse JSON lyrics format
 */
export function parseJSONLyrics(jsonData: LyricLine[]): LyricLine[] {
  return jsonData.map((line, index) => ({
    id: line.id || `line-${index}`,
    text: line.text,
    startTime: line.startTime,
    endTime: line.endTime,
    words: line.words
  }))
}

/**
 * Parse plain text lyrics with estimated timing
 */
export function parsePlainText(text: string, startOffset: number = 0, lineDuration: number = 3000): LyricLine[] {
  const textLines = text.split('\n').filter(line => line.trim())

  return textLines.map((line, index) => ({
    id: `line-${index}`,
    text: line.trim(),
    startTime: startOffset + index * lineDuration,
    endTime: startOffset + (index + 1) * lineDuration
  }))
}

/**
 * Main Subtitle Renderer class
 */
export class SubtitleRenderer {
  private config: SubtitleConfig

  constructor(config: SubtitleConfig | SubtitleStyle = 'karaoke') {
    if (typeof config === 'string') {
      this.config = PRESET_STYLES[config]
    } else {
      this.config = config
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SubtitleConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<SubtitleConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Parse lyrics text into structured data
   * Supports LRC format, JSON, or plain text
   */
  parseLyrics(lyricsText: string, format: 'lrc' | 'json' | 'plain' = 'lrc'): LyricLine[] {
    switch (format) {
      case 'lrc':
        return parseLRC(lyricsText)
      case 'json':
        try {
          const data = JSON.parse(lyricsText)
          return parseJSONLyrics(data)
        } catch {
          console.error('Failed to parse JSON lyrics')
          return []
        }
      case 'plain':
        return parsePlainText(lyricsText)
      default:
        return parseLRC(lyricsText)
    }
  }

  /**
   * Generate SRT format subtitle
   */
  generateSRT(lines: LyricLine[]): string {
    const srtLines: string[] = []

    lines.forEach((line, index) => {
      const startTime = formatSRTTime(line.startTime)
      const endTime = formatSRTTime(line.endTime)

      srtLines.push(`${index + 1}`)
      srtLines.push(`${startTime} --> ${endTime}`)
      srtLines.push(line.text)
      srtLines.push('') // Empty line between entries
    })

    return srtLines.join('\n')
  }

  /**
   * Generate ASS/SSA format subtitle with styles
   */
  generateASS(lines: LyricLine[]): string {
    const sections: string[] = []

    // Script Info section
    sections.push('[Script Info]')
    sections.push('Title: WhyFire Generated Subtitles')
    sections.push('ScriptType: v4.00+')
    sections.push('PlayResX: 1920')
    sections.push('PlayResY: 1080')
    sections.push('WrapStyle: 0')
    sections.push('ScaledBorderAndShadow: yes')
    sections.push('YCbCr Matrix: TV.709')
    sections.push('')

    // Styles section
    sections.push('[V4+ Styles]')
    sections.push('Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding')

    const primaryColor = formatASSColor(this.config.primaryColor)
    const secondaryColor = formatASSColor(this.config.secondaryColor)
    const outlineColor = formatASSColor(this.config.outlineColor)
    const backColor = '&H00000000&'
    const alignment = getASSAlignment(this.config.position)
    const shadow = this.config.shadowEnabled ? 2 : 0

    // Extract font family name (remove fallbacks)
    const fontName = this.config.fontFamily.split(',')[0].trim().replace(/['"]/g, '')

    sections.push(`Style: Default,${fontName},${this.config.fontSize},${primaryColor},${secondaryColor},${outlineColor},${backColor},0,0,0,0,100,100,0,0,1,2,${shadow},${alignment},10,10,10,1`)

    // Add karaoke style if needed
    if (this.config.style === 'karaoke') {
      sections.push(`Style: Karaoke,${fontName},${this.config.fontSize},${primaryColor},${secondaryColor},${outlineColor},${backColor},1,0,0,0,100,100,0,0,1,2,${shadow},${alignment},10,10,10,1`)
    }

    sections.push('')

    // Events section
    sections.push('[Events]')
    sections.push('Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text')

    lines.forEach((line, index) => {
      const startTime = formatASSTime(line.startTime)
      const endTime = formatASSTime(line.endTime)

      // Apply style-specific effects
      let text = this.applyStyleEffects(line)

      const styleName = this.config.style === 'karaoke' ? 'Karaoke' : 'Default'
      sections.push(`Dialogue: 0,${startTime},${endTime},${styleName},Line${index + 1},0,0,0,,${text}`)
    })

    return sections.join('\n')
  }

  /**
   * Apply style-specific effects to text
   */
  private applyStyleEffects(line: LyricLine): string {
    switch (this.config.style) {
      case 'karaoke':
        return this.applyKaraokeEffect(line)
      case 'bounce':
        return this.applyBounceEffect(line)
      case 'gradient':
        return this.applyGradientEffect(line)
      case 'neon':
        return this.applyNeonEffect(line)
      default:
        return line.text
    }
  }

  /**
   * Apply karaoke effect (word-by-word highlighting)
   */
  private applyKaraokeEffect(line: LyricLine): string {
    if (!line.words || line.words.length === 0) {
      // No word timing, apply simple text
      return line.text
    }

    const parts: string[] = []
    const lineStart = line.startTime

    line.words.forEach(word => {
      const duration = word.endTime - word.startTime
      const delay = Math.max(0, word.startTime - lineStart)

      // \k effect with timing
      if (delay > 0) {
        parts.push(`{\\k${Math.floor(delay / 10)}}`)
      }
      parts.push(`{\\kf${Math.floor(duration / 10)}}${word.text}`)
    })

    return parts.join('')
  }

  /**
   * Apply bounce effect
   */
  private applyBounceEffect(line: LyricLine): string {
    // Add fad (fade in/out) and move animation
    const duration = line.endTime - line.startTime
    const fadeIn = Math.min(200, duration / 4)
    const fadeOut = Math.min(200, duration / 4)

    return `{\\fad(${fadeIn},${fadeOut})\\t(\\fscx110\\fscy110)\\t(\\fscx100\\fscy100)}${line.text}`
  }

  /**
   * Apply gradient effect
   */
  private applyGradientEffect(line: LyricLine): string {
    // Use primary and secondary colors for gradient-like effect
    const duration = line.endTime - line.startTime

    // Color transition effect
    return `{\\1c&H00FFFFFF&\\t(${duration},\\1c${formatASSColor(this.config.secondaryColor)})}${line.text}`
  }

  /**
   * Apply neon glow effect
   */
  private applyNeonEffect(line: LyricLine): string {
    // Create pulsing glow effect with border size animation
    const duration = line.endTime - line.startTime
    const pulseDuration = Math.min(500, duration / 4)

    // Pulse between border sizes
    return `{\\be1\\bord3\\t(${pulseDuration},\\bord6)\\t(${pulseDuration * 2},\\bord3)}${line.text}`
  }

  /**
   * Export subtitle in specified format
   */
  export(lines: LyricLine[], format: 'srt' | 'ass' = 'srt'): string {
    switch (format) {
      case 'srt':
        return this.generateSRT(lines)
      case 'ass':
        return this.generateASS(lines)
      default:
        return this.generateSRT(lines)
    }
  }
}

/**
 * Create a subtitle renderer with preset style
 */
export function createRenderer(style: SubtitleStyle): SubtitleRenderer {
  return new SubtitleRenderer(style)
}

/**
 * Generate WebVTT format subtitle (for web playback)
 */
export function generateVTT(lines: LyricLine[]): string {
  const vttLines: string[] = ['WEBVTT', '']

  lines.forEach((line, index) => {
    const startTime = formatSRTTime(line.startTime).replace(',', '.')
    const endTime = formatSRTTime(line.endTime).replace(',', '.')

    vttLines.push(`${index + 1}`)
    vttLines.push(`${startTime} --> ${endTime}`)
    vttLines.push(line.text)
    vttLines.push('')
  })

  return vttLines.join('\n')
}
