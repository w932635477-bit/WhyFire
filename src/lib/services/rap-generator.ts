/**
 * Suno + Seed-VC Rap 生成器
 *
 * 5 步流程：
 * 1. Claude 生成歌词
 * 2. Suno 生成 Rap（AI 音色）
 * 3. Demucs 人声分离
 * 4. Seed-VC 零样本音色替换（无需训练）
 * 5. FFmpeg 混音
 *
 * 技术方案: Seed-VC 零样本声音克隆
 */

// 初始化全局代理（必须在其他 import 之前）
import '@/lib/proxy'

import { getSunoClient } from '@/lib/music/suno-client'
import { getSeedVCClient, type ISeedVCClient } from '@/lib/audio/seed-vc-client'
import { getDemucsClient, type SeparationResult } from '@/lib/audio/demucs-client'
import { FFmpegProcessor } from '@/lib/audio/ffmpeg-processor'
import { getBGMById, getDefaultBGM, type BGMMetadata } from '@/lib/music/bgm-library'
import { uploadToOSS, isOSSConfigured } from '@/lib/oss'
import { generateWithClaude } from '@/lib/ai/claude-client'
import type { DialectCode } from '@/types/dialect'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Rap 生成参数
 */
export interface RapGenerationParams {
  /** 用户 ID */
  userId: string
  /** 用户描述（职业、爱好、想说的） */
  userDescription: string
  /** 方言 */
  dialect: DialectCode
  /** 用户参考音频 ID（OSS 中的参考音频，1-30 秒） */
  referenceAudioId: string
  /** BGM ID（从 BGM 库选择，可选） */
  bgmId?: string
  /** 歌词（可选，如果不提供则自动生成） */
  lyrics?: string
}

/**
 * 生成步骤
 */
export type GenerationStep =
  | 'lyrics'      // 歌词生成
  | 'suno'        // Suno 生成 Rap
  | 'separation'  // 人声分离
  | 'conversion'  // 音色替换
  | 'mixing'      // 混音

/**
 * 生成进度
 */
export interface GenerationProgress {
  /** 当前步骤 */
  step: GenerationStep
  /** 步骤名称 */
  stepName: string
  /** 进度 (0-100) */
  progress: number
  /** 消息 */
  message?: string
}

/**
 * Rap 生成结果
 */
export interface RapGenerationResult {
  /** 最终音频 URL */
  audioUrl: string
  /** 音频时长（秒） */
  duration: number
  /** 歌词 */
  lyrics: string
  /** 使用的方言 */
  dialect: DialectCode
  /** 任务 ID */
  taskId: string
}

/**
 * 进度回调
 */
export type ProgressCallback = (progress: GenerationProgress) => void

// ============================================================================
// Rap 生成器
// ============================================================================

/**
 * Suno + Seed-VC Rap 生成器
 */
export class RapGeneratorSunoRvc {
  private sunoClient = getSunoClient()
  private seedVCClient: ISeedVCClient = getSeedVCClient()
  private demucsClient = getDemucsClient()
  private ffmpegProcessor = new FFmpegProcessor()

