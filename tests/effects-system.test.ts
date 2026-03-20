/**
 * 特效系统验证测试
 */

import { describe, it, expect } from 'vitest'
import {
  generateASSSubtitle,
  SUBTITLE_EFFECTS,
  DEFAULT_SUBTITLE_CONFIG,
  getAllSubtitleEffects,
} from '../src/lib/effects/subtitle-effects'
import {
  VIDEO_FILTERS,
  getAllVideoFilters,
  combineFilters,
} from '../src/lib/effects/video-filters'
import {
  EFFECT_PRESETS,
  getAllEffectPresets,
} from '../src/lib/effects/effect-presets'
import {
  EffectsConfigEngine,
  createEffectsEngine,
} from '../src/lib/effects/effects-config-engine'
import type { LyricLineWithWords } from '../src/lib/effects/types'

// 模拟歌词数据
const mockLyrics: LyricLineWithWords[] = [
  {
    id: 'line-0',
    text: 'Yo, this is a test',
    startTime: 0,
    endTime: 2000,
    words: [
      { text: 'Yo,', startTime: 0, endTime: 500 },
      { text: 'this', startTime: 500, endTime: 1000 },
      { text: 'is', startTime: 1000, endTime: 1200 },
      { text: 'a', startTime: 1200, endTime: 1400 },
      { text: 'test', startTime: 1400, endTime: 2000 },
    ],
  },
  {
    id: 'line-1',
    text: 'Rap video effects',
    startTime: 2000,
    endTime: 4000,
    words: [
      { text: 'Rap', startTime: 2000, endTime: 2500 },
      { text: 'video', startTime: 2500, endTime: 3000 },
      { text: 'effects', startTime: 3000, endTime: 4000 },
    ],
  },
]

describe('字幕特效系统', () => {
  it('应该有7种字幕特效', () => {
    const effects = getAllSubtitleEffects()
    expect(effects.length).toBe(7)
  })

  it('所有字幕特效都应有必要的属性', () => {
    const effects = getAllSubtitleEffects()
    effects.forEach(effect => {
      expect(effect.id).toBeDefined()
      expect(effect.name).toBeDefined()
      expect(effect.description).toBeDefined()
      expect(effect.icon).toBeDefined()
      expect(effect.generateASSEffect).toBeDefined()
    })
  })

  it('应该正确生成 ASS 字幕', () => {
    const assContent = generateASSSubtitle(mockLyrics, 'karaoke-plus', DEFAULT_SUBTITLE_CONFIG)

    expect(assContent).toContain('[Script Info]')
    expect(assContent).toContain('[V4+ Styles]')
    expect(assContent).toContain('[Events]')
    expect(assContent).toContain('Dialogue:')
  })

  it('punch 特效应该生成缩放动画', () => {
    const assContent = generateASSSubtitle(mockLyrics, 'punch', DEFAULT_SUBTITLE_CONFIG)
    // 检查是否包含缩放相关的 ASS 标签
    expect(assContent).toContain('\\fscx')
    expect(assContent).toContain('\\fscy')
  })

  it('glitch-text 特效应该生成故障效果', () => {
    const assContent = generateASSSubtitle(mockLyrics, 'glitch-text', DEFAULT_SUBTITLE_CONFIG)
    // 检查是否包含位置偏移相关标签
    expect(assContent).toContain('\\fax')
  })
})

describe('视频滤镜系统', () => {
  it('应该有17种视频滤镜', () => {
    const filters = getAllVideoFilters()
    expect(filters.length).toBe(17)
  })

  it('所有滤镜都应有必要的属性', () => {
    const filters = getAllVideoFilters()
    filters.forEach(filter => {
      expect(filter.id).toBeDefined()
      expect(filter.name).toBeDefined()
      expect(filter.description).toBeDefined()
      expect(filter.icon).toBeDefined()
    })
  })

  it('应该正确组合多个滤镜', () => {
    const filterChain = combineFilters(['glitch', 'shake'])
    expect(filterChain.length).toBeGreaterThan(0)
    expect(filterChain).toContain('rgbashift')
    expect(filterChain).toContain('crop')
  })

  it('none 滤镜应该返回空字符串', () => {
    const filterChain = combineFilters(['none'])
    expect(filterChain).toBe('')
  })

  it('glitch 滤镜应该包含 RGB 偏移', () => {
    const glitchFilter = VIDEO_FILTERS['glitch']
    expect(glitchFilter.ffmpegFilter).toContain('rgbashift')
  })
})

describe('特效预设系统', () => {
  it('应该有7种预设', () => {
    const presets = getAllEffectPresets()
    expect(presets.length).toBe(7)
  })

  it('所有预设都应有必要的属性', () => {
    const presets = getAllEffectPresets()
    presets.forEach(preset => {
      expect(preset.id).toBeDefined()
      expect(preset.name).toBeDefined()
      expect(preset.subtitleEffect).toBeDefined()
      expect(preset.videoFilter).toBeDefined()
    })
  })

  it('trap-king 预设应该使用 punch 字幕特效', () => {
    const preset = EFFECT_PRESETS['trap-king']
    expect(preset.subtitleEffect).toBe('punch')
    expect(preset.videoFilter).toBe('glitch')
  })
})

describe('特效配置引擎', () => {
  it('应该正确创建引擎', () => {
    const engine = createEffectsEngine()
    expect(engine).toBeInstanceOf(EffectsConfigEngine)
  })

  it('应该正确应用预设', () => {
    const engine = createEffectsEngine()
    engine.setPreset('cyber-night')

    const config = engine.getConfig()
    expect(config.preset).toBe('cyber-night')
    expect(config.subtitleEffect).toBe('neon-pulse')
    expect(config.videoFilter).toBe('cyberpunk')
  })

  it('应该正确渲染特效配置', () => {
    const engine = createEffectsEngine({ preset: 'trap-king' })
    const rendered = engine.render(mockLyrics)

    expect(rendered.assContent.length).toBeGreaterThan(0)
    expect(rendered.assContent).toContain('[Script Info]')
    expect(rendered.ffmpegFilterChain.length).toBeGreaterThan(0)
  })

  it('应该正确验证配置', () => {
    const engine = createEffectsEngine({ preset: 'old-school' })
    const validation = engine.validate()

    expect(validation.valid).toBe(true)
    expect(validation.errors.length).toBe(0)
  })

  it('获取预览信息应该正常工作', () => {
    const engine = createEffectsEngine({ preset: 'lofi-vibes' })
    const preview = engine.getPreviewInfo()

    expect(preview.presetName).toBe('Lofi Vibes')
    expect(preview.subtitleEffectName).toBeDefined()
    expect(preview.videoFilterName).toBeDefined()
  })
})
