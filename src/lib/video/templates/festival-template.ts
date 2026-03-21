/**
 * 节日视频模板配置
 * 为不同节日提供不同的视觉风格
 */

import type { FestivalType } from '@/lib/ai/context/festival-service'

/**
 * 节日模板配置
 */
export interface FestivalTemplateConfig {
  /** 节日 ID */
  festival: FestivalType
  /** 节日名称 */
  name: string
  /** 背景颜色（渐变起始） */
  backgroundColor: string
  /** 背景颜色（渐变结束） */
  backgroundColorEnd?: string
  /** 文字颜色 */
  textColor: string
  /** 强调色 */
  accentColor: string
  /** 装饰元素列表 */
  decorations: string[]
  /** 动画效果列表 */
  animations: string[]
  /** 背景音效（可选） */
  bgMusic?: string
  /** 字体风格 */
  fontFamily?: string
  /** 字幕样式 */
  subtitleStyle?: {
    fontSize: number
    fontWeight: number
    textShadow: string
  }
}

/**
 * 所有节日模板配置
 */
export const FESTIVAL_TEMPLATES: Record<FestivalType, FestivalTemplateConfig> = {
  spring_festival: {
    festival: 'spring_festival',
    name: '春节',
    backgroundColor: '#D4242B',  // 中国红
    backgroundColorEnd: '#8B0000',
    textColor: '#FFD700',        // 金色
    accentColor: '#FF6B6B',
    decorations: ['灯笼', '鞭炮', '福字', '龙', '春联', '红包'],
    animations: ['fireworks', 'floating-lanterns', 'golden-particles'],
    bgMusic: '/audio/spring-festival-bg.mp3',
    fontFamily: 'Noto Serif SC',
    subtitleStyle: {
      fontSize: 48,
      fontWeight: 700,
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
  },

  lantern_festival: {
    festival: 'lantern_festival',
    name: '元宵节',
    backgroundColor: '#FF6B35',
    backgroundColorEnd: '#D4380D',
    textColor: '#FFF5E6',
    accentColor: '#FFD93D',
    decorations: ['花灯', '汤圆', '灯谜', '兔子灯'],
    animations: ['lantern-glow', 'floating-particles'],
    subtitleStyle: {
      fontSize: 46,
      fontWeight: 600,
      textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
    },
  },

  qingming: {
    festival: 'qingming',
    name: '清明节',
    backgroundColor: '#90EE90',
    backgroundColorEnd: '#228B22',
    textColor: '#FFFFFF',
    accentColor: '#98FB98',
    decorations: ['柳枝', '风筝', '青团', '春雨'],
    animations: ['falling-leaves', 'rain-drops'],
    subtitleStyle: {
      fontSize: 44,
      fontWeight: 500,
      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
    },
  },

  labor_day: {
    festival: 'labor_day',
    name: '五一劳动节',
    backgroundColor: '#4169E1',
    backgroundColorEnd: '#1E3A8A',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    decorations: ['工具', '鲜花', '阳光'],
    animations: ['sun-rays', 'sparkle'],
    subtitleStyle: {
      fontSize: 44,
      fontWeight: 600,
      textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
    },
  },

  dragon_boat: {
    festival: 'dragon_boat',
    name: '端午节',
    backgroundColor: '#2E8B57',
    backgroundColorEnd: '#006400',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    decorations: ['龙舟', '粽子', '艾草', '五彩绳'],
    animations: ['wave-effect', 'dragon-fly'],
    bgMusic: '/audio/dragon-boat-bg.mp3',
    subtitleStyle: {
      fontSize: 46,
      fontWeight: 600,
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
  },

  mid_autumn: {
    festival: 'mid_autumn',
    name: '中秋节',
    backgroundColor: '#1a1a2e',
    backgroundColorEnd: '#16213e',
    textColor: '#f5f5dc',
    accentColor: '#FFD700',
    decorations: ['月亮', '月饼', '兔子', '桂花', '灯笼'],
    animations: ['moon-glow', 'falling-petals', 'star-twinkle'],
    bgMusic: '/audio/mid-autumn-bg.mp3',
    subtitleStyle: {
      fontSize: 48,
      fontWeight: 600,
      textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
    },
  },

  national_day: {
    festival: 'national_day',
    name: '国庆节',
    backgroundColor: '#DE2910',
    backgroundColorEnd: '#8B0000',
    textColor: '#FFDE00',
    accentColor: '#FFFFFF',
    decorations: ['国旗', '烟花', '天安门', '和平鸽'],
    animations: ['fireworks', 'flag-wave', 'doves-fly'],
    subtitleStyle: {
      fontSize: 48,
      fontWeight: 700,
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
  },

  double_11: {
    festival: 'double_11',
    name: '双11',
    backgroundColor: '#FF4500',
    backgroundColorEnd: '#FF1493',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    decorations: ['购物车', '红包', '优惠券', '快递'],
    animations: ['money-fall', 'flash-sale', 'sparkle'],
    subtitleStyle: {
      fontSize: 44,
      fontWeight: 700,
      textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
    },
  },

  double_12: {
    festival: 'double_12',
    name: '双12',
    backgroundColor: '#FF6347',
    backgroundColorEnd: '#DC143C',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    decorations: ['礼物', '购物袋', '折扣'],
    animations: ['sale-flash', 'sparkle'],
    subtitleStyle: {
      fontSize: 44,
      fontWeight: 600,
      textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
    },
  },

  christmas: {
    festival: 'christmas',
    name: '圣诞节',
    backgroundColor: '#228B22',
    backgroundColorEnd: '#006400',
    textColor: '#FFFFFF',
    accentColor: '#FF0000',
    decorations: ['圣诞树', '礼物', '雪花', '圣诞老人', '铃铛'],
    animations: ['snow-fall', 'christmas-lights', 'star-glow'],
    bgMusic: '/audio/christmas-bg.mp3',
    subtitleStyle: {
      fontSize: 46,
      fontWeight: 600,
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
  },

  new_year: {
    festival: 'new_year',
    name: '元旦',
    backgroundColor: '#1E90FF',
    backgroundColorEnd: '#000080',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    decorations: ['烟花', '钟声', '数字', '香槟'],
    animations: ['fireworks', 'countdown', 'confetti'],
    subtitleStyle: {
      fontSize: 48,
      fontWeight: 700,
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
  },

  valentines: {
    festival: 'valentines',
    name: '情人节',
    backgroundColor: '#FF69B4',
    backgroundColorEnd: '#FF1493',
    textColor: '#FFFFFF',
    accentColor: '#FFB6C1',
    decorations: ['心形', '玫瑰', '巧克力', '爱心'],
    animations: ['hearts-float', 'petals-fall', 'sparkle'],
    subtitleStyle: {
      fontSize: 44,
      fontWeight: 600,
      textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
    },
  },

  womens_day: {
    festival: 'womens_day',
    name: '三八妇女节',
    backgroundColor: '#FF69B4',
    backgroundColorEnd: '#FF1493',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    decorations: ['鲜花', '礼物', '蝴蝶结'],
    animations: ['flowers-bloom', 'sparkle'],
    subtitleStyle: {
      fontSize: 44,
      fontWeight: 600,
      textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
    },
  },

  mothers_day: {
    festival: 'mothers_day',
    name: '母亲节',
    backgroundColor: '#FFB6C1',
    backgroundColorEnd: '#FF69B4',
    textColor: '#4A4A4A',
    accentColor: '#FF1493',
    decorations: ['康乃馨', '心形', '礼物'],
    animations: ['flowers-bloom', 'hearts-float'],
    subtitleStyle: {
      fontSize: 46,
      fontWeight: 600,
      textShadow: '1px 1px 2px rgba(255,255,255,0.5)',
    },
  },

  fathers_day: {
    festival: 'fathers_day',
    name: '父亲节',
    backgroundColor: '#4169E1',
    backgroundColorEnd: '#000080',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    decorations: ['领带', '礼物', '工具'],
    animations: ['sparkle', 'sun-rays'],
    subtitleStyle: {
      fontSize: 46,
      fontWeight: 700,
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
  },

  childrens_day: {
    festival: 'childrens_day',
    name: '儿童节',
    backgroundColor: '#87CEEB',
    backgroundColorEnd: '#4169E1',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    decorations: ['气球', '礼物', '糖果', '玩具', '彩虹'],
    animations: ['balloons-float', 'confetti', 'rainbow'],
    subtitleStyle: {
      fontSize: 48,
      fontWeight: 700,
      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    },
  },

  teachers_day: {
    festival: 'teachers_day',
    name: '教师节',
    backgroundColor: '#DDA0DD',
    backgroundColorEnd: '#9370DB',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    decorations: ['花朵', '书本', '蜡烛'],
    animations: ['flowers-bloom', 'sparkle'],
    subtitleStyle: {
      fontSize: 46,
      fontWeight: 600,
      textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
    },
  },

  chinese_valentines: {
    festival: 'chinese_valentines',
    name: '七夕节',
    backgroundColor: '#191970',
    backgroundColorEnd: '#000080',
    textColor: '#FFFFFF',
    accentColor: '#FFB6C1',
    decorations: ['牛郎', '织女', '鹊桥', '星星', '月亮'],
    animations: ['star-twinkle', 'milky-way', 'magpies-fly'],
    subtitleStyle: {
      fontSize: 46,
      fontWeight: 600,
      textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
    },
  },
}

/**
 * 默认模板配置
 */
export const DEFAULT_TEMPLATE: FestivalTemplateConfig = {
  festival: 'spring_festival',
  name: '默认',
  backgroundColor: '#1a1a2e',
  backgroundColorEnd: '#16213e',
  textColor: '#ffffff',
  accentColor: '#FFD700',
  decorations: [],
  animations: ['sparkle'],
  subtitleStyle: {
    fontSize: 44,
    fontWeight: 600,
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  },
}

/**
 * 获取节日模板
 * @param festival 节日类型
 * @returns 模板配置
 */
export function getFestivalTemplate(festival?: FestivalType): FestivalTemplateConfig {
  if (!festival) return DEFAULT_TEMPLATE
  return FESTIVAL_TEMPLATES[festival] || DEFAULT_TEMPLATE
}

/**
 * 获取当前节日的模板
 * 自动检测当前时间并返回对应模板
 */
export function getCurrentFestivalTemplate(): FestivalTemplateConfig {
  const { getTimeContext } = require('@/lib/ai/context')
  const context = getTimeContext()
  return getFestivalTemplate(context.currentFestival?.id)
}
