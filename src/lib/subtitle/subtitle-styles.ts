export type SubtitleStyle = 'karaoke' | 'bounce' | 'gradient' | 'neon'

export type SubtitlePosition = 'bottom' | 'top' | 'center'

export interface SubtitleConfig {
  style: SubtitleStyle
  fontSize: number
  fontFamily: string
  primaryColor: string // hex
  secondaryColor: string // hex
  outlineColor: string
  shadowEnabled: boolean
  position: SubtitlePosition
}

export interface LyricWord {
  text: string
  startTime: number // milliseconds
  endTime: number
}

export interface LyricLine {
  id: string
  text: string
  startTime: number // milliseconds
  endTime: number
  words?: LyricWord[]
}

export const PRESET_STYLES: Record<SubtitleStyle, SubtitleConfig> = {
  karaoke: {
    style: 'karaoke',
    fontSize: 48,
    fontFamily: 'Inter, sans-serif',
    primaryColor: '#FFFFFF',
    secondaryColor: '#8B5CF6',
    outlineColor: '#000000',
    shadowEnabled: true,
    position: 'bottom'
  },
  bounce: {
    style: 'bounce',
    fontSize: 52,
    fontFamily: 'Arial Black, sans-serif',
    primaryColor: '#FFD700',
    secondaryColor: '#FF6B6B',
    outlineColor: '#1A1A1A',
    shadowEnabled: true,
    position: 'center'
  },
  gradient: {
    style: 'gradient',
    fontSize: 44,
    fontFamily: 'Helvetica, sans-serif',
    primaryColor: '#00D4FF',
    secondaryColor: '#9D4EDD',
    outlineColor: '#FFFFFF',
    shadowEnabled: false,
    position: 'bottom'
  },
  neon: {
    style: 'neon',
    fontSize: 50,
    fontFamily: 'Impact, sans-serif',
    primaryColor: '#00FF00',
    secondaryColor: '#FF00FF',
    outlineColor: '#000000',
    shadowEnabled: true,
    position: 'bottom'
  }
}

/**
 * Get the ASS alignment value for a subtitle position
 */
export function getASSAlignment(position: SubtitlePosition): number {
  const alignmentMap: Record<SubtitlePosition, number> = {
    bottom: 2, // Center bottom
    top: 8, // Center top
    center: 5 // Center middle
  }
  return alignmentMap[position]
}

/**
 * Get CSS position styles for a subtitle position
 */
export function getCSSPosition(position: SubtitlePosition): React.CSSProperties {
  const positionStyles: Record<SubtitlePosition, React.CSSProperties> = {
    bottom: {
      bottom: '10%',
      top: 'auto',
      transform: 'translateX(-50%)'
    },
    top: {
      top: '10%',
      bottom: 'auto',
      transform: 'translateX(-50%)'
    },
    center: {
      top: '50%',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)'
    }
  }
  return positionStyles[position]
}
