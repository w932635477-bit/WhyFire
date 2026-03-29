/**
 * SunoAPI 时间戳歌词 → LyricLineWithWords 转换器
 *
 * 将 SunoAPI get-timestamped-lyrics 返回的 alignedWords (秒级)
 * 转换为项目已有的 LyricLineWithWords 格式 (毫秒级)，
 * 可直接喂入 SubtitleRenderer / EffectsConfigEngine 生成 ASS 卡拉OK字幕。
 */

import type { LyricLineWithWords, LyricWord } from '@/lib/effects/types'
import type { TimestampedWord } from '@/lib/music/suno-api-client'

/**
 * 将 SunoAPI alignedWords 转换为 LyricLineWithWords[]
 *
 * 分行策略：按停顿 > 1.5 秒自动分行，或每行最多 12 个词
 * 时间戳：秒 → 毫秒
 */
export function convertAlignedWordsToLyricLines(
  alignedWords: TimestampedWord[],
  options: {
    /** 停顿分行阈值（毫秒），默认 1500 */
    pauseThresholdMs?: number
    /** 每行最大词数，默认 12 */
    maxWordsPerLine?: number
    /** 是否过滤失败词，默认 true */
    filterFailed?: boolean
  } = {}
): LyricLineWithWords[] {
  const {
    pauseThresholdMs = 1500,
    maxWordsPerLine = 12,
    filterFailed = true,
  } = options

  // 1. 过滤并转换为 LyricWord
  const words: LyricWord[] = alignedWords
    .filter(w => filterFailed ? w.success : true)
    .map(w => ({
      text: w.word,
      startTime: Math.round(w.startS * 1000),
      endTime: Math.round(w.endS * 1000),
    }))
    .filter(w => w.text.trim().length > 0)

  if (words.length === 0) return []

  // 2. 分行
  const lines: LyricWord[][] = []
  let currentLine: LyricWord[] = [words[0]]

  for (let i = 1; i < words.length; i++) {
    const prev = words[i - 1]
    const curr = words[i]
    const gap = curr.startTime - prev.endTime

    // 分行条件：停顿超过阈值 或 当前行词数达到上限
    if (gap > pauseThresholdMs || currentLine.length >= maxWordsPerLine) {
      lines.push(currentLine)
      currentLine = [curr]
    } else {
      currentLine.push(curr)
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  // 3. 转换为 LyricLineWithWords
  return lines.map((lineWords, index) => ({
    id: `line-${index}`,
    text: lineWords.map(w => w.text).join(''),
    startTime: lineWords[0].startTime,
    endTime: lineWords[lineWords.length - 1].endTime,
    words: lineWords,
  }))
}

/**
 * 将 alignedWords 转换为 LRC 格式歌词（用于调试/预览）
 */
export function alignedWordsToLRC(alignedWords: TimestampedWord[]): string {
  const lines = convertAlignedWordsToLyricLines(alignedWords)

  return lines.map(line => {
    const startMin = Math.floor(line.startTime / 60000)
    const startSec = ((line.startTime % 60000) / 1000).toFixed(2)
    return `[${String(startMin).padStart(2, '0')}:${startSec.padStart(5, '0')}]${line.text}`
  }).join('\n')
}