  /**
   * 生成 Rap
   *
   * @param params 生成参数
   * @param onProgress 进度回调
   * @returns 生成结果
   */
  async generate(
    params: RapGenerationParams,
    onProgress?: ProgressCallback
  ): Promise<RapGenerationResult> {
    const { userId, userDescription, dialect, referenceAudioId, bgmId, lyrics: providedLyrics } = params
    const taskId = `${userId}-${Date.now()}`

    // 获取 BGM 元数据
    const bgmMetadata = bgmId
      ? getBGMById(bgmId)
      : getDefaultBGM()

    if (!bgmMetadata) {
      throw new Error(`BGM not found: ${bgmId || 'default'}. Please add BGM to the library or provide a valid bgmId.`)
    }

    console.log(`[RapGenerator] Using BGM: ${bgmMetadata.id} (${bgmMetadata.bpm} BPM)`)

    // Step 1: 生成歌词
    onProgress?.({
      step: 'lyrics',
      stepName: '生成歌词',
      progress: 0,
      message: '正在生成个性化歌词...',
    })

    const lyrics = providedLyrics || await this.generateLyrics(userDescription, dialect)

    onProgress?.({
      step: 'lyrics',
      stepName: '生成歌词',
      progress: 100,
      message: '歌词生成完成',
    })

    // Step 2: Suno 生成 Rap（注入 BGM 信息）
    onProgress?.({
      step: 'suno',
      stepName: '生成 Rap',
      progress: 0,
      message: '正在使用 Suno 生成 Rap...',
    })

    const sunoResult = await this.sunoClient.generate({
      lyrics,
      dialect,
      style: 'rap',
      title: `WhyFire ${dialect} Rap`,
      bgm: {
        bpm: bgmMetadata.bpm,
        styleTags: bgmMetadata.styleTags,
        mood: bgmMetadata.mood,
      },
    })

    if (!sunoResult.audioUrl) {
      throw new Error('Suno generation failed: no audio URL')
    }

    onProgress?.({
      step: 'suno',
      stepName: '生成 Rap',
      progress: 100,
      message: `Rap 生成完成 (${sunoResult.duration}s)`,
    })

    // Step 3: Demucs 人声分离
    onProgress?.({
      step: 'separation',
      stepName: '人声分离',
      progress: 0,
      message: '正在分离人声和伴奏...',
    })

    const separationResult = await this.demucsClient.separate({
      audioUrl: sunoResult.audioUrl,
      model: 'htdemucs',
    })

    if (!separationResult.vocals) {
      throw new Error('Demucs separation failed: no vocals')
    }

    onProgress?.({
      step: 'separation',
      stepName: '人声分离',
      progress: 100,
      message: '人声分离完成',
    })

    // Step 4: Seed-VC 零样本音色替换
    onProgress?.({
      step: 'conversion',
      stepName: '音色替换',
      progress: 0,
      message: '正在替换为用户音色...',
    })

    // 验证参考音频 URL
    // referenceAudioId 应该是完整的 OSS URL（从上传 API 获取）
    const referenceAudioUrl = referenceAudioId.startsWith('http')
      ? referenceAudioId  // 已经是完整 URL
      : (() => {
          // 向后兼容：如果不是完整 URL，尝试构建（但这不是推荐方式）
          const bucket = process.env.OSS_BUCKET
          const region = process.env.OSS_REGION || 'oss-cn-beijing'
          console.warn('[RapGenerator] referenceAudioId should be a complete URL from upload API')
          return `https://${bucket}.${region}.aliyuncs.com/voice-references/${referenceAudioId}`
        })()

    console.log(`[RapGenerator] Reference audio: ${referenceAudioUrl}`)

    const seedVCResult = await this.seedVCClient.convert({
      sourceAudio: separationResult.vocals,
      referenceAudio: referenceAudioUrl,
      f0Condition: true,  // Rap 模式必须启用 F0 条件化
      fp16: true,
    })

    // 详细错误处理
    if (!seedVCResult.outputAudio) {
      const errorMsg = seedVCResult.error || 'Unknown error - no output generated'
      console.error('[RapGenerator] Seed-VC conversion failed:', {
        status: seedVCResult.status,
        error: errorMsg,
        taskId: seedVCResult.taskId,
        processingTime: seedVCResult.processingTime,
      })
      throw new Error(`Seed-VC 音色转换失败: ${errorMsg}`)
    }

    onProgress?.({
      step: 'conversion',
      stepName: '音色替换',
      progress: 100,
      message: '音色替换完成',
    })

    // Step 5: FFmpeg 混音（使用用户指定的 BGM）
    onProgress?.({
      step: 'mixing',
      stepName: '混音合成',
      progress: 0,
      message: '正在与 BGM 混音...',
    })

    // 下载 Seed-VC 输出音频
    const convertedAudioUrl = seedVCResult.outputAudio!
    if (!convertedAudioUrl.startsWith('http')) {
      throw new Error(`Seed-VC output must be a full URL, got: ${convertedAudioUrl}`)
    }

    console.log(`[RapGenerator] Downloading Seed-VC output: ${convertedAudioUrl}`)
    const convertedAudioRes = await fetch(convertedAudioUrl, {
      signal: AbortSignal.timeout(60000),
    })
    if (!convertedAudioRes.ok) {
      throw new Error(`Failed to download Seed-VC audio: ${convertedAudioRes.status}`)
    }
    const convertedAudioBuffer = Buffer.from(await convertedAudioRes.arrayBuffer())

    // 下载用户指定的 BGM（而不是 Demucs 分离的伴奏）
    console.log(`[RapGenerator] Downloading BGM: ${bgmMetadata.url}`)
    const bgmRes = await fetch(bgmMetadata.url, {
      signal: AbortSignal.timeout(60000),
    })
    if (!bgmRes.ok) {
      throw new Error(`Failed to download BGM: ${bgmRes.status}`)
    }
    const bgmBuffer = Buffer.from(await bgmRes.arrayBuffer())

    // 计算时长
    const vocalDuration = seedVCResult.duration || sunoResult.duration || 0

    // 决定是否循环 BGM
    const shouldLoopBgm = bgmMetadata.duration > 0 && bgmMetadata.duration < vocalDuration * 0.9

    console.log(`[RapGenerator] Mixing: vocal=${vocalDuration}s, bgm=${bgmMetadata.duration}s, loop=${shouldLoopBgm}`)

    // 混音
    const mixResult = await this.ffmpegProcessor.mixTracks(convertedAudioBuffer, bgmBuffer, {
      vocalVolume: 1.0,
      bgmVolume: 0.3,
      loopBgm: shouldLoopBgm,
    })

    // 上传到 OSS（优先）或保存到本地
    let audioUrl: string

    if (isOSSConfigured()) {
      // 上传到 OSS，返回公网可访问的 URL
      const ossResult = await uploadToOSS(
        mixResult.audioBuffer!,
        `final-rap-${taskId}.mp3`,
        { folder: 'rap', contentType: 'audio/mpeg' }
      )

      if (ossResult.success && ossResult.url) {
        // 使用代理 URL 以兼容 COEP (Cross-Origin-Embedder-Policy)
        audioUrl = this.getProxiedAudioUrl(ossResult.url)
        console.log(`[RapGenerator] Uploaded to OSS: ${ossResult.url}`)
        console.log(`[RapGenerator] Proxied URL: ${audioUrl}`)
      } else {
        console.warn(`[RapGenerator] OSS upload failed: ${ossResult.error}, falling back to local file`)
        // 回退到本地文件
        audioUrl = await this.saveToLocal(mixResult.audioBuffer!, taskId)
      }
    } else {
      // OSS 未配置，保存到本地
      console.log('[RapGenerator] OSS not configured, saving to local file')
      audioUrl = await this.saveToLocal(mixResult.audioBuffer!, taskId)
    }

    onProgress?.({
      step: 'mixing',
      stepName: '混音合成',
      progress: 100,
      message: '混音完成',
    })

    return {
      audioUrl,
      duration: mixResult.processedDuration || 0,
      lyrics,
      dialect,
      taskId,
    }
  }

