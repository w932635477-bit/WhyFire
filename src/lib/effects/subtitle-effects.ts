/**
 * 字幕特效系统
 * 生成各种动态字幕效果的 ASS 标签
 */

import {
  SubtitleEffectType,
  SubtitleEffect,
  SubtitleEffectConfig,
  LyricLineWithWords,
} from './types'

/**
 * 格式化毫秒为 ASS 时间格式 (H:MM:SS.cc)
 */
function formatASSTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

/**
 * 格式化 hex 颜色为 ASS 格式 (&HBBGGRR&)
 */
function formatASSColor(hex: string): string {
  const cleanHex = hex.replace('#', '')
  const r = cleanHex.substring(0, 2)
  const g = cleanHex.substring(2, 4)
  const b = cleanHex.substring(4, 6)
  return `&H00${b}${g}${r}&`
}

/**
 * 默认字幕特效配置
 * 注意：FFmpeg.wasm 的 subtitles 滤镜需要：
 * 1. 字体文件必须存在于虚拟文件系统（/tmp 目录）
 * 2. ASS 文件中的 Fontname 必须与加载的字体匹配
 * 3. subtitles 滤镜必须使用 fontsdir 参数
 * 参考：https://github.com/ffmpegwasm/ffmpeg.wasm/issues/138
 */
export const DEFAULT_SUBTITLE_CONFIG: SubtitleEffectConfig = {
  primaryColor: '#FFFFFF',
  secondaryColor: '#8B5CF6',
  accentColor: '#FF6B6B',
  fontSize: 52,
  fontFamily: 'Noto Sans SC', // 与 video-synthesizer.ts 中的配置保持一致
  outlineColor: '#000000',
  outlineWidth: 3,
  shadowEnabled: true,
  animationSpeed: 1.0,
  effectIntensity: 1.0,
}

/**
 * 字幕特效预设配置
 */
