/**
 * 中文音节切分器
 * 将连续语音切分为独立音节
 */

import type { Syllable, SyllableSegmentResult } from './types'

/**
 * 音节切分器配置
 */
interface SyllableSplitterConfig {
  pythonPath: string
  timeout: number
}

/**
 * 中文音节切分器
 * 使用 Whisper 进行语音识别和对齐
 */
export class SyllableSplitter {
  private config: SyllableSplitterConfig

  constructor(config?: Partial<SyllableSplitterConfig>) {
    this.config = {
      pythonPath: config?.pythonPath || process.env.PYTHON_PATH || 'python3',
      timeout: config?.timeout || 120000,
    }
  }

  /**
   * 切分音频为音节
   * @param audioPath 音频文件路径
   * @param text 对应的文本（可选，用于更精确的对齐）
   */
  async split(audioPath: string, text?: string): Promise<SyllableSegmentResult> {
    // 方案 1: 使用 Whisper 进行强制对齐
    // 方案 2: 使用 Python pypinyin 进行文本切分

    if (text) {
      return this.splitWithText(audioPath, text)
    } else {
      return this.splitWithWhisper(audioPath)
    }
  }

  /**
   * 使用文本进行音节切分
   * 更精确，但需要提供文本
   */
  private async splitWithText(
    audioPath: string,
    text: string
  ): Promise<SyllableSegmentResult> {
    // 1. 首先获取音频时长
    const duration = await this.getAudioDuration(audioPath)

    // 2. 将文本切分为音节
    const syllableTexts = this.textToSyllables(text)

    // 3. 均匀分配时间（简化方案）
    // TODO: 使用 Whisper 进行精确的时间对齐
    const syllableDuration = (duration * 1000) / syllableTexts.length
    const syllables: Syllable[] = syllableTexts.map((syl, i) => ({
      text: syl,
      startTime: i * syllableDuration,
      endTime: (i + 1) * syllableDuration,
      duration: syllableDuration,
    }))

    return {
      syllables,
      duration,
      text,
    }
  }

  /**
   * 使用 Whisper 进行音节切分
   * 不需要文本，但精确度可能较低
   */
  private async splitWithWhisper(audioPath: string): Promise<SyllableSegmentResult> {
    // TODO: 实现 Whisper 强制对齐
    // 当前返回简化结果
    const duration = await this.getAudioDuration(audioPath)

    return {
      syllables: [],
      duration,
      text: '',
    }
  }

  /**
   * 将中文文本切分为音节
   */
  textToSyllables(text: string): string[] {
    // 简化方案：按字符切分
    // 中文每个汉字通常是一个音节
    const syllables: string[] = []

    // 移除标点符号和空格
    const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')

    for (const char of cleanText) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 中文字符，作为单独音节
        syllables.push(char)
      } else if (/[a-zA-Z]/.test(char)) {
        // 英文字母，与前一个合并或单独处理
        const lastIndex = syllables.length - 1
        if (lastIndex >= 0 && /[a-zA-Z]/.test(syllables[lastIndex])) {
          syllables[lastIndex] += char
        } else {
          syllables.push(char)
        }
      }
      // 数字可以作为单独音节或与前一个合并
    }

    return syllables
  }

  /**
   * 获取音频时长（秒）
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    const { execSync } = await import('child_process')

    try {
      const result = execSync(
        `ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
        { encoding: 'utf-8' }
      )

      return parseFloat(result.trim()) || 0
    } catch {
      return 0
    }
  }

  /**
   * 使用 Python pypinyin 进行更精确的音节切分
   * （需要安装 pypinyin）
   */
  async splitWithPinyin(text: string): Promise<string[]> {
    // 简化实现：直接使用 textToSyllables
    // 完整实现需要调用 Python pypinyin
    return this.textToSyllables(text)
  }
}

// 单例实例
let splitterInstance: SyllableSplitter | null = null

/**
 * 获取音节切分器实例
 */
export function getSyllableSplitter(): SyllableSplitter {
  if (!splitterInstance) {
    splitterInstance = new SyllableSplitter()
  }
  return splitterInstance
}
