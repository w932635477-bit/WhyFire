/**
 * Subtitle Module Usage Demo
 *
 * This file demonstrates how to use the subtitle rendering engine.
 */

import {
  SubtitleRenderer,
  parseLRC,
  generateVTT
} from '@/lib/subtitle/subtitle-renderer'
import { PRESET_STYLES, SubtitleStyle } from '@/lib/subtitle/subtitle-styles'

// Example 1: Create a subtitle renderer with a preset style
const renderer = new SubtitleRenderer('karaoke')

// Example 2: Parse LRC format lyrics
const lrcText = `
[00:00.00]Welcome to WhyFire
[00:04.00]AI-powered video generation
[00:08.00]Create amazing content
[00:12.00]With ease and style
`

const lyrics = renderer.parseLyrics(lrcText, 'lrc')
console.log('Parsed lyrics:', lyrics)

// Example 3: Generate SRT format
const srt = renderer.generateSRT(lyrics)
console.log('SRT output:\n', srt)

// Example 4: Generate ASS format with styles
const ass = renderer.generateASS(lyrics)
console.log('ASS output:\n', ass)

// Example 5: Generate WebVTT format (for web playback)
const vtt = generateVTT(lyrics)
console.log('VTT output:\n', vtt)

// Example 6: Create renderer with custom configuration
const customRenderer = new SubtitleRenderer({
  style: 'neon',
  fontSize: 64,
  fontFamily: 'Arial Black, sans-serif',
  primaryColor: '#00FF00',
  secondaryColor: '#FF00FF',
  outlineColor: '#000000',
  shadowEnabled: true,
  position: 'center'
})

// Example 7: Update configuration dynamically
customRenderer.setConfig({
  fontSize: 72,
  position: 'bottom'
})

// Example 8: Lyrics with word-level timing for karaoke effect
const karaokeLyrics = [
  {
    id: '1',
    text: 'Hello World',
    startTime: 0,
    endTime: 3000,
    words: [
      { text: 'Hello', startTime: 0, endTime: 1500 },
      { text: 'World', startTime: 1500, endTime: 3000 }
    ]
  },
  {
    id: '2',
    text: 'Welcome to the show',
    startTime: 3000,
    endTime: 6000,
    words: [
      { text: 'Welcome', startTime: 3000, endTime: 3800 },
      { text: 'to', startTime: 3800, endTime: 4200 },
      { text: 'the', startTime: 4200, endTime: 4600 },
      { text: 'show', startTime: 4600, endTime: 6000 }
    ]
  }
]

// Generate ASS with karaoke timing
const karaokeRenderer = new SubtitleRenderer('karaoke')
const karaokeASS = karaokeRenderer.generateASS(karaokeLyrics)
console.log('Karaoke ASS:\n', karaokeASS)

// Example 9: Using different preset styles
const styles: SubtitleStyle[] = ['karaoke', 'bounce', 'gradient', 'neon']

styles.forEach(style => {
  const r = new SubtitleRenderer(style)
  console.log(`\n${style.toUpperCase()} style config:`, r.getConfig())
})

// Example 10: Export function usage
const exportedSRT = renderer.export(lyrics, 'srt')
const exportedASS = renderer.export(lyrics, 'ass')

export {
  renderer,
  lyrics,
  srt,
  ass,
  vtt
}
