/**
 * 音频提取工具
 * 从视频文件中提取音频，使用 FFmpeg.wasm
 */

import { getFFmpegClient } from '../ffmpeg/ffmpeg-client'

export interface ExtractAudioResult {
  audioBlob: Blob
  audioUrl: string
  duration: number
}

export interface ExtractAudioOptions {
  onProgress?: (progress: number) => void
  outputFormat?: 'mp3' | 'wav' | 'aac'
}

/**
 * 从视频文件中提取音频
 */
export async function extractAudioFromVideo(
  videoFile: File | Blob,
  options: ExtractAudioOptions = {}
): Promise<ExtractAudioResult> {
  const { onProgress, outputFormat = 'mp3' } = options

  // 获取 FFmpeg 客户端
  const client = getFFmpegClient()

  // 加载 FFmpeg（如果尚未加载）
  onProgress?.(0.05)
  await client.load({
    onProgress: (p) => onProgress?.(0.05 + p * 0.15), // 5% - 20%
  })

  // 生成文件名
  const inputName = 'input_video'
  const outputName = `output_audio.${outputFormat}`

  // 写入视频文件
  onProgress?.(0.25)
  await client.writeFile(inputName, videoFile)

  // 设置进度回调
  client.onProgress(({ ratio }) => {
    // FFmpeg 处理进度占 25% - 90%
    onProgress?.(0.25 + ratio * 0.65)
  })

  // 构建 FFmpeg 命令
  const args = buildExtractAudioArgs(inputName, outputName, outputFormat)

  // 执行提取
  await client.exec(args)

  // 读取输出文件
  onProgress?.(0.92)
  const mimeType = getMimeType(outputFormat)
  const audioBlob = await client.readFileAsBlob(outputName, mimeType)

  // 获取音频时长
  const duration = await getAudioDuration(audioBlob)

  // 创建 Object URL
  const audioUrl = URL.createObjectURL(audioBlob)

  // 清理临时文件
  try {
    await client.deleteFile(inputName)
    await client.deleteFile(outputName)
  } catch (e) {
    console.warn('[AudioExtractor] 清理临时文件失败:', e)
  }

  onProgress?.(1.0)

  return {
    audioBlob,
    audioUrl,
    duration,
  }
}

/**
 * 构建提取音频的 FFmpeg 命令参数
 */
function buildExtractAudioArgs(
  inputName: string,
  outputName: string,
  format: 'mp3' | 'wav' | 'aac'
): string[] {
  const args = ['-i', inputName, '-vn'] // -vn: 不包含视频

  switch (format) {
    case 'mp3':
      args.push('-acodec', 'libmp3lame', '-q:a', '2') // 高质量 MP3
      break
    case 'wav':
      args.push('-acodec', 'pcm_s16le') // 16-bit PCM WAV
      break
    case 'aac':
      args.push('-acodec', 'aac', '-b:a', '192k') // 192kbps AAC
      break
  }

  args.push('-y', outputName) // -y: 覆盖输出文件

  return args
}

/**
 * 获取 MIME 类型
 */
function getMimeType(format: 'mp3' | 'wav' | 'aac'): string {
  switch (format) {
    case 'mp3':
      return 'audio/mpeg'
    case 'wav':
      return 'audio/wav'
    case 'aac':
      return 'audio/aac'
    default:
      return 'audio/mpeg'
  }
}

/**
 * 获取音频时长（秒）
 */
async function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.onloadedmetadata = () => {
      resolve(audio.duration)
    }
    audio.onerror = () => {
      console.warn('[AudioExtractor] 无法获取音频时长')
      resolve(0)
    }
    audio.src = URL.createObjectURL(audioBlob)
  })
}

/**
 * 检查文件是否是视频
 */
export function isVideoFile(file: File | Blob): boolean {
  if (file instanceof File) {
    return file.type.startsWith('video/')
  }
  // Blob 没有名字，需要通过 type 判断
  return file.type.startsWith('video/')
}

/**
 * 检查文件是否是音频
 */
export function isAudioFile(file: File | Blob): boolean {
  if (file instanceof File) {
    return file.type.startsWith('audio/')
  }
  return file.type.startsWith('audio/')
}

/**
 * 格式化时长为 mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
