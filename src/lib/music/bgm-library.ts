/**
 * BGM 元数据
 */
export interface BGMMetadata {
  /** BGM ID */
  id: string
  /** 音频 URL（OSS 存储） */
  url: string
  /** BPM */
  bpm: number
  /** 风格标签（直接注入 Suno） */
  styleTags: string
  /** 能量级别 */
  energy: 'low' | 'medium' | 'high'
  /** 情绪标签 */
  mood: string[]
  /** 时长（秒） */
  duration: number
}

/**
 * 转换为 Suno style 参数
 */
export function toSunoStyle(bgm: BGMMetadata): string {
  const parts = [
    bgm.styleTags,
    `${bgm.bpm} BPM`,
    ...bgm.mood,
  ]
  return parts.filter(Boolean).join(', ')
}

/**
 * BGM 库
 *
 * 使用方法：
 * 1. 准备 BGM 文件（MP3/WAV，44100Hz，2-5分钟）
 * 2. 使用 tunebat.com 检测 BPM
 * 3. 人工标注风格和情绪标签
 * 4. 上传到 OSS，获取 URL
 * 5. 添加到此数组
 */
export const BGM_LIBRARY: BGMMetadata[] = [
  {
    id: 'apt-remix',
    url: '/api/audio-proxy?path=bgm/apt-改.mp3',
    bpm: 99,
    styleTags: 'trap, dark, heavy 808, southern hip-hop',
    energy: 'high',
    mood: ['aggressive', 'confident'],
    duration: 128,
  },
  {
    id: 'brazilian-phonk',
    url: '/api/audio-proxy?path=bgm/brazli-改.mp3',
    bpm: 70,
    styleTags: 'brazilian phonk, drill, heavy bass, funk carioca',
    energy: 'high',
    mood: ['intense', 'energetic'],
    duration: 133,
  },
  {
    id: 'fortune-flow',
    url: '/api/audio-proxy?path=bgm/八方来财.mp3',
    bpm: 137,
    styleTags: 'pop rap, upbeat, positive, chinese style',
    energy: 'high',
    mood: ['happy', 'confident'],
    duration: 105,
  },
  {
    id: 'karma-dark',
    url: '/api/audio-proxy?path=bgm/因果-改.mp3',
    bpm: 110,
    styleTags: 'dark trap, drill, mysterious, heavy bass',
    energy: 'medium',
    mood: ['dark', 'mysterious'],
    duration: 148,
  },
  {
    id: 'warm-gray',
    url: '/api/audio-proxy?path=bgm/暖灰-改.mp3',
    bpm: 78,
    styleTags: 'lo-fi, chill, ambient, smooth, jazz',
    energy: 'low',
    mood: ['relaxed', 'dreamy'],
    duration: 101,
  },
  {
    id: 'wonderful-01',
    url: '/api/audio-proxy?path=bgm/精彩01.mp3',
    bpm: 120,
    styleTags: 'pop rap, upbeat, positive, energetic',
    energy: 'high',
    mood: ['happy', 'confident'],
    duration: 136,
  },
]

/**
 * 根据 ID 获取 BGM 元数据
 */
export function getBGMById(id: string): BGMMetadata | undefined {
  return BGM_LIBRARY.find(bgm => bgm.id === id)
}

/**
 * 获取默认 BGM（向后兼容）
 */
export function getDefaultBGM(): BGMMetadata | undefined {
  return BGM_LIBRARY[0]
}

/**
 * 列出所有可用的 BGM
 */
export function listAllBGM(): BGMMetadata[] {
  return BGM_LIBRARY
}
