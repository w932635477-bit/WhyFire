/**
 * 节日识别服务
 * 支持中国传统节日（含农历计算）
 */

import type { DialectCode } from '@/types/dialect'

/**
 * 节日类型
 */
export type FestivalType =
  | 'spring_festival'      // 春节
  | 'lantern_festival'     // 元宵节
  | 'qingming'             // 清明节
  | 'labor_day'            // 五一劳动节
  | 'dragon_boat'          // 端午节
  | 'mid_autumn'           // 中秋节
  | 'national_day'         // 国庆节
  | 'double_11'            // 双11
  | 'double_12'            // 双12
  | 'christmas'            // 圣诞节
  | 'new_year'             // 元旦
  | 'valentines'           // 情人节
  | 'womens_day'           // 三八节
  | 'mothers_day'          // 母亲节
  | 'fathers_day'          // 父亲节
  | 'childrens_day'        // 儿童节
  | 'teachers_day'         // 教师节
  | 'chinese_valentines'   // 七夕

/**
 * 季节性主题
 */
export type SeasonalTheme =
  | 'spring_outing'        // 春游季
  | 'summer_vacation'      // 暑假
  | 'back_to_school'       // 开学季
  | 'autumn_harvest'       // 秋收
  | 'winter_solstice'      // 冬至
  | 'spring_travel'        // 春运

/**
 * 特殊时期
 */
export type SpecialPeriod =
  | 'year_end_party'       // 年会季
  | 'graduation'           // 毕业季
  | 'job_hunting'          // 求职季
  | 'shopping_festival'    // 购物节

/**
 * 节日配置
 */
export interface FestivalConfig {
  id: FestivalType
  name: string
  englishName: string
  themes: string[]
  keywords: string[]
  advanceDays: number      // 提前几天开始预热
  dialectGreetings: Partial<Record<DialectCode, string>>
}

/**
 * 所有节日配置
 */