export const SUBTITLE_EFFECTS: Record<SubtitleEffectType, SubtitleEffect> = {
  'karaoke-plus': {
    id: 'karaoke-plus',
    name: '增强卡拉OK',
    description: '逐字高亮配合光泽流动效果',
    icon: '🎤',
    suitableStyles: ['pop', 'rnb', 'melodic'],
    generateASSEffect: (line, config) => {
      if (!line.words || line.words.length === 0) {
        return `{\\kf${Math.floor((line.endTime - line.startTime) / 10)}}${line.text}`
      }

      const parts: string[] = []
      const lineStart = line.startTime
      const speed = config.animationSpeed || 1.0

      line.words.forEach((word, index) => {
        const duration = Math.floor((word.endTime - word.startTime) / 10 / speed)
        const delay = index === 0 ? 0 : Math.floor((word.startTime - lineStart) / 10 / speed)

        // 颜色从主色渐变到次色
        const progress = index / (line.words!.length - 1)
        const colorT = Math.floor(progress * 100)

        if (delay > 0) {
          parts.push(`{\\k${delay}}`)
        }
        // \kf 是平滑填充效果
        parts.push(`{\\kf${duration}\\t(\\1c${formatASSColor(config.secondaryColor)})}${word.text}`)
      })

      return parts.join('')
    },
  },

  'punch': {
    id: 'punch',
    name: '打击效果',
    description: '每个词带缩放冲击效果',
    icon: '💥',
    suitableStyles: ['trap', 'drill', 'hardcore'],
    generateASSEffect: (line, config) => {
      if (!line.words || line.words.length === 0) {
        const duration = line.endTime - line.startTime
        return `{\\fscx50\\fscy50\\t(100,\\fscx100\\fscy100)}${line.text}`
      }

      const parts: string[] = []
      const intensity = config.effectIntensity || 1.0
      const scaleMax = Math.floor(100 + 30 * intensity)

      line.words.forEach((word) => {
        const wordDuration = word.endTime - word.startTime
        const punchDuration = Math.min(80, wordDuration / 3)

        // 突然放大然后恢复
        parts.push(`{\\fscx50\\fscy50\\t(0,${punchDuration},\\fscx${scaleMax}\\fscy${scaleMax})\\t(${punchDuration},${punchDuration * 2},\\fscx100\\fscy100)}${word.text}`)
      })

      return parts.join('')
    },
  },

  'bounce-3d': {
    id: 'bounce-3d',
    name: '3D弹跳',
    description: '3D旋转弹跳效果',
    icon: '🔄',
    suitableStyles: ['melodic', 'pop', 'upbeat'],
    generateASSEffect: (line, config) => {
      const duration = line.endTime - line.startTime
      const intensity = config.effectIntensity || 1.0
      const rotation = 15 * intensity

      if (!line.words || line.words.length === 0) {
        return `{\\frx${rotation}\\t(\\frx0)\\fscy80\\t(\\fscy100)}${line.text}`
      }

      const parts: string[] = []

      line.words.forEach((word, index) => {
        const wordDuration = word.endTime - word.startTime
        const bounceDuration = Math.min(150, wordDuration / 2)

        // 3D 旋转 + Y 轴缩放弹跳
        const rotX = index % 2 === 0 ? rotation : -rotation
        parts.push(`{\\frx${rotX}\\t(0,${bounceDuration},\\frx0)\\fscy70\\t(0,${bounceDuration / 2},\\fscy110)\\t(${bounceDuration / 2},${bounceDuration},\\fscy100)}${word.text}`)
      })

      return parts.join('')
    },
  },

  'glitch-text': {
    id: 'glitch-text',
    name: '故障文字',
    description: '文字抖动配色彩分离效果',
    icon: '📺',
    suitableStyles: ['trap', 'cyberpunk', 'drill'],
    generateASSEffect: (line, config) => {
      const intensity = config.effectIntensity || 1.0
      const glitchAmount = 0.05 * intensity

      if (!line.words || line.words.length === 0) {
        // 整体文字的 Glitch 效果
        return `{\\fax${glitchAmount}\\t(50,\\fax${-glitchAmount})\\t(100,\\fax0)\\1c${formatASSColor(config.accentColor || '#FF0000')}\\t(80,\\1c${formatASSColor(config.primaryColor)})}${line.text}`
      }

      const parts: string[] = []

      line.words.forEach((word, index) => {
        const wordDuration = word.endTime - word.startTime
        const glitchDuration = Math.min(60, wordDuration / 4)

        // 随机化的抖动效果
        const shiftX = (index % 3 - 1) * glitchAmount

        // 色彩分离 + 位置抖动
        parts.push(`{\\fax${shiftX}\\t(0,${glitchDuration},\\fax${-shiftX})\\t(${glitchDuration},${glitchDuration * 2},\\fax0)\\1c${formatASSColor(config.accentColor || '#FF0000')}\\t(0,${glitchDuration},\\1c${formatASSColor(config.primaryColor)})}${word.text}`)
      })

      return parts.join('')
    },
  },

  'neon-pulse': {
    id: 'neon-pulse',
    name: '霓虹脉冲',
    description: '霓虹呼吸灯效果',
    icon: '✨',
    suitableStyles: ['night', 'vibe', 'chill'],
    generateASSEffect: (line, config) => {
      const intensity = config.effectIntensity || 1.0
      const maxBorder = Math.floor(6 + 4 * intensity)

      if (!line.words || line.words.length === 0) {
        const duration = line.endTime - line.startTime
        const pulseDuration = Math.min(400, duration / 3)
        return `{\\be1\\bord3\\3c${formatASSColor(config.secondaryColor)}\\t(0,${pulseDuration},\\bord${maxBorder}\\be3)\\t(${pulseDuration},${pulseDuration * 2},\\bord3\\be1)}${line.text}`
      }

      const parts: string[] = []

      line.words.forEach((word) => {
        const wordDuration = word.endTime - word.startTime
        const pulseDuration = Math.min(300, wordDuration / 2)

        // 霓虹边框脉冲效果
        parts.push(`{\\be1\\bord3\\3c${formatASSColor(config.secondaryColor)}\\t(0,${pulseDuration},\\bord${maxBorder}\\be3)\\t(${pulseDuration},${pulseDuration * 2},\\bord3\\be1)}${word.text}`)
      })

      return parts.join('')
    },
  },

  'wave': {
    id: 'wave',
    name: '波浪',
    description: '文字波浪起伏效果',
    icon: '🌊',
    suitableStyles: ['melodic', 'rnb', 'lofi'],
    generateASSEffect: (line, config) => {
      const intensity = config.effectIntensity || 1.0
      const waveHeight = Math.floor(10 * intensity)

      if (!line.words || line.words.length === 0) {
        return line.text
      }

      const parts: string[] = []

      line.words.forEach((word, index) => {
        const wordDuration = word.endTime - word.startTime
        const waveDuration = Math.min(200, wordDuration)

        // 每个词上下波浪
        const yOffset = (index % 2 === 0 ? waveHeight : -waveHeight)
        parts.push(`{\\pos(\\x,\\y)}${word.text}`)
      })

      // 简化版：使用缩放模拟波浪
      return line.words.map((word, index) => {
        const waveDuration = 150
        const scale = index % 2 === 0 ? 110 : 90
        return `{\\t(0,${waveDuration},\\fscx${scale}\\fscy${scale})\\t(${waveDuration},${waveDuration * 2},\\fscx100\\fscy100)}${word.text}`
      }).join('')
    },
  },

  'explosion': {
    id: 'explosion',
    name: '爆炸',
    description: '文字爆炸出现效果',
    icon: '💣',
    suitableStyles: ['hardcore', 'trap', 'drill'],
    generateASSEffect: (line, config) => {
      const intensity = config.effectIntensity || 1.0
      const explosionScale = Math.floor(150 + 50 * intensity)

      if (!line.words || line.words.length === 0) {
        const duration = line.endTime - line.startTime
        return `{\\fscx200\\fscy200\\alpha&HFF&\\t(0,100,\\alpha&H00&)\\t(100,200,\\fscx100\\fscy100)}${line.text}`
      }

      const parts: string[] = []

      line.words.forEach((word) => {
        const wordDuration = word.endTime - word.startTime
        const explosionDuration = Math.min(120, wordDuration / 2)

        // 从大+透明 -> 正常大小+不透明
        parts.push(`{\\fscx${explosionScale}\\fscy${explosionScale}\\alpha&HFF&\\t(0,${explosionDuration / 2},\\alpha&H00&)\\t(${explosionDuration / 2},${explosionDuration},\\fscx100\\fscy100)}${word.text}`)
      })

      return parts.join('')
    },
  },
}

