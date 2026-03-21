/**
 * AI 上下文模块
 */

export {
  FestivalService,
  getFestivalService,
  getTimeContext,
  FESTIVAL_CONFIGS,
} from './festival-service'

export type {
  FestivalType,
  SeasonalTheme,
  SpecialPeriod,
  FestivalConfig,
  TimeContext,
} from './festival-service'

export {
  TrendingService,
  getTrendingService,
} from './trending-service'

export type {
  TrendingTopic,
  InternetMeme,
} from './trending-service'