  /**
   * 保存音频到本地文件
   * 注意：本地文件 URL (file://) 无法在浏览器中直接访问
   */
  private async saveToLocal(audioBuffer: Buffer, taskId: string): Promise<string> {
    const outputDir = join(process.cwd(), 'temp')
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }
    const outputFileName = `final-rap-${taskId}.mp3`
    const outputPath = join(outputDir, outputFileName)
    writeFileSync(outputPath, audioBuffer)
    console.log(`[RapGenerator] Saved to local: ${outputPath}`)
    return `file://${outputPath}`
  }

  /**
   * 获取代理音频 URL
   * 通过 /api/audio-proxy 代理 OSS 资源，添加 CORP 头以兼容 COEP
   *
   * @param ossUrl OSS 原始 URL
   * @returns 代理后的 URL
   */
  private getProxiedAudioUrl(ossUrl: string): string {
    // 解析 OSS URL，提取路径
    // 例如: https://whyfire-02.oss-cn-beijing.aliyuncs.com/rap/xxx.mp3 -> rap/xxx.mp3
    const ossPath = ossUrl.replace(/^https?:\/\/[^/]+\//, '')
    return `/api/audio-proxy?path=${encodeURIComponent(ossPath)}`
  }

  /**
   * 生成歌词（调用 Claude API）
   * 基于《八方来财》《野狼disco》等爆款分析，设计传播性强的歌词
   */
  private async generateLyrics(description: string, dialect: DialectCode): Promise<string> {
    // 方言名称和风格映射 - 增加爆款元素
    const dialectConfig: Record<DialectCode, {
      name: string
      style: string
      keywords: string[]
      culturalSymbols: string[]  // 地域文化符号
      goldenPhrases: string[]     // 金句参考
    }> = {
      original: {
        name: '普通话',
        style: '标准说唱',
        keywords: ['flow', '押韵', '节奏'],
        culturalSymbols: ['街头', '夜市', '烧烤摊', '电动车'],
        goldenPhrases: ['一路生花', '冲就完了', '干就完了'],
      },
      cantonese: {
        name: '粤语',
        style: '港式嘻哈',
        keywords: ['港风', '江湖', '义气'],
        culturalSymbols: ['茶餐厅', '麻将馆', '维港', '牛杂'],
        goldenPhrases: ['捞得掂', '顶硬上', '大把世界'],
      },
      sichuan: {
        name: '四川话',
        style: '成都Trap',
        keywords: ['火锅', '熊猫', '安逸'],
        culturalSymbols: ['宽窄巷子', '串串香', '盖碗茶', '麻将'],
        goldenPhrases: ['巴适得板', '要得', '雄起'],
      },
      dongbei: {
        name: '东北话',
        style: '东北说唱',
        keywords: ['豪爽', '实在', '热乎'],
        culturalSymbols: ['炕头', '大集', '冰雕', '二人转'],
        goldenPhrases: ['必须的', '没毛病', '整就完了'],
      },
      shaanxi: {
        name: '陕西话',
        style: '秦腔说唱',
        keywords: ['古城', '兵马俑', 'biangbiang'],
        culturalSymbols: ['城墙根', '回民街', '油泼面', '羊肉泡'],
        goldenPhrases: ['嘹咋咧', '么麻达', '额滴神'],
      },
      wu: {
        name: '上海话',
        style: '海派说唱',
        keywords: ['弄堂', '精致', '摩登'],
        culturalSymbols: ['外滩', '生煎', '石库门', '咖啡'],
        goldenPhrases: ['老灵额', '不要太', '有腔调'],
      },
      minnan: {
        name: '闽南语',
        style: '台语说唱',
        keywords: ['打拼', '兄弟', '海风'],
        culturalSymbols: ['夜市', '庙口', '海港', '蚵仔煎'],
        goldenPhrases: ['爱拼才会赢', '兄弟一条心', '冲冲冲'],
      },
      tianjin: {
        name: '天津话',
        style: '津味说唱',
        keywords: ['相声', '快板', '逗趣'],
        culturalSymbols: ['茶馆', '狗不理', '海河', '煎饼果子'],
        goldenPhrases: ['倍儿', '介是嘛', '哏儿都'],
      },
      nanjing: {
        name: '南京话',
        style: '金陵说唱',
        keywords: ['鸭血粉丝', '秦淮河', '城墙'],
        culturalSymbols: ['夫子庙', '老门东', '盐水鸭', '紫金山'],
        goldenPhrases: ['阿要辣油', '滴板', '多大事'],
      },
    }

    const config = dialectConfig[dialect]

    // 爆款歌词生成 Prompt - 参考揽佬《八方来财》《野狼disco》等
    const prompt = `你是一位擅长创作**病毒式传播**说唱的歌词创作人。你的作品参考了《八方来财》《野狼disco》等爆款神曲的风格。

## 任务
为用户创作一段${config.name}风格的Rap歌词，主题是：${description}

## 爆款歌词核心法则（必须严格遵守）

### 1. 开头放 Hook（最重要！）
- **前3行必须是洗脑金句**，让人一听就能记住
- 参考风格："来财来，我们这憋佬" / "左边跟我一起画个龙"
- 金句要短、要重复、要有节奏感

### 2. 设计传播金句
必须包含 **1-2 句可以单独传播的金句**，类似：
- "${config.goldenPhrases[0]}"
- "${config.culturalSymbols[0]}里的故事"

### 3. 地域文化符号（至少3个）
融入以下${config.name}特色元素：${config.culturalSymbols.join('、')}
${config.keywords.map(k => `- ${k}`).join('\n')}

### 4. 画面感 + 接地气
- 用具体场景代替抽象表达
- 例如："别墅里面唱K" 比 "很有钱" 更有画面感
- 写市井生活、普通人能共情的内容

### 5. 积极正能量
- 结尾要有希望、有力量
- 类似"大展鸿图"的气势

## 歌词结构（必须遵守）

[Hook]
（3-4行洗脑金句，放在最开头！重复2遍）

[Verse 1]
（6-8行主歌，叙事+画面感）

[Chorus]
（4-6行副歌，朗朗上口，包含金句）

[Verse 2]
（6-8行主歌，情绪递进）

[Hook]
（重复开头的洗脑金句）

[Outro]
（2-3行收尾，正能量）

## 方言要求
- 大量使用${config.name}特色词汇和表达
- 韵脚要符合方言发音
- 可以中英夹杂增加节奏感

请直接输出歌词，不要任何解释。`

    try {
      const lyrics = await generateWithClaude(prompt, {
        maxTokens: 2048,
        temperature: 0.9, // 提高温度增加创意和随机性
      })

      return lyrics.trim()
    } catch (error) {
      // Claude API 失败时回退到简单模板
      console.error('Claude 歌词生成失败，使用回退模板:', error)

      return `[Chorus]
${config.goldenPhrases[0]}
${config.culturalSymbols[0]}里的故事
`
    }
  }

  /**
   * 检查所有服务可用性
   */
  async checkServices(): Promise<{
    suno: boolean
    seedvc: boolean
    demucs: boolean
    ffmpeg: boolean
  }> {
    const [suno, seedvc, demucs] = await Promise.all([
      this.sunoClient.isConfigured(),
      this.seedVCClient.isAvailable(),
      this.demucsClient.isAvailable(),
    ])

    const ffmpeg = await this.ffmpegProcessor.isAvailable()

    return { suno, seedvc, demucs, ffmpeg }
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let generatorInstance: RapGeneratorSunoRvc | null = null

/**
 * 获取 Rap 生成器实例
 */
export function getRapGenerator(): RapGeneratorSunoRvc {
  if (!generatorInstance) {
    generatorInstance = new RapGeneratorSunoRvc()
  }
  return generatorInstance
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 生成 Rap（便捷函数）
 */
export async function generateRap(
  params: RapGenerationParams,
  onProgress?: ProgressCallback
): Promise<RapGenerationResult> {
  const generator = getRapGenerator()
  return generator.generate(params, onProgress)
}
