/**
 * 视频转场效果配置
 * 用于 FFmpeg 视频合成时的转场动画
 */

export type TransitionType =
  | 'none'        // 无转场
  | 'fade'        // 淡入淡出
  | 'dissolve'    // 溶解
  | 'wipe-left'   // 左擦除
  | 'wipe-right'  // 右擦除
  | 'wipe-up'     // 上擦除
  | 'wipe-down'   // 下擦除
  | 'slide-left'  // 左滑动
  | 'slide-right' // 右滑动
  | 'zoom-in'     // 放大
  | 'zoom-out'    // 缩小
  | 'spin'        // 旋转
  | 'circle-open' // 圆形展开

export interface VideoTransition {
  id: TransitionType
  name: string
  description: string
  icon: string
  ffmpegFilter: (duration: number) => string
  defaultDuration: number // 默认持续时间（秒）
}

// FFmpeg 转场配置
export const VIDEO_TRANSITIONS: Record<TransitionType, VideoTransition> = {
  none: {
    id: 'none',
    name: '无转场',
    description: '直接切换',
    icon: '⏭️',
    ffmpegFilter: () => '',
    defaultDuration: 0,
  },
  fade: {
    id: 'fade',
    name: '淡入淡出',
    description: '经典淡入淡出效果',
    icon: '🌅',
    ffmpegFilter: (d) => `fade=t=in:st=0:d=${d},fade=t=out:st=${d}:d=${d}`,
    defaultDuration: 0.5,
  },
  dissolve: {
    id: 'dissolve',
    name: '溶解',
    description: '画面溶解过渡',
    icon: '💧',
    ffmpegFilter: (d) => `xfade=transition=dissolve:duration=${d}`,
    defaultDuration: 1,
  },
  'wipe-left': {
    id: 'wipe-left',
    name: '左擦除',
    description: '从左向右擦除',
    icon: '➡️',
    ffmpegFilter: (d) => `xfade=transition=wipeleft:duration=${d}`,
    defaultDuration: 0.5,
  },
  'wipe-right': {
    id: 'wipe-right',
    name: '右擦除',
    description: '从右向左擦除',
    icon: '⬅️',
    ffmpegFilter: (d) => `xfade=transition=wiperight:duration=${d}`,
    defaultDuration: 0.5,
  },
  'wipe-up': {
    id: 'wipe-up',
    name: '上擦除',
    description: '从下向上擦除',
    icon: '⬆️',
    ffmpegFilter: (d) => `xfade=transition=wipeup:duration=${d}`,
    defaultDuration: 0.5,
  },
  'wipe-down': {
    id: 'wipe-down',
    name: '下擦除',
    description: '从上向下擦除',
    icon: '⬇️',
    ffmpegFilter: (d) => `xfade=transition=wipedown:duration=${d}`,
    defaultDuration: 0.5,
  },
  'slide-left': {
    id: 'slide-left',
    name: '左滑动',
    description: '向左滑动切换',
    icon: '↔️',
    ffmpegFilter: (d) => `xfade=transition=slideleft:duration=${d}`,
    defaultDuration: 0.5,
  },
  'slide-right': {
    id: 'slide-right',
    name: '右滑动',
    description: '向右滑动切换',
    icon: '↔️',
    ffmpegFilter: (d) => `xfade=transition=slideright:duration=${d}`,
    defaultDuration: 0.5,
  },
  'zoom-in': {
    id: 'zoom-in',
    name: '放大',
    description: '放大过渡效果',
    icon: '🔍',
    ffmpegFilter: (d) => `zoompan=z='min(zoom+0.0015,1.5)':d=${Math.round(d*25)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`,
    defaultDuration: 1,
  },
  'zoom-out': {
    id: 'zoom-out',
    name: '缩小',
    description: '缩小过渡效果',
    icon: '🔎',
    ffmpegFilter: (d) => `zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':d=${Math.round(d*25)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`,
    defaultDuration: 1,
  },
  spin: {
    id: 'spin',
    name: '旋转',
    description: '旋转过渡效果',
    icon: '🔄',
    ffmpegFilter: (d) => `rotate='2*PI*t/${d}':fillcolor=black:c='none'`,
    defaultDuration: 0.5,
  },
  'circle-open': {
    id: 'circle-open',
    name: '圆形展开',
    description: '圆形遮罩展开',
    icon: '⭕',
    ffmpegFilter: (d) => `format=rgba,geq=lum='if(lte(sqrt((X-W/2)^2+(Y-H/2)^2),W/2*T/${d}),p(X,Y),0)':a='if(lte(sqrt((X-W/2)^2+(Y-H/2)^2),W/2*T/${d}),255,0)'`,
    defaultDuration: 0.5,
  },
}

/**
 * 获取转场滤镜命令
 * @param transition 转场类型
 * @param duration 转场持续时间（秒）
 * @returns FFmpeg 滤镜字符串
 */
export function getTransitionFilter(
  transition: TransitionType,
  duration?: number
): string {
  const t = VIDEO_TRANSITIONS[transition]
  return t.ffmpegFilter(duration ?? t.defaultDuration)
}

/**
 * 计算转场偏移时间
 * @param clipDuration 片段总时长（秒）
 * @param transitionDuration 转场持续时间（秒）
 * @returns 转场开始的时间偏移
 */
export function calculateTransitionOffset(
  clipDuration: number,
  transitionDuration: number
): number {
  return clipDuration - transitionDuration
}

/**
 * 获取默认转场配置
 * @returns 默认转场类型
 */
export function getDefaultTransition(): TransitionType {
  return 'fade'
}

/**
 * 获取所有可用转场列表
 * @returns 转场列表
 */
export function getAvailableTransitions(): VideoTransition[] {
  return Object.values(VIDEO_TRANSITIONS)
}

/**
 * 获取转场信息
 * @param transition 转场类型
 * @returns 转场配置信息
 */
export function getTransitionInfo(transition: TransitionType): VideoTransition {
  return VIDEO_TRANSITIONS[transition]
}
