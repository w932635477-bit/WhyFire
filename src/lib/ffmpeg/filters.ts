/**
 * 视频滤镜系统
 * 基于 FFmpeg 的视频滤镜效果
 */

import type { FFmpegClient } from './ffmpeg-client'

/**
 * 滤镜类型
 */
export type FilterType =
  | 'none' // 无滤镜
  | 'vintage' // 复古
  | 'noir' // 黑白电影
  | 'warm' // 暖色调
  | 'cool' // 冷色调
  | 'vivid' // 鲜艳
  | 'dramatic' // 戏剧化
  | 'retro' // 怀旧
  | 'cyberpunk' // 赛博朋克
  | 'film' // 胶片感

/**
 * 视频滤镜配置
 */
export interface VideoFilter {
  /** 滤镜 ID */
  id: FilterType
  /** 滤镜名称 */
  name: string
  /** 滤镜描述 */
  description: string
  /** 滤镜图标 */
  icon: string
  /** FFmpeg 滤镜字符串 */
  ffmpegFilter: string
  /** 预览图 URL */
  preview?: string
}

/**
 * FFmpeg 滤镜配置
 */
export const VIDEO_FILTERS: Record<FilterType, VideoFilter> = {
  none: {
    id: 'none',
    name: '原始',
    description: '不应用任何滤镜',
    icon: '🖼️',
    ffmpegFilter: '',
  },
  vintage: {
    id: 'vintage',
    name: '复古',
    description: '复古胶片风格',
    icon: '🎬',
    ffmpegFilter: 'curves=vintage,colorbalance=rs=.1:gs=-.05:bs=-.1',
  },
  noir: {
    id: 'noir',
    name: '黑白电影',
    description: '经典黑白电影效果',
    icon: '🎭',
    ffmpegFilter: 'format=gray,colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3',
  },
  warm: {
    id: 'warm',
    name: '暖色调',
    description: '温暖阳光感',
    icon: '☀️',
    ffmpegFilter: 'colorbalance=rs=.1:gs=.05:bs=-.1',
  },
  cool: {
    id: 'cool',
    name: '冷色调',
    description: '清新冷色调',
    icon: '❄️',
    ffmpegFilter: 'colorbalance=rs=-.1:gs=.05:bs=.1',
  },
  vivid: {
    id: 'vivid',
    name: '鲜艳',
    description: '色彩更加鲜艳',
    icon: '🌈',
    ffmpegFilter: 'saturation=1.3,contrast=1.1',
  },
  dramatic: {
    id: 'dramatic',
    name: '戏剧化',
    description: '高对比度效果',
    icon: '⚡',
    ffmpegFilter: 'eq=contrast=1.4:brightness=0.05:saturation=1.2',
  },
  retro: {
    id: 'retro',
    name: '怀旧',
    description: '80年代复古风',
    icon: '📼',
    ffmpegFilter: 'curves=preset=vintage,eq=saturation=0.85,vignette',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: '赛博朋克',
    description: '霓虹灯光效果',
    icon: '🌃',
    ffmpegFilter: 'colorbalance=rs=.2:gs=-.1:bs=.3,eq=contrast=1.2',
  },
  film: {
    id: 'film',
    name: '胶片感',
    description: '电影胶片质感',
    icon: '🎞️',
    ffmpegFilter: 'noise=alls=5:allf=t,eq=contrast=1.05:saturation=0.95',
  },
}

/**
 * 获取所有滤镜列表
 */
export function getAllFilters(): VideoFilter[] {
  return Object.values(VIDEO_FILTERS)
}

/**
 * 获取滤镜配置
 */
export function getFilter(filterType: FilterType): VideoFilter {
  return VIDEO_FILTERS[filterType]
}

/**
 * 生成带滤镜的 FFmpeg 滤镜字符串
 */
export function buildFilterCommand(filter: FilterType): string {
  return VIDEO_FILTERS[filter].ffmpegFilter
}

/**
 * 滤镜应用选项
 */
export interface ApplyFilterOptions {
  /** 输入视频文件名（在 FFmpeg 虚拟文件系统中） */
  inputVideo: string
  /** 输出视频文件名 */
  outputVideo: string
  /** 滤镜类型 */
  filter: FilterType
  /** FFmpeg 客户端实例 */
  ffmpeg: FFmpegClient
  /** 视频编码器，默认 libx264 */
  videoCodec?: string
  /** 音频编码器，默认 copy（直接复制） */
  audioCodec?: string
  /** 额外的 FFmpeg 参数 */
  extraArgs?: string[]
}

/**
 * 应用滤镜到视频
 */
export async function applyFilter(options: ApplyFilterOptions): Promise<string> {
  const {
    inputVideo,
    outputVideo,
    filter,
    ffmpeg,
    videoCodec = 'libx264',
    audioCodec = 'copy',
    extraArgs = [],
  } = options

  // 如果是原始滤镜，直接复制
  if (filter === 'none') {
    await ffmpeg.exec(['-i', inputVideo, '-c', 'copy', '-y', outputVideo])
    return outputVideo
  }

  const filterStr = buildFilterCommand(filter)

  const args: string[] = [
    '-i',
    inputVideo,
    '-vf',
    filterStr,
    '-c:v',
    videoCodec,
    '-c:a',
    audioCodec,
    ...extraArgs,
    '-y',
    outputVideo,
  ]

  await ffmpeg.exec(args)
  return outputVideo
}

/**
 * 批量应用滤镜
 */
export async function applyFilters(
  inputVideo: string,
  outputVideo: string,
  filters: FilterType[],
  ffmpeg: FFmpegClient
): Promise<string> {
  if (filters.length === 0 || filters.every((f) => f === 'none')) {
    await ffmpeg.exec(['-i', inputVideo, '-c', 'copy', '-y', outputVideo])
    return outputVideo
  }

  // 将多个滤镜串联
  const filterStrings = filters
    .filter((f) => f !== 'none')
    .map((f) => buildFilterCommand(f))
    .filter((f) => f.length > 0)

  if (filterStrings.length === 0) {
    await ffmpeg.exec(['-i', inputVideo, '-c', 'copy', '-y', outputVideo])
    return outputVideo
  }

  const combinedFilter = filterStrings.join(',')

  await ffmpeg.exec([
    '-i',
    inputVideo,
    '-vf',
    combinedFilter,
    '-c:v',
    'libx264',
    '-c:a',
    'copy',
    '-y',
    outputVideo,
  ])

  return outputVideo
}

/**
 * 生成滤镜预览命令（生成缩略图）
 */
export function buildPreviewCommand(
  inputVideo: string,
  outputImage: string,
  filter: FilterType,
  timestamp: number = 0
): string[] {
  const filterStr = buildFilterCommand(filter)

  const args: string[] = [
    '-ss',
    timestamp.toString(),
    '-i',
    inputVideo,
    '-vframes',
    '1',
  ]

  if (filterStr) {
    args.push('-vf', filterStr)
  }

  args.push('-y', outputImage)

  return args
}
