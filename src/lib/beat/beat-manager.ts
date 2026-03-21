/**
 * Beat 管理器
 * 管理 Beat 文件的上传、存储和检索
 */

import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { BeatFile, BeatCategory, BeatUploadOptions, WaveformData } from './types'
import { getBpmDetector } from './bpm-detector'

/**
 * Beat 管理器配置
 */
interface BeatManagerConfig {
  storageDir: string
  presetDir: string
  maxFileSize: number
  supportedFormats: string[]
}

/**
 * 预设 Beat 配置
 */
const PRESET_BEATS: Array<Omit<BeatFile, 'id' | 'createdAt'>> = [
  {
    name: 'Trap Beat 1',
    path: '/beats/preset/trap_1.mp3',
    bpm: 140,
    duration: 180,
    category: 'energetic',
    tags: ['trap', 'hiphop', 'energetic'],
    isPreset: true,
    description: '充满能量的 Trap 节拍',
  },
  {
    name: 'Old School 1',
    path: '/beats/preset/oldschool_1.mp3',
    bpm: 90,
    duration: 180,
    category: 'general',
    tags: ['oldschool', 'classic', 'hiphop'],
    isPreset: true,
    description: '经典的 Old School 风格',
  },
  {
    name: 'Funny Beat 1',
    path: '/beats/preset/funny_1.mp3',
    bpm: 120,
    duration: 180,
    category: 'funny',
    tags: ['funny', 'upbeat', 'happy'],
    isPreset: true,
    description: '轻松搞笑的节奏',
  },
  {
    name: 'Lyrical Beat 1',
    path: '/beats/preset/lyrical_1.mp3',
    bpm: 85,
    duration: 180,
    category: 'lyrical',
    tags: ['lyrical', 'emotional', 'slow'],
    isPreset: true,
    description: '适合抒情表达的节奏',
  },
  {
    name: 'Drill Beat 1',
    path: '/beats/preset/drill_1.mp3',
    bpm: 150,
    duration: 180,
    category: 'energetic',
    tags: ['drill', 'dark', 'energetic'],
    isPreset: true,
    description: '硬核 Drill 节拍',
  },
]

/**
 * Beat 管理器
 */
export class BeatManager {
  private config: BeatManagerConfig
  private bpmDetector = getBpmDetector()

  constructor(config?: Partial<BeatManagerConfig>) {
    this.config = {
      storageDir: config?.storageDir || '/data/beats',
      presetDir: config?.presetDir || '/data/beats/presets',
      maxFileSize: config?.maxFileSize || 50 * 1024 * 1024, // 50MB
      supportedFormats: config?.supportedFormats || ['mp3', 'wav', 'ogg', 'm4a'],
    }
  }

  /**
   * 初始化（确保目录存在，加载预设 Beat）
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.config.storageDir, { recursive: true })
    await fs.mkdir(this.config.presetDir, { recursive: true })
  }

  /**
   * 上传 Beat
   */
  async upload(options: BeatUploadOptions): Promise<BeatFile> {
    const { filePath, name, userId, autoDetectBpm = true } = options

    // 验证文件格式
    const ext = path.extname(filePath).toLowerCase().slice(1)
    if (!this.config.supportedFormats.includes(ext)) {
      throw new Error(`Unsupported format: ${ext}`)
    }

    // 验证文件大小
    const stats = await fs.stat(filePath)
    if (stats.size > this.config.maxFileSize) {
      throw new Error(`File too large: ${stats.size} bytes`)
    }

    // 生成 ID
    const id = `beat_${uuidv4()}`

    // 复制文件到存储目录
    const storagePath = path.join(this.config.storageDir, userId, `${id}.${ext}`)
    await fs.mkdir(path.dirname(storagePath), { recursive: true })
    await fs.copyFile(filePath, storagePath)

    // 检测或使用默认 BPM
    let bpm = 90
    let duration = 0

    if (autoDetectBpm) {
      try {
        bpm = await this.bpmDetector.quickDetect(storagePath)
      } catch (error) {
        console.warn('[BeatManager] BPM detection failed, using default')
      }
    }

    // 获取时长
    try {
      duration = await this.getAudioDuration(storagePath)
    } catch (error) {
      console.warn('[BeatManager] Duration detection failed')
    }

    const beatFile: BeatFile = {
      id,
      name,
      path: storagePath,
      bpm,
      duration,
      category: 'custom',
      tags: ['user-upload'],
      isPreset: false,
      createdAt: new Date(),
    }

    // 保存元数据
    await this.saveMetadata(beatFile)

    return beatFile
  }