/**
 * 获取字幕特效配置
 */
export function getSubtitleEffect(type: SubtitleEffectType): SubtitleEffect {
  return SUBTITLE_EFFECTS[type]
}

/**
 * 获取所有字幕特效列表
 */
export function getAllSubtitleEffects(): SubtitleEffect[] {
  return Object.values(SUBTITLE_EFFECTS)
}

/**
 * 生成完整的 ASS 字幕内容
 */
export function generateASSSubtitle(
  lyrics: LyricLineWithWords[],
  effectType: SubtitleEffectType,
  config: SubtitleEffectConfig = DEFAULT_SUBTITLE_CONFIG
): string {
  const effect = SUBTITLE_EFFECTS[effectType]
  const sections: string[] = []

  // Script Info
  sections.push('[Script Info]')
  sections.push('Title: WhyFire Generated Subtitles')
  sections.push('ScriptType: v4.00+')
  sections.push('PlayResX: 1920')
  sections.push('PlayResY: 1080')
  sections.push('WrapStyle: 0')
  sections.push('ScaledBorderAndShadow: yes')
  sections.push('YCbCr Matrix: TV.709')
  sections.push('')

  // Styles
  sections.push('[V4+ Styles]')
  sections.push('Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding')

  const primaryColor = formatASSColor(config.primaryColor)
  const secondaryColor = formatASSColor(config.secondaryColor)
  const outlineColor = formatASSColor(config.outlineColor)
  const shadow = config.shadowEnabled ? 2 : 0
  const fontName = config.fontFamily.split(',')[0].trim().replace(/['"]/g, '')

  sections.push(`Style: Default,${fontName},${config.fontSize},${primaryColor},${secondaryColor},${outlineColor},&H00000000,-1,0,0,0,100,100,0,0,1,${config.outlineWidth},${shadow},2,10,10,50,1`)
  sections.push('')

  // Events
  sections.push('[Events]')
  sections.push('Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text')

  lyrics.forEach((line, index) => {
    const startTime = formatASSTime(line.startTime)
    const endTime = formatASSTime(line.endTime)
    const text = effect.generateASSEffect(line, config)

    sections.push(`Dialogue: 0,${startTime},${endTime},Default,Line${index + 1},0,0,0,,${text}`)
  })

  return sections.join('\n')
}
