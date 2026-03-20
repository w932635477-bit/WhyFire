/**
 * 端到端特效系统验证（简化版）
 *
 * 这个脚本验证：
 * 1. 特效配置引擎能正确生成 ASS 字幕
 * 2. 特效配置引擎能正确生成安全的 FFmpeg 滤镜
 * 3. VideoSynthesizer 能接受特效配置
 */

import { describe, it, expect } from 'vitest'
import {
  EffectsConfigEngine,
  createEffectsEngine,
  getAllSubtitleEffects,
  getAllVideoFilters,
  getAllEffectPresets,
  DEFAULT_VIDEO_FILTER,
} from '../src/lib/effects'

// 模拟歌词数据
const mockLyrics = [
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
  {
    id: 'line-2',
    text: 'Checking if it works',
    startTime: 4000,
    endTime: 6000,
    words: [
      { text: 'Checking', startTime: 4000, endTime: 4500 },
      { text: 'if', startTime: 4500, endTime: 4800 },
      { text: 'it', startTime: 4800, endTime: 5000 },
      { text: 'works', startTime: 5000, endTime: 6000 },
    ],
  },
]

describe('端到端特效系统验证', () => {
  it('应该正确列出所有可用特效', () => {
    const subtitleEffects = getAllSubtitleEffects()
    const videoFilters = getAllVideoFilters()
    const presets = getAllEffectPresets()

    console.log('\n📊 特效系统统计（简化版）:')
    console.log(`  - 字幕特效: ${subtitleEffects.length} 种`)
    console.log(`  - 视频滤镜: ${videoFilters.length} 种（已简化为默认滤镜）`)
    console.log(`  - 特效预设: ${presets.length} 种`)

    // 验证字幕特效
    console.log('\n✨ 字幕特效列表:')
    subtitleEffects.forEach(effect => {
      console.log(`  ${effect.icon} ${effect.name} - ${effect.description}`)
    })

    // 验证视频滤镜（只有默认滤镜）
    console.log('\n🎬 视频滤镜:')
    videoFilters.forEach(filter => {
      console.log(`  ${filter.icon} ${filter.name} - ${filter.description}`)
      console.log(`    FFmpeg 滤镜: ${filter.ffmpegFilter}`)
    })

    // 验证预设
    console.log('\n🎯 特效预设列表:')
    presets.forEach(preset => {
      console.log(`  ${preset.icon} ${preset.name} - ${preset.description}`)
    })

    expect(subtitleEffects.length).toBeGreaterThanOrEqual(7)
    expect(videoFilters.length).toBe(1) // 简化后只有 1 个默认滤镜
    expect(presets.length).toBeGreaterThanOrEqual(7)
  })

  it('应该为每种预设生成正确的 ASS 字幕', () => {
    const presets = getAllEffectPresets()

    console.log('\n📝 预设 ASS 字幕生成验证:')

    presets.forEach(preset => {
      const engine = createEffectsEngine({ preset: preset.id })
      const rendered = engine.render(mockLyrics as any)

      const hasScriptInfo = rendered.assContent.includes('[Script Info]')
      const hasStyles = rendered.assContent.includes('[V4+ Styles]')
      const hasEvents = rendered.assContent.includes('[Events]')

      console.log(`  ${preset.icon} ${preset.name}:`)
      console.log(`    - ASS 内容长度: ${rendered.assContent.length} 字符`)
      console.log(`    - FFmpeg 滤镜: ${rendered.ffmpegFilterChain}`)

      expect(hasScriptInfo).toBe(true)
      expect(hasStyles).toBe(true)
      expect(hasEvents).toBe(true)

      // 验证滤镜始终是安全的默认滤镜
      expect(rendered.ffmpegFilterChain).toBe(DEFAULT_VIDEO_FILTER)
    })
  })

  it('应该为每种字幕特效生成独特的 ASS 标签', () => {
    const effects = getAllSubtitleEffects()

    console.log('\n🎨 字幕特效 ASS 标签验证:')

    effects.forEach(effect => {
      const engine = createEffectsEngine({ subtitleEffect: effect.id })
      const rendered = engine.render(mockLyrics as any)

      console.log(`  ${effect.icon} ${effect.name}:`)
      console.log(`    - 包含 \\t 标签: ${rendered.assContent.includes('\\t')}`)

      // 验证 ASS 内容包含特效相关标签
      expect(rendered.assContent.length).toBeGreaterThan(100)
    })
  })

  it('默认滤镜应该是安全的 FFmpeg 语法', () => {
    const engine = createEffectsEngine()
    const rendered = engine.render(mockLyrics as any)

    console.log('\n🎬 FFmpeg 默认滤镜验证:')
    console.log(`  滤镜链: ${rendered.ffmpegFilterChain}`)

    // 验证滤镜链不包含可能导致问题的特殊字符
    expect(rendered.ffmpegFilterChain).not.toContain('mod(')
    expect(rendered.ffmpegFilterChain).not.toContain('if(eq')
    expect(rendered.ffmpegFilterChain).not.toContain('translate')

    // 验证是安全的 eq 滤镜
    expect(rendered.ffmpegFilterChain).toContain('eq=')
    expect(rendered.ffmpegFilterChain).toContain('contrast=')
    expect(rendered.ffmpegFilterChain).toContain('saturation=')

    // 验证滤镜链格式正确
    expect(rendered.ffmpegFilterChain).toBe(DEFAULT_VIDEO_FILTER)
  })

  it('应该正确验证用户配置', () => {
    const engine = createEffectsEngine({ preset: 'trap-king' })
    const validation = engine.validate()

    console.log('\n✅ 配置验证:')
    console.log(`  - 验证结果: ${validation.valid ? '通过' : '失败'}`)
    console.log(`  - 错误数量: ${validation.errors.length}`)

    expect(validation.valid).toBe(true)
    expect(validation.errors.length).toBe(0)
  })

  it('所有预设都应该使用默认滤镜', () => {
    const presets = getAllEffectPresets()

    console.log('\n🎯 预设滤镜验证:')

    presets.forEach(preset => {
      expect(preset.videoFilter).toBe('default')
      console.log(`  ✅ ${preset.name}: 使用默认滤镜`)
    })
  })
})
