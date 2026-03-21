/**
 * 声音克隆器
 * 使用 GPT-SoVITS 进行声音克隆和音色转换
 *
 * SECURITY: 使用 safeExec 替代 execSync 防止命令注入
 */

import path from 'path'
import fs from 'fs/promises'
import { safeExec, validatePath, validateUserId } from '../utils/safe-exec'
import type { VoiceProfile, VoiceCloneOptions, VoiceConvertOptions } from './types'

/**
 * 声音克隆器配置
 */
interface VoiceClonerConfig {
  modelDir: string
  pythonPath: string
  timeout: number
}

/**
 * 声音克隆器
 * 基于 GPT-SoVITS 实现
 */
export class VoiceCloner {
  private config: VoiceClonerConfig

  constructor(config?: Partial<VoiceClonerConfig>) {
    this.config = {
      modelDir: config?.modelDir || process.env.VOICE_MODEL_DIR || '/data/voice-models',
      pythonPath: config?.pythonPath || process.env.PYTHON_PATH || 'python3',
      timeout: config?.timeout || 600000, // 10分钟
    }
  }

  /**
   * 克隆用户声音
   * @param options 克隆选项
   */
  async clone(options: VoiceCloneOptions): Promise<VoiceProfile> {
    const { audioPath, userId, text, userType } = options

    // 安全验证
    if (!validateUserId(userId)) {
      throw new Error('Invalid user ID format')
    }
    if (!validatePath(audioPath)) {
      throw new Error('Invalid audio path')
    }

    const modelPath = path.join(this.config.modelDir, userId)

    console.log(`[VoiceCloner] Training voice model for user ${userId}...`)

    // 确保模型目录存在
    await fs.mkdir(modelPath, { recursive: true })

    // 检查是否已有模型，如果有则复用
    const existingModel = await this.loadExistingModel(userId)
    if (existingModel) {
      console.log(`[VoiceCloner] Found existing model for user ${userId}`)
      return existingModel
    }

    // 调用 GPT-SoVITS 训练脚本
    const scriptPath = path.join(__dirname, 'python', 'train_gpt_sovits.py')

    // SECURITY: 使用 spawn 安全执行，参数作为数组传递，不通过 shell 解释
    const args = [
      scriptPath,
      '--audio', audioPath,
      '--output', modelPath,
    ]
    if (text) {
      args.push('--text', text)
    }

    try {
      const result = await safeExec(this.config.pythonPath, args, {
        timeout: this.config.timeout,
        throwOnError: true,
      })

      const response = JSON.parse(result.stdout)

      if (response.status !== 'success') {
        throw new Error(`Voice cloning failed: ${response.message}`)
      }

      // 计算过期时间
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (userType === 'wechat' ? 30 : 7))

      const profile: VoiceProfile = {
        id: `voice_${userId}_${Date.now()}`,
        userId,
        modelPath: response.model_path,
        referenceAudioPath: audioPath,
        sampleDuration: response.duration,
        quality: response.quality,
        createdAt: new Date(),
        expiresAt,
        userType,
      }

      // 保存配置文件
      await this.saveProfile(profile)

      return profile
    } catch (error) {
      console.error('[VoiceCloner] Training failed:', error)
      throw new Error(`声音克隆失败: ${error}`)
    }
  }

  /**
   * 使用用户音色进行语音合成
   */
  async synthesize(options: VoiceConvertOptions): Promise<string> {
    const { text, voiceProfile, outputPath, dialect } = options

    // 安全验证
    if (!validatePath(voiceProfile.modelPath)) {
      throw new Error('Invalid model path')
    }
    if (!validatePath(outputPath)) {
      throw new Error('Invalid output path')
    }

    const scriptPath = path.join(__dirname, 'python', 'inference_gpt_sovits.py')

    // SECURITY: 使用 spawn 安全执行
    const args = [
      scriptPath,
      '--model', voiceProfile.modelPath,
      '--text', text,
      '--output', outputPath,
    ]
    if (dialect) {
      args.push('--dialect', dialect)
    }

    try {
      const result = await safeExec(this.config.pythonPath, args, {
        timeout: 120000,
        throwOnError: true,
      })

      const response = JSON.parse(result.stdout)

      if (response.status !== 'success') {
        throw new Error(`Voice synthesis failed: ${response.message}`)
      }

      return response.audio_path
    } catch (error) {
      console.error('[VoiceCloner] Synthesis failed:', error)
      throw new Error(`语音合成失败: ${error}`)
    }
  }

  /**
   * 加载现有的声音配置
   */
  async loadProfile(userId: string): Promise<VoiceProfile | null> {
    if (!validateUserId(userId)) {
      return null
    }

    const profilePath = path.join(this.config.modelDir, userId, 'profile.json')

    try {
      const content = await fs.readFile(profilePath, 'utf-8')
      const profile = JSON.parse(content) as VoiceProfile

      // 转换日期字符串为 Date 对象
      profile.createdAt = new Date(profile.createdAt)
      profile.expiresAt = new Date(profile.expiresAt)

      // 检查是否过期
      if (profile.expiresAt < new Date()) {
        console.log(`[VoiceCloner] Profile expired for user ${userId}`)
        return null
      }

      return profile
    } catch {
      return null
    }
  }

  /**
   * 加载现有模型
   */
  private async loadExistingModel(userId: string): Promise<VoiceProfile | null> {
    const profile = await this.loadProfile(userId)
    if (!profile) return null

    // 检查模型文件是否存在
    try {
      await fs.access(profile.modelPath)
      return profile
    } catch {
      return null
    }
  }

  /**
   * 保存声音配置
   */
  private async saveProfile(profile: VoiceProfile): Promise<void> {
    const profilePath = path.join(this.config.modelDir, profile.userId, 'profile.json')
    await fs.writeFile(profilePath, JSON.stringify(profile, null, 2))
  }

  /**
   * 续期声音配置
   */
  async renewProfile(profile: VoiceProfile): Promise<VoiceProfile> {
    const days = profile.userType === 'wechat' ? 30 : 7
    profile.expiresAt = new Date()
    profile.expiresAt.setDate(profile.expiresAt.getDate() + days)

    await this.saveProfile(profile)
    return profile
  }

  /**
   * 删除声音配置
   */
  async deleteProfile(userId: string): Promise<void> {
    if (!validateUserId(userId)) {
      throw new Error('Invalid user ID')
    }

    const modelPath = path.join(this.config.modelDir, userId)
    await fs.rm(modelPath, { recursive: true, force: true })
  }

  /**
   * 检查配置是否过期
   */
  isExpired(profile: VoiceProfile): boolean {
    return new Date() > profile.expiresAt
  }
}

// 单例实例
let clonerInstance: VoiceCloner | null = null

/**
 * 获取声音克隆器实例
 */
export function getVoiceCloner(): VoiceCloner {
  if (!clonerInstance) {
    clonerInstance = new VoiceCloner()
  }
  return clonerInstance
}