  /**
   * 获取所有预设 Beat
   */
  async getPresetBeats(): Promise<BeatFile[]> {
    return PRESET_BEATS.map(beat => ({
      ...beat,
      id: `preset_${beat.name.toLowerCase().replace(/\s+/g, '_')}`,
      createdAt: new Date(),
    }))
  }

  /**
   * 获取用户上传的 Beat
   */
  async getUserBeats(userId: string): Promise<BeatFile[]> {
    const userDir = path.join(this.config.storageDir, userId)

    try {
      const files = await fs.readdir(userDir)
      const beats: BeatFile[] = []

      for (const file of files) {
        if (file.endsWith('.json')) continue

        const metadata = await this.loadMetadata(path.join(userDir, file.replace(/\.[^.]+$/, '.json')))
        if (metadata) {
          beats.push(metadata)
        }
      }

      return beats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch {
      return []
    }
  }

  /**
   * 获取 Beat 详情
   */
  async getBeat(beatId: string, userId?: string): Promise<BeatFile | null> {
    // 先检查预设
    const presets = await this.getPresetBeats()
    const preset = presets.find(p => p.id === beatId)
    if (preset) return preset

    // 检查用户上传
    if (userId) {
      const userBeats = await this.getUserBeats(userId)
      return userBeats.find(b => b.id === beatId) || null
    }

    return null
  }

  /**
   * 删除 Beat
   */
  async deleteBeat(beatId: string, userId: string): Promise<boolean> {
    const beat = await this.getBeat(beatId, userId)
    if (!beat || beat.isPreset) return false

    try {
      await fs.unlink(beat.path)
      await fs.unlink(beat.path.replace(/\.[^.]+$/, '.json'))
      return true
    } catch {
      return false
    }
  }

  /**
   * 更新 Beat BPM
   */
  async updateBpm(beatId: string, bpm: number, userId: string): Promise<BeatFile | null> {
    const beat = await this.getBeat(beatId, userId)
    if (!beat) return null

    beat.bpm = this.bpmDetector.normalizeBpm(bpm)
    await this.saveMetadata(beat)

    return beat
  }

  /**
   * 按分类获取 Beat
   */
  async getBeatsByCategory(category: BeatCategory): Promise<BeatFile[]> {
    const presets = await this.getPresetBeats()
    return presets.filter(b => b.category === category)
  }

  /**
   * 搜索 Beat
   */
  async searchBeats(query: string): Promise<BeatFile[]> {
    const presets = await this.getPresetBeats()
    const lowerQuery = query.toLowerCase()

    return presets.filter(b =>
      b.name.toLowerCase().includes(lowerQuery) ||
      b.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
      b.description?.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * 获取音频时长
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
   * 保存元数据
   */
  private async saveMetadata(beat: BeatFile): Promise<void> {
    const metadataPath = beat.path.replace(/\.[^.]+$/, '.json')
    await fs.writeFile(metadataPath, JSON.stringify(beat, null, 2))
  }

  /**
   * 加载元数据
   */
  private async loadMetadata(metadataPath: string): Promise<BeatFile | null> {
    try {
      const content = await fs.readFile(metadataPath, 'utf-8')
      const beat = JSON.parse(content) as BeatFile
      beat.createdAt = new Date(beat.createdAt)
      return beat
    } catch {
      return null
    }
  }

  /**
   * 生成波形数据
   */
  async generateWaveform(audioPath: string): Promise<WaveformData> {
    // 简化实现：返回空数据
    // 完整实现需要使用 ffmpeg 或 Web Audio API
    return {
      samples: [],
      sampleRate: 44100,
      duration: await this.getAudioDuration(audioPath),
      peaks: [],
    }
  }
}

// 单例实例
let managerInstance: BeatManager | null = null

/**
 * 获取 Beat 管理器实例
 */
export function getBeatManager(): BeatManager {
  if (!managerInstance) {
    managerInstance = new BeatManager()
  }
  return managerInstance
}