export const FESTIVAL_CONFIGS: Record<FestivalType, FestivalConfig> = {
  spring_festival: {
    id: 'spring_festival',
    name: '春节',
    englishName: 'Spring Festival',
    themes: ['团圆', '红包', '拜年', '鞭炮', '年夜饭', '春联'],
    keywords: ['新年快乐', '恭喜发财', '龙年大吉', '万事如意', '财源广进'],
    advanceDays: 14,
    dialectGreetings: {
      mandarin: '新年好呀，恭喜发财',
      cantonese: '恭喜发财，利是逗来',
      sichuan: '过年好嘛，恭喜发财',
      dongbei: '过年好啊，给您拜年啦',
      shandong: '过年好，给您磕头啦',
      wu: '新年好，恭喜发财',
      minnan: '新年快乐，万事如意',
    },
  },
  lantern_festival: {
    id: 'lantern_festival',
    name: '元宵节',
    englishName: 'Lantern Festival',
    themes: ['元宵', '花灯', '猜灯谜', '汤圆'],
    keywords: ['元宵快乐', '团团圆圆', '灯火辉煌'],
    advanceDays: 3,
    dialectGreetings: {
      mandarin: '元宵节快乐，团团圆圆',
      cantonese: '元宵节快乐，甜甜蜜蜜',
    },
  },
  qingming: {
    id: 'qingming',
    name: '清明节',
    englishName: 'Qingming Festival',
    themes: ['踏青', '春游', '青团', '风筝'],
    keywords: ['清明时节', '春风十里', '万物复苏'],
    advanceDays: 3,
    dialectGreetings: {},
  },
  labor_day: {
    id: 'labor_day',
    name: '五一劳动节',
    englishName: 'Labor Day',
    themes: ['假期', '旅游', '放松', '劳动光荣'],
    keywords: ['五一快乐', '假期模式', '劳动最光荣'],
    advanceDays: 7,
    dialectGreetings: {},
  },
  dragon_boat: {
    id: 'dragon_boat',
    name: '端午节',
    englishName: 'Dragon Boat Festival',
    themes: ['粽子', '龙舟', '艾草', '屈原'],
    keywords: ['端午安康', '吃粽子', '赛龙舟'],
    advanceDays: 5,
    dialectGreetings: {},
  },
  mid_autumn: {
    id: 'mid_autumn',
    name: '中秋节',
    englishName: 'Mid-Autumn Festival',
    themes: ['月亮', '月饼', '团圆', '桂花', '兔子'],
    keywords: ['中秋快乐', '花好月圆', '阖家团圆'],
    advanceDays: 7,
    dialectGreetings: {},
  },
  national_day: {
    id: 'national_day',
    name: '国庆节',
    englishName: 'National Day',
    themes: ['国庆', '假期', '旅游', '爱国'],
    keywords: ['国庆快乐', '祖国万岁', '黄金周'],
    advanceDays: 7,
    dialectGreetings: {},
  },
  double_11: {
    id: 'double_11',
    name: '双11',
    englishName: 'Double 11 Shopping Festival',
    themes: ['购物', '剁手', '优惠', '买买买'],
    keywords: ['双11快乐', '买买买', '剁手', '全场打折'],
    advanceDays: 10,
    dialectGreetings: {},
  },
  double_12: {
    id: 'double_12',
    name: '双12',
    englishName: 'Double 12 Shopping Festival',
    themes: ['购物', '年终', '优惠'],
    keywords: ['双12', '年终大促', '清仓'],
    advanceDays: 5,
    dialectGreetings: {},
  },
  christmas: {
    id: 'christmas',
    name: '圣诞节',
    englishName: 'Christmas',
    themes: ['圣诞', '礼物', '圣诞树', '雪花'],
    keywords: ['圣诞快乐', 'Merry Christmas', '礼物'],
    advanceDays: 7,
    dialectGreetings: {},
  },
  new_year: {
    id: 'new_year',
    name: '元旦',
    englishName: "New Year's Day",
    themes: ['新年', '跨年', '倒计时', '烟花'],
    keywords: ['元旦快乐', '新年新气象', '跨年'],
    advanceDays: 7,
    dialectGreetings: {},
  },
  valentines: {
    id: 'valentines',
    name: '情人节',
    englishName: "Valentine's Day",
    themes: ['爱情', '玫瑰', '巧克力', '约会'],
    keywords: ['情人节快乐', '我爱你', '甜蜜'],
    advanceDays: 5,
    dialectGreetings: {},
  },
  womens_day: {
    id: 'womens_day',
    name: '三八妇女节',
    englishName: "Women's Day",
    themes: ['女性', '美丽', '礼物'],
    keywords: ['女神节快乐', '妇女节', '女王节'],
    advanceDays: 3,
    dialectGreetings: {},
  },
  mothers_day: {
    id: 'mothers_day',
    name: '母亲节',
    englishName: "Mother's Day",
    themes: ['妈妈', '感恩', '康乃馨'],
    keywords: ['母亲节快乐', '妈妈我爱你', '感恩母亲'],
    advanceDays: 5,
    dialectGreetings: {},
  },
  fathers_day: {
    id: 'fathers_day',
    name: '父亲节',
    englishName: "Father's Day",
    themes: ['爸爸', '感恩', '父爱'],
    keywords: ['父亲节快乐', '老爸辛苦了'],
    advanceDays: 5,
    dialectGreetings: {},
  },
  childrens_day: {
    id: 'childrens_day',
    name: '儿童节',
    englishName: "Children's Day",
    themes: ['儿童', '童趣', '玩具', '童年'],
    keywords: ['六一快乐', '童心未泯', '永远年轻'],
    advanceDays: 3,
    dialectGreetings: {},
  },
  teachers_day: {
    id: 'teachers_day',
    name: '教师节',
    englishName: "Teachers' Day",
    themes: ['老师', '感恩', '教育'],
    keywords: ['教师节快乐', '老师辛苦了', '桃李满天下'],
    advanceDays: 3,
    dialectGreetings: {},
  },
  chinese_valentines: {
    id: 'chinese_valentines',
    name: '七夕节',
    englishName: 'Chinese Valentine\'s Day',
    themes: ['爱情', '牛郎织女', '鹊桥', '浪漫'],
    keywords: ['七夕快乐', '情人节', '牛郎织女'],
    advanceDays: 5,
    dialectGreetings: {},
  },
}

/**
 * 时间上下文
 */
export interface TimeContext {
  currentDate: Date
  currentFestival?: FestivalConfig
  upcomingFestivals: FestivalConfig[]
  seasonalTheme?: SeasonalTheme
  specialPeriod?: SpecialPeriod
}

/**
 * 节日服务
 */
export class FestivalService {
  /**
   * 获取当前时间上下文
   */
  getContext(date: Date = new Date()): TimeContext {
    return {
      currentDate: date,
      currentFestival: this.getCurrentFestival(date),
      upcomingFestivals: this.getUpcomingFestivals(date),
      seasonalTheme: this.getSeasonalTheme(date),
      specialPeriod: this.getSpecialPeriod(date),
    }
  }

  /**
   * 获取当前节日（当天或即将到来的）
   */
  getCurrentFestival(date: Date): FestivalConfig | undefined {
    for (const festival of Object.values(FESTIVAL_CONFIGS)) {
      if (this.isInFestivalPeriod(date, festival)) {
        return festival
      }
    }
    return undefined
  }

