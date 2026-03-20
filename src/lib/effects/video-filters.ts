/**
 * 视频滤镜系统（扩展版）
 * 包含适合 Rap 视频的各种滤镜效果
 */

import { VideoFilterType, VideoFilter } from './types'

/**
 * 视频滤镜配置（扩展版）
 */
export const VIDEO_FILTERS: Record<VideoFilterType, VideoFilter> = {
  // 基础滤镜
  none: {
    id: 'none',
    name: '原始',
    description: '不应用任何滤镜',
    icon: '🖼️',
    ffmpegFilter: '',
    suitableStyles: ['all'],
  },
  vintage: {
    id: 'vintage',
    name: '复古',
    description: '复古胶片风格',
    icon: '🎬',
    ffmpegFilter: 'curves=vintage,colorbalance=rs=.1:gs=-.05:bs=-.1',
    suitableStyles: ['old-school', 'lofi'],
  },
  noir: {
    id: 'noir',
    name: '黑白电影',
    description: '经典黑白电影效果',
    icon: '🎭',
    ffmpegFilter: 'format=gray,colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3',
    suitableStyles: ['underground', 'hardcore'],
  },
  warm: {
    id: 'warm',
    name: '暖色调',
    description: '温暖阳光感',
    icon: '☀️',
    ffmpegFilter: 'colorbalance=rs=.1:gs=.05:bs=-.1',
    suitableStyles: ['melodic', 'chill'],
  },
  cool: {
    id: 'cool',
    name: '冷色调',
    description: '清新冷色调',
    icon: '❄️',
    ffmpegFilter: 'colorbalance=rs=-.1:gs=.05:bs=.1',
    suitableStyles: ['night', 'cyberpunk'],
  },
  vivid: {
    id: 'vivid',
    name: '鲜艳',
    description: '色彩更加鲜艳',
    icon: '🌈',
    ffmpegFilter: 'saturation=1.3,contrast=1.1',
    suitableStyles: ['pop', 'upbeat'],
  },
  dramatic: {
    id: 'dramatic',
    name: '戏剧化',
    description: '高对比度效果',
    icon: '⚡',
    ffmpegFilter: 'eq=contrast=1.4:brightness=0.05:saturation=1.2',
    suitableStyles: ['hardcore', 'trap'],
  },
  retro: {
    id: 'retro',
    name: '怀旧',
    description: '80年代复古风',
    icon: '📼',
    ffmpegFilter: 'curves=preset=vintage,eq=saturation=0.85,vignette',
    suitableStyles: ['old-school', 'lofi'],
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: '赛博朋克',
    description: '霓虹灯光效果',
    icon: '🌃',
    ffmpegFilter: 'colorbalance=rs=.2:gs=-.1:bs=.3,eq=contrast=1.2:saturation=1.3',
    suitableStyles: ['cyberpunk', 'trap', 'future'],
  },
  film: {
    id: 'film',
    name: '胶片感',
    description: '电影胶片质感',
    icon: '🎞️',
    ffmpegFilter: 'noise=alls=5:allf=t,eq=contrast=1.05:saturation=0.95',
    suitableStyles: ['lofi', 'melodic'],
  },

  // 新增 Rap 风格滤镜
  vhs: {
    id: 'vhs',
    name: 'VHS 录像带',
    description: '复古录像带效果，带噪点和扫描线',
    icon: '📺',
    ffmpegFilter: 'curves=vintage,noise=alls=8:allf=t,eq=saturation=0.9:contrast=1.1,hqdn3d=4:3:6:4.5',
    suitableStyles: ['old-school', 'lofi', 'underground'],
  },
  glitch: {
    id: 'glitch',
    name: '故障艺术',
    description: 'RGB分离和扫描线效果',
    icon: '🔥',
    ffmpegFilter: 'rgbashift=rh=2:rv=1:gh=-1:gv=2:bh=1:bv=-1,noise=alls=3:allf=t',
    suitableStyles: ['trap', 'cyberpunk', 'drill'],
  },
  shake: {
    id: 'shake',
    name: '画面震动',
    description: '动态震动效果',
    icon: '📳',
    ffmpegFilter: 'crop=iw-4:ih-4:2+mod(t*30,2):2+mod(t*25,2),scale=iw:ih',
    suitableStyles: ['trap', 'hardcore', 'drill'],
  },
  'rgb-shift': {
    id: 'rgb-shift',
    name: 'RGB 分离',
    description: '色彩通道分离效果',
    icon: '🎨',
    ffmpegFilter: 'rgbashift=rh=3:rv=0:gh=-3:gv=0:bh=0:bv=3',
    suitableStyles: ['cyberpunk', 'trap'],
  },
  'neon-glow': {
    id: 'neon-glow',
    name: '霓虹光晕',
    description: '强烈的霓虹光效',
    icon: '💡',
    ffmpegFilter: 'colorbalance=rs=.3:gs=.1:bs=.4,eq=contrast=1.3:saturation=1.5,unsharp=5:5:1.5:5:5:0',
    suitableStyles: ['night', 'cyberpunk', 'trap'],
  },
  pixelate: {
    id: 'pixelate',
    name: '像素化',
    description: '复古像素风格',
    icon: '👾',
    ffmpegFilter: 'scale=iw/8:ih/8:flags=neighbor,scale=iw:ih:flags=neighbor',
    suitableStyles: ['retro', 'underground'],
  },
  mirror: {
    id: 'mirror',
    name: '镜像',
    description: '左右镜像效果',
    icon: '🪞',
    ffmpegFilter: 'hflip,blend=all_mode=average,hflip,overlay=0:0',
    suitableStyles: ['artistic', 'melodic'],
  },
}

/**
 * 获取视频滤镜配置
 */
export function getVideoFilter(type: VideoFilterType): VideoFilter {
  return VIDEO_FILTERS[type]
}

/**
 * 获取所有视频滤镜列表
 */
export function getAllVideoFilters(): VideoFilter[] {
  return Object.values(VIDEO_FILTERS)
}

/**
 * 组合多个滤镜为 FFmpeg 滤镜链
 */
export function combineFilters(filters: VideoFilterType[]): string {
  const filterStrings = filters
    .map((f) => VIDEO_FILTERS[f]?.ffmpegFilter)
    .filter((f) => f && f.length > 0)

  return filterStrings.join(',')
}

/**
 * 获取适合特定风格的滤镜推荐
 */
export function getRecommendedFilters(style: string): VideoFilterType[] {
  return Object.values(VIDEO_FILTERS)
    .filter((filter) => filter.suitableStyles?.includes(style) || filter.suitableStyles?.includes('all'))
    .map((filter) => filter.id)
}
