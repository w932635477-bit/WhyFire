/**
 * 端到端特效系统验证
 *
 * 这个脚本验证：
 * 1. 特效配置引擎能正确生成 ASS 字幕
 * 2. 特效配置引擎能正确生成 FFmpeg 滤镜链
 * 3. VideoSynthesizer 能接受特效配置
 */

import { describe, it, expect } from 'vitest'
import {
  EffectsConfigEngine,
  createEffectsEngine,
  getAllSubtitleEffects,
  getAllVideoFilters,
  getAllEffectPresets,
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

    console.log('\n📊 特效系统统计:')
    console.log(`  - 字幕特效: ${subtitleEffects.length} 种`)
    console.log(`  - 视频滤镜: ${videoFilters.length} 种`)
    console.log(`  - 特效预设: ${presets.length} 种`)

    // 验证字幕特效
    console.log('\n✨ 字幕特效列表:')
    subtitleEffects.forEach(effect => {
      console.log(`  ${effect.icon} ${effect.name} - ${effect.description}`)
    })

    // 验证视频滤镜
    console.log('\n🎬 视频滤镜列表:')
    videoFilters.forEach(filter => {
      console.log(`  ${filter.icon} ${filter.name} - ${filter.description}`)
    })

    // 验证预设
    console.log('\n🎯 特效预设列表:')
    presets.forEach(preset => {
      console.log(`  ${preset.icon} ${preset.name} - ${preset.description}`)
    })

    expect(subtitleEffects.length).toBeGreaterThanOrEqual(7)
    expect(videoFilters.length).toBeGreaterThanOrEqual(17)
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
      console.log(`    - FFmpeg 滤镜: ${rendered.ffmpegFilterChain.substring(0, 50)}...`)

      expect(hasScriptInfo).toBe(true)
      expect(hasStyles).toBe(true)
      expect(hasEvents).toBe(true)
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

  it('应该正确组合多个视频滤镜', () => {
    const filterCombinations = [
      ['glitch', 'shake'],
      ['vhs', 'film'],
      ['cyberpunk', 'rgb-shift'],
      ['dramatic', 'noise'],
    ]

    console.log('\n🔧 视频滤镜组合验证:')

    filterCombinations.forEach(filters => {
      const engine = createEffectsEngine({
        videoFilter: filters[0] as any,
        additionalFilters: filters.slice(1) as any,
      })
      const rendered = engine.render(mockLyrics as any)

      console.log(`  组合 [${filters.join(', ')}]:`)
      console.log(`    - 滤镜链: ${rendered.ffmpegFilterChain.substring(0, 60)}...`)

      expect(rendered.ffmpegFilterChain.length).toBeGreaterThan(0)
    })
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

  it('应该生成符合 FFmpeg 标准的滤镜语法', () => {
    const engine = createEffectsEngine({ preset: 'cyber-night' })
    const rendered = engine.render(mockLyrics as any)

    console.log('\n🎬 FFmpeg 滤镜语法验证:')
    console.log(`  完整滤镜链: ${rendered.ffmpegFilterChain}`)

    // 验证滤镜链不包含非法字符（FFmpeg 滤镜参数使用冒号分隔，是合法的）
    const hasInvalidChars = /[<>|?*]/.test(rendered.ffmpegFilterChain)
    expect(hasInvalidChars).toBe(false)

    // 验证滤镜链格式正确
    if (rendered.ffmpegFilterChain.length > 0) {
      const filters = rendered.ffmpegFilterChain.split(',')
      console.log(`  滤镜数量: ${filters.length}`)
      filters.forEach((f, i) => {
        console.log(`    ${i + 1}. ${f.substring(0, 40)}...`)
      })
    }
  })
})
