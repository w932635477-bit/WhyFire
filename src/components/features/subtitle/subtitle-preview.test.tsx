import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  SubtitleRenderer,
  formatASSTime,
  formatSRTTime,
  formatASSColor,
  parseLRC,
  parsePlainText,
  generateVTT
} from '@/lib/subtitle/subtitle-renderer'
import { PRESET_STYLES, getASSAlignment, getCSSPosition } from '@/lib/subtitle/subtitle-styles'
import { SubtitlePreview } from './subtitle-preview'

describe('SubtitleRenderer', () => {
  describe('formatASSTime', () => {
    it('should format milliseconds to ASS time format', () => {
      expect(formatASSTime(0)).toBe('0:00:00.00')
      expect(formatASSTime(1000)).toBe('0:00:01.00')
      expect(formatASSTime(61000)).toBe('0:01:01.00')
      expect(formatASSTime(3661000)).toBe('1:01:01.00')
      expect(formatASSTime(1234)).toBe('0:00:01.23')
    })
  })

  describe('formatSRTTime', () => {
    it('should format milliseconds to SRT time format', () => {
      expect(formatSRTTime(0)).toBe('00:00:00,000')
      expect(formatSRTTime(1000)).toBe('00:00:01,000')
      expect(formatSRTTime(3661234)).toBe('01:01:01,234')
    })
  })

  describe('formatASSColor', () => {
    it('should convert hex color to ASS format', () => {
      expect(formatASSColor('#FFFFFF')).toBe('&H00FFFFFF&')
      expect(formatASSColor('#8B5CF6')).toBe('&H00F65C8B&')
      expect(formatASSColor('00FF00')).toBe('&H0000FF00&')
    })
  })

  describe('parseLRC', () => {
    it('should parse LRC format lyrics', () => {
      const lrcText = `
[00:00.00]First line of lyrics
[00:05.00]Second line of lyrics
[00:10.50]Third line of lyrics
      `
      const lines = parseLRC(lrcText)

      expect(lines).toHaveLength(3)
      expect(lines[0]).toEqual({
        id: 'line-0',
        text: 'First line of lyrics',
        startTime: 0,
        endTime: 5000
      })
      expect(lines[1].startTime).toBe(5000)
      expect(lines[1].endTime).toBe(10500)
      expect(lines[2].startTime).toBe(10500)
    })

    it('should handle empty LRC text', () => {
      const lines = parseLRC('')
      expect(lines).toHaveLength(0)
    })
  })

  describe('parsePlainText', () => {
    it('should parse plain text with estimated timing', () => {
      const text = `Line 1
Line 2
Line 3`
      const lines = parsePlainText(text, 1000, 2000)

      expect(lines).toHaveLength(3)
      expect(lines[0]).toEqual({
        id: 'line-0',
        text: 'Line 1',
        startTime: 1000,
        endTime: 3000
      })
      expect(lines[1].startTime).toBe(3000)
      expect(lines[2].endTime).toBe(7000)
    })
  })

  describe('generateVTT', () => {
    it('should generate WebVTT format', () => {
      const lines = [
        { id: '1', text: 'Hello', startTime: 0, endTime: 1000 },
        { id: '2', text: 'World', startTime: 1000, endTime: 2000 }
      ]

      const vtt = generateVTT(lines)

      expect(vtt).toContain('WEBVTT')
      expect(vtt).toContain('00:00:00.000 --> 00:00:01.000')
      expect(vtt).toContain('Hello')
      expect(vtt).toContain('00:00:01.000 --> 00:00:02.000')
      expect(vtt).toContain('World')
    })
  })

  describe('SubtitleRenderer class', () => {
    it('should create renderer with preset style', () => {
      const renderer = new SubtitleRenderer('karaoke')
      const config = renderer.getConfig()

      expect(config.style).toBe('karaoke')
      expect(config.fontSize).toBe(48)
      expect(config.primaryColor).toBe('#FFFFFF')
    })

    it('should create renderer with custom config', () => {
      const renderer = new SubtitleRenderer({
        ...PRESET_STYLES.karaoke,
        fontSize: 72
      })

      expect(renderer.getConfig().fontSize).toBe(72)
    })

    it('should update config', () => {
      const renderer = new SubtitleRenderer('karaoke')
      renderer.setConfig({ fontSize: 60 })

      expect(renderer.getConfig().fontSize).toBe(60)
    })

    it('should generate SRT format', () => {
      const renderer = new SubtitleRenderer('karaoke')
      const lines = [
        { id: '1', text: 'Hello World', startTime: 0, endTime: 3000 },
        { id: '2', text: 'Second line', startTime: 3000, endTime: 6000 }
      ]

      const srt = renderer.generateSRT(lines)

      expect(srt).toContain('1')
      expect(srt).toContain('00:00:00,000 --> 00:00:03,000')
      expect(srt).toContain('Hello World')
      expect(srt).toContain('2')
      expect(srt).toContain('00:00:03,000 --> 00:00:06,000')
      expect(srt).toContain('Second line')
    })

    it('should generate ASS format', () => {
      const renderer = new SubtitleRenderer('karaoke')
      const lines = [
        { id: '1', text: 'Hello World', startTime: 0, endTime: 3000 }
      ]

      const ass = renderer.generateASS(lines)

      expect(ass).toContain('[Script Info]')
      expect(ass).toContain('[V4+ Styles]')
      expect(ass).toContain('[Events]')
      expect(ass).toContain('Hello World')
      expect(ass).toContain('Style: Default')
    })

    it('should export in specified format', () => {
      const renderer = new SubtitleRenderer('karaoke')
      const lines = [
        { id: '1', text: 'Test', startTime: 0, endTime: 1000 }
      ]

      const srt = renderer.export(lines, 'srt')
      const ass = renderer.export(lines, 'ass')

      expect(srt).toContain('00:00:00,000 --> 00:00:01,000')
      expect(ass).toContain('[Script Info]')
    })

    it('should parse lyrics in different formats', () => {
      const renderer = new SubtitleRenderer('karaoke')

      // LRC format
      const lrcText = '[00:00.00]Test lyrics'
      const lrcLines = renderer.parseLyrics(lrcText, 'lrc')
      expect(lrcLines).toHaveLength(1)
      expect(lrcLines[0].text).toBe('Test lyrics')

      // Plain text
      const plainText = 'Line 1\nLine 2'
      const plainLines = renderer.parseLyrics(plainText, 'plain')
      expect(plainLines).toHaveLength(2)

      // JSON format
      const jsonText = JSON.stringify([
        { id: '1', text: 'JSON Line', startTime: 0, endTime: 1000 }
      ])
      const jsonLines = renderer.parseLyrics(jsonText, 'json')
      expect(jsonLines).toHaveLength(1)
      expect(jsonLines[0].text).toBe('JSON Line')
    })
  })

  describe('ASS style effects', () => {
    it('should apply karaoke effect with word timing', () => {
      const renderer = new SubtitleRenderer('karaoke')
      const lines = [{
        id: '1',
        text: 'Hello World',
        startTime: 0,
        endTime: 3000,
        words: [
          { text: 'Hello', startTime: 0, endTime: 1500 },
          { text: 'World', startTime: 1500, endTime: 3000 }
        ]
      }]

      const ass = renderer.generateASS(lines)
      expect(ass).toContain('\\kf')
    })

    it('should apply bounce effect', () => {
      const renderer = new SubtitleRenderer('bounce')
      const lines = [
        { id: '1', text: 'Bounce', startTime: 0, endTime: 3000 }
      ]

      const ass = renderer.generateASS(lines)
      expect(ass).toContain('\\fad')
      expect(ass).toContain('\\fscx')
    })

    it('should apply gradient effect', () => {
      const renderer = new SubtitleRenderer('gradient')
      const lines = [
        { id: '1', text: 'Gradient', startTime: 0, endTime: 3000 }
      ]

      const ass = renderer.generateASS(lines)
      expect(ass).toContain('\\1c')
      expect(ass).toContain('\\t')
    })

    it('should apply neon effect', () => {
      const renderer = new SubtitleRenderer('neon')
      const lines = [
        { id: '1', text: 'Neon', startTime: 0, endTime: 3000 }
      ]

      const ass = renderer.generateASS(lines)
      expect(ass).toContain('\\be')
      expect(ass).toContain('\\bord')
    })
  })
})