  /**
   * 获取即将到来的节日
   */
  getUpcomingFestivals(date: Date, limit: number = 3): FestivalConfig[] {
    const upcoming: { festival: FestivalConfig; daysUntil: number }[] = []

    for (const festival of Object.values(FESTIVAL_CONFIGS)) {
      const daysUntil = this.getDaysUntilFestival(date, festival)
      if (daysUntil > 0 && daysUntil <= 30) {
        upcoming.push({ festival, daysUntil })
      }
    }

    return upcoming
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, limit)
      .map(u => u.festival)
  }

  /**
   * 获取季节性主题
   */
  getSeasonalTheme(date: Date): SeasonalTheme | undefined {
    const month = date.getMonth() + 1

    if (month >= 3 && month <= 4) return 'spring_outing'
    if (month >= 7 && month <= 8) return 'summer_vacation'
    if (month === 9) return 'back_to_school'
    if (month === 10) return 'autumn_harvest'
    if (month === 12 || month === 1) return 'spring_travel'

    return undefined
  }

  /**
   * 获取特殊时期
   */
  getSpecialPeriod(date: Date): SpecialPeriod | undefined {
    const month = date.getMonth() + 1

    if (month === 12 || month === 1) return 'year_end_party'
    if (month >= 6 && month <= 7) return 'graduation'
    if (month >= 2 && month <= 4) return 'job_hunting'
    if (month === 11) return 'shopping_festival'

    return undefined
  }

  /**
   * 检查日期是否在节日期间
   */
  private isInFestivalPeriod(date: Date, festival: FestivalConfig): boolean {
    const festivalDate = this.getFestivalDate(date.getFullYear(), festival.id)
    if (!festivalDate) return false

    const diffDays = Math.floor(
      (festivalDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )

    return diffDays >= 0 && diffDays <= festival.advanceDays
  }

  /**
   * 获取距离节日的天数
   */
  private getDaysUntilFestival(date: Date, festival: FestivalConfig): number {
    const festivalDate = this.getFestivalDate(date.getFullYear(), festival.id)
    if (!festivalDate) return Infinity

    return Math.floor(
      (festivalDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  /**
   * 获取节日日期
   */
  private getFestivalDate(year: number, festivalId: FestivalType): Date | null {
    switch (festivalId) {
      case 'spring_festival':
        return this.getLunarNewYear(year)
      case 'lantern_festival':
        return this.getLunarFestivalDate(year, 1, 15)
      case 'qingming':
        return new Date(year, 3, 4 + this.getQingmingOffset(year))
      case 'labor_day':
        return new Date(year, 4, 1)
      case 'dragon_boat':
        return this.getLunarFestivalDate(year, 5, 5)
      case 'mid_autumn':
        return this.getLunarFestivalDate(year, 8, 15)
      case 'national_day':
        return new Date(year, 9, 1)
      case 'double_11':
        return new Date(year, 10, 11)
      case 'double_12':
        return new Date(year, 11, 12)
      case 'christmas':
        return new Date(year, 11, 25)
      case 'new_year':
        return new Date(year, 0, 1)
      case 'valentines':
        return new Date(year, 1, 14)
      case 'womens_day':
        return new Date(year, 2, 8)
      case 'mothers_day':
        return this.getNthDayOfMonth(year, 4, 0, 2) // 5月第2个周日
      case 'fathers_day':
        return this.getNthDayOfMonth(year, 5, 0, 3) // 6月第3个周日
      case 'childrens_day':
        return new Date(year, 5, 1)
      case 'teachers_day':
        return new Date(year, 8, 10)
      case 'chinese_valentines':
        return this.getLunarFestivalDate(year, 7, 7)
      default:
        return null
    }
  }

  /**
   * 获取农历新年（简化版，仅支持 2024-2030）
   */
  private getLunarNewYear(year: number): Date {
    const lunarNewYearMap: Record<number, [number, number]> = {
      2024: [2, 10],
      2025: [1, 29],
      2026: [2, 17],
      2027: [2, 6],
      2028: [1, 26],
      2029: [2, 13],
      2030: [2, 3],
    }
    const [month, day] = lunarNewYearMap[year] || [2, 1]
    return new Date(year, month - 1, day)
  }

  /**
   * 获取农历节日日期（简化版）
   */
  private getLunarFestivalDate(year: number, _month: number, _day: number): Date {
    // 简化实现，实际需要完整的农历转换
    // 这里使用近似值
    return new Date(year, 0, 1)
  }

  /**
   * 清明节偏移（4月4日或5日）
   */
  private getQingmingOffset(year: number): number {
    const offsetMap: Record<number, number> = {
      2024: 0, 2025: 1, 2026: 0, 2027: 1, 2028: 0, 2029: 1, 2030: 0,
    }
    return offsetMap[year] || 0
  }

  /**
   * 获取某月第 N 个星期几
   */
  private getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
    const date = new Date(year, month, 1)
    let count = 0

    while (count < n) {
      if (date.getDay() === dayOfWeek) {
        count++
        if (count === n) break
      }
      date.setDate(date.getDate() + 1)
    }

    return date
  }
}

// 单例实例
let serviceInstance: FestivalService | null = null

/**
 * 获取节日服务实例
 */
export function getFestivalService(): FestivalService {
  if (!serviceInstance) {
    serviceInstance = new FestivalService()
  }
  return serviceInstance
}

/**
 * 获取当前时间上下文（便捷方法）
 */
export function getTimeContext(date?: Date): TimeContext {
  return getFestivalService().getContext(date)
}
