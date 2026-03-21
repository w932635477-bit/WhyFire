/**
 * 视频处理器测试
 * 测试视频处理和人声分离功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock FFmpeg 和外部依赖
vi.mock('@/lib/ffmpeg/ffmpeg-client', () => ({
  getFFmpegClient: vi.fn(() => ({
    extractAudio: vi.fn(async (videoPath: string) => {
      return videoPath.replace('.mp4', '.mp3')
    }),
    separateVocals: vi.fn(async (audioPath: string) => ({
      vocalsPath: audioPath.replace('.mp3', '_vocals.mp3'),
     伴奏Path: audioPath.replace('.mp3', '_accompaniment.mp3'),
    })),
  })),
}))

describe('VideoProcessor', () => {
  let videoProcessor: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // 动态导入以应用 mock
    const module = await import('../video-processor')
    videoProcessor = new module.VideoProcessor()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('extractAudio', () => {
    it('应该从视频中提取音频', async () => {
      const videoPath = '/videos/test.mp4'
      const audioPath = await videoProcessor.extractAudio(videoPath)

      expect(audioPath).toBeTruthy()
      expect(audioPath).toContain('.mp3')
    })

    it('应该支持多种视频格式', async () => {
      const formats = ['.mp4', '.mov', '.avi', '.mkv', '.webm']

      for (const format of formats) {
        const videoPath = `/videos/test${format}`
        const audioPath = await videoProcessor.extractAudio(videoPath)
        expect(audioPath).toBeTruthy()
      }
    })

    it('无效视频路径应该抛出错误', async () => {
      await expect(videoProcessor.extractAudio('')).rejects.toThrow()
    })
  })

  describe('separateVocals', () => {
    it('应该分离人声和伴奏', async () => {
      const audioPath = '/audio/test.mp3'
      const result = await videoProcessor.separateVocals(audioPath)

      expect(result).toHaveProperty('vocalsPath')
      expect(result).toHaveProperty('accompanimentPath')
      expect(result.vocalsPath).toContain('_vocals')
      expect(result.accompanimentPath).toContain('_accompaniment')
    })

    it('分离后的人声文件应该存在', async () => {
      const audioPath = '/audio/test.mp3'
      const result = await videoProcessor.separateVocals(audioPath)

      expect(result.vocalsPath).toBeDefined()
      expect(result.vocalsPath).toMatch(/\.mp3$/)
    })

    it('音频质量应该满足要求', async () => {
      const audioPath = '/audio/test.mp3'
      const result = await videoProcessor.separateVocals(audioPath, {
        quality: 'high',
      })

      expect(result.quality).toBe('high')
    })
  })

  describe('processVideo', () => {
    it('应该完整处理视频流程', async () => {
      const videoPath = '/videos/test.mp4'
      const result = await videoProcessor.processVideo(videoPath)

      expect(result).toHaveProperty('audioPath')
      expect(result).toHaveProperty('vocalsPath')
      expect(result).toHaveProperty('duration')
    })

    it('应该支持自定义处理选项', async () => {
      const videoPath = '/videos/test.mp4'
      const result = await videoProcessor.processVideo(videoPath, {
        extractAudio: true,
        separateVocals: true,
        outputFormat: 'wav',
      })

      expect(result.audioPath).toContain('.wav')
    })
  })

  describe('getVideoMetadata', () => {
    it('应该获取视频元数据', async () => {
      const videoPath = '/videos/test.mp4'
      const metadata = await videoProcessor.getVideoMetadata(videoPath)

      expect(metadata).toHaveProperty('duration')
      expect(metadata).toHaveProperty('width')
      expect(metadata).toHaveProperty('height')
      expect(metadata).toHaveProperty('fps')
      expect(metadata.duration).toBeGreaterThan(0)
    })
  })

  describe('错误处理', () => {
    it('损坏的视频文件应该抛出错误', async () => {
      const corruptedPath = '/videos/corrupted.mp4'

      await expect(videoProcessor.processVideo(corruptedPath)).rejects.toThrow()
    })

    it('不支持的格式应该抛出错误', async () => {
      const unsupportedPath = '/videos/test.txt'

      await expect(videoProcessor.processVideo(unsupportedPath)).rejects.toThrow()
    })
  })
})

describe('VocalSeparationQuality', () => {
  it('高质量分离应该保留更多细节', async () => {
    const { VideoProcessor } = await import('../video-processor')
    const processor = new VideoProcessor()

    const result = await processor.separateVocals('/audio/test.mp3', {
      quality: 'high',
    })

    expect(result.bitrate).toBeGreaterThanOrEqual(320)
  })

  it('快速模式应该优先速度', async () => {
    const { VideoProcessor } = await import('../video-processor')
    const processor = new VideoProcessor()

    const startTime = Date.now()
    await processor.separateVocals('/audio/test.mp3', {
      quality: 'fast',
    })
    const duration = Date.now() - startTime

    // 快速模式应该更快完成
    expect(duration).toBeLessThan(10000) // 假设测试环境 10 秒内完成
  })
})