describe('subtitle-styles', () => {
  describe('PRESET_STYLES', () => {
    it('should have all required styles', () => {
      expect(PRESET_STYLES.karaoke).toBeDefined()
      expect(PRESET_STYLES.bounce).toBeDefined()
      expect(PRESET_STYLES.gradient).toBeDefined()
      expect(PRESET_STYLES.neon).toBeDefined()
    })

    it('should have valid color formats', () => {
      Object.values(PRESET_STYLES).forEach(style => {
        expect(style.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(style.secondaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(style.outlineColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })
  })

  describe('getASSAlignment', () => {
    it('should return correct ASS alignment values', () => {
      expect(getASSAlignment('bottom')).toBe(2)
      expect(getASSAlignment('top')).toBe(8)
      expect(getASSAlignment('center')).toBe(5)
    })
  })

  describe('getCSSPosition', () => {
    it('should return correct CSS position styles', () => {
      const bottomPos = getCSSPosition('bottom')
      expect(bottomPos.bottom).toBe('10%')

      const topPos = getCSSPosition('top')
      expect(topPos.top).toBe('10%')

      const centerPos = getCSSPosition('center')
      expect(centerPos.top).toBe('50%')
    })
  })
})

describe('SubtitlePreview', () => {
  const mockLyrics: Array<{id: string, text: string, startTime: number, endTime: number}> = [
    { id: '1', text: 'First line', startTime: 0, endTime: 3000 },
    { id: '2', text: 'Second line', startTime: 3000, endTime: 6000 },
    { id: '3', text: 'Third line', startTime: 6000, endTime: 9000 }
  ]

  const mockConfig = PRESET_STYLES.karaoke

  it('should render without crashing', () => {
    render(
      <SubtitlePreview
        lyrics={mockLyrics}
        config={mockConfig}
        currentTime={1500}
      />
    )

    expect(screen.getByText('Video Preview Area')).toBeDefined()
  })

  it('should display active subtitle', () => {
    render(
      <SubtitlePreview
        lyrics={mockLyrics}
        config={mockConfig}
        currentTime={4500}
      />
    )

    // Use getAllByText since the text appears both in preview and timeline
    const elements = screen.getAllByText('Second line')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('should show lyrics timeline', () => {
    render(
      <SubtitlePreview
        lyrics={mockLyrics}
        config={mockConfig}
        currentTime={0}
      />
    )

    expect(screen.getByText('Lyrics Timeline')).toBeDefined()
    // Use getAllByText since lyrics appear in timeline
    expect(screen.getAllByText('First line').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Second line').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Third line').length).toBeGreaterThan(0)
  })

  it('should show time indicator', () => {
    render(
      <SubtitlePreview
        lyrics={mockLyrics}
        config={mockConfig}
        currentTime={65000}
      />
    )

    expect(screen.getByText('01:05')).toBeDefined()
  })

  it('should handle config changes', () => {
    const onConfigChange = vi.fn()

    render(
      <SubtitlePreview
        lyrics={mockLyrics}
        config={mockConfig}
        currentTime={0}
        onConfigChange={onConfigChange}
      />
    )

    // Config editor should be visible when onConfigChange is provided
    expect(screen.getByText('Subtitle Settings')).toBeDefined()
  })

  it('should hide config editor when onConfigChange is not provided', () => {
    render(
      <SubtitlePreview
        lyrics={mockLyrics}
        config={mockConfig}
        currentTime={0}
      />
    )

    expect(screen.queryByText('Subtitle Settings')).toBeNull()
  })

  it('should handle empty lyrics', () => {
    render(
      <SubtitlePreview
        lyrics={[]}
        config={mockConfig}
        currentTime={1000}
      />
    )

    expect(screen.getByText('Video Preview Area')).toBeDefined()
  })

  it('should handle lyrics with word timing', () => {
    const lyricsWithWords = [{
      id: '1',
      text: 'Hello World',
      startTime: 0,
      endTime: 3000,
      words: [
        { text: 'Hello', startTime: 0, endTime: 1500 },
        { text: 'World', startTime: 1500, endTime: 3000 }
      ]
    }]

    render(
      <SubtitlePreview
        lyrics={lyricsWithWords}
        config={PRESET_STYLES.karaoke}
        currentTime={750}
      />
    )

    // Should render without errors
    expect(screen.getByText('Video Preview Area')).toBeDefined()
  })
})
