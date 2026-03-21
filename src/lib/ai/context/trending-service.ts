/**
 * 热点搜索服务
 * 集成 Serper API 搜索当前热点
 */

/**
 * 热点话题
 */
export interface TrendingTopic {
  title: string
  description: string
  url?: string
  source?: string
  keywords: string[]
  fetchedAt: Date
}

/**
 * 网络热梗
 */
export interface InternetMeme {
  text: string
  context: string
  usage: string
}

/**
 * 热点搜索配置
 */
interface TrendingConfig {
  apiKey: string
  baseUrl: string
  cacheTTL: number  // 缓存时间（秒）
}

/**
 * 热点搜索服务
 */
export class TrendingService {
  private config: TrendingConfig
  private cache: Map<string, { data: TrendingTopic[]; timestamp: number }> = new Map()

  constructor() {
    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey) {
      console.warn('[TrendingService] SERPER_API_KEY not set, trending search will be disabled')
    }

    this.config = {
      apiKey: apiKey || '',
      baseUrl: 'https://google.serper.dev',
      cacheTTL: 3600, // 1 小时缓存
    }
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!this.config.apiKey
  }

  /**
   * 搜索热点话题
   */
  async search(query: string, options?: { limit?: number }): Promise<TrendingTopic[]> {
    // 检查缓存
    const cacheKey = `search:${query}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL * 1000) {
      return cached.data.slice(0, options?.limit || 5)
    }

    if (!this.isConfigured()) {
      return this.getFallbackTrending(query)
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: `${query} 热点 最新`,
          gl: 'cn',
          hl: 'zh-cn',
          num: options?.limit || 10,
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`)
      }

      const data = await response.json()
      const topics = this.parseSearchResults(data)

      // 缓存结果
      this.cache.set(cacheKey, { data: topics, timestamp: Date.now() })

      return topics.slice(0, options?.limit || 5)
    } catch (error) {
      console.error('[TrendingService] Search failed:', error)
      return this.getFallbackTrending(query)
    }
  }

  /**
   * 获取当前热门话题
   */
  async getTrendingTopics(options?: { limit?: number }): Promise<TrendingTopic[]> {
    // 检查缓存
    const cacheKey = 'trending:current'
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL * 1000) {
      return cached.data.slice(0, options?.limit || 5)
    }

    if (!this.isConfigured()) {
      return this.getFallbackTrending()
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: '热搜 热门话题 今日热点',
          gl: 'cn',
          hl: 'zh-cn',
          num: options?.limit || 10,
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`)
      }

      const data = await response.json()
      const topics = this.parseSearchResults(data)

      // 缓存结果
      this.cache.set(cacheKey, { data: topics, timestamp: Date.now() })

      return topics.slice(0, options?.limit || 5)
    } catch (error) {
      console.error('[TrendingService] Get trending failed:', error)
      return this.getFallbackTrending()
    }
  }

  /**
   * 获取网络热梗
   */
  async getInternetMemes(): Promise<InternetMeme[]> {
    // 热梗变化快，缓存时间短
    const cacheKey = 'memes:current'
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 1800 * 1000) {
      return cached.data as unknown as InternetMeme[]
    }

    // 使用预定义的热梗列表作为基础
    const memes = this.getDefaultMemes()

    // 缓存结果
    this.cache.set(cacheKey, {
      data: memes as unknown as TrendingTopic[],
      timestamp: Date.now()
    })

    return memes
  }

  /**
   * 解析搜索结果
   */
  private parseSearchResults(data: { organic?: Array<{ title: string; snippet: string; link: string }> }): TrendingTopic[] {
    if (!data.organic) return []

    return data.organic.map(item => ({
      title: item.title,
      description: item.snippet || '',
      url: item.link,
      source: 'google',
      keywords: this.extractKeywords(item.title, item.snippet),
      fetchedAt: new Date(),
    }))
  }

  /**
   * 提取关键词
   */
  private extractKeywords(title: string, snippet?: string): string[] {
    const text = `${title} ${snippet || ''}`
    // 简单的关键词提取（实际可使用 NLP）
    const words = text.match(/[\u4e00-\u9fa5]{2,4}/g) || []
    return [...new Set(words)].slice(0, 5)
  }

  /**
   * 降级：获取预定义热点
   */
  private getFallbackTrending(query?: string): TrendingTopic[] {
    const now = new Date()
    const month = now.getMonth() + 1

    const seasonalTopics: TrendingTopic[] = []

    // 根据月份返回不同的季节性话题
    if (month >= 1 && month <= 2) {
      seasonalTopics.push({
        title: '新年新气象',
        description: '新年伊始，万象更新',
        keywords: ['新年', '目标', '规划'],
        fetchedAt: now,
      })
    } else if (month >= 3 && month <= 4) {
      seasonalTopics.push({
        title: '春暖花开',
        description: '春日好时光，踏青正当时',
        keywords: ['春天', '踏青', '出游'],
        fetchedAt: now,
      })
    } else if (month >= 6 && month <= 8) {
      seasonalTopics.push({
        title: '夏日炎炎',
        description: '盛夏时节，避暑有妙招',
        keywords: ['夏天', '避暑', '西瓜'],
        fetchedAt: now,
      })
    } else if (month >= 9 && month <= 10) {
      seasonalTopics.push({
        title: '金秋时节',
        description: '秋高气爽，收获满满',
        keywords: ['秋天', '丰收', '赏月'],
        fetchedAt: now,
      })
    } else if (month >= 11 && month <= 12) {
      seasonalTopics.push({
        title: '年末冲刺',
        description: '年终将至，奋力拼搏',
        keywords: ['年终', '总结', '目标'],
        fetchedAt: now,
      })
    }

    // 如果有查询词，添加相关话题
    if (query) {
      seasonalTopics.unshift({
        title: query,
        description: `关于${query}的精彩内容`,
        keywords: [query],
        fetchedAt: now,
      })
    }

    return seasonalTopics
  }

  /**
   * 获取默认网络热梗
   */
  private getDefaultMemes(): InternetMeme[] {
    return [
      {
        text: '遥遥领先',
        context: '形容某事物非常优秀',
        usage: '可用于强调产品或服务优势',
      },
      {
        text: '绝绝子',
        context: '表示非常绝、很厉害',
        usage: '可用于表达赞美',
      },
      {
        text: 'YYDS',
        context: '永远的神，表示崇拜',
        usage: '可用于表达崇拜或喜爱',
      },
      {
        text: '破防了',
        context: '心理防线被突破，深受感动',
        usage: '可用于表达情感共鸣',
      },
      {
        text: '内卷',
        context: '过度竞争',
        usage: '可用于吐槽工作或生活压力',
      },
      {
        text: '躺平',
        context: '放弃竞争，选择轻松',
        usage: '可用于表达轻松态度',
      },
      {
        text: '打工人',
        context: '上班族自嘲',
        usage: '可用于引起打工人共鸣',
      },
      {
        text: '摸鱼',
        context: '工作中偷懒',
        usage: '可用于轻松幽默场景',
      },
      {
        text: '真香',
        context: '态度转变',
        usage: '可用于表达惊喜或态度转变',
      },
      {
        text: 'emo了',
        context: '情绪低落',
        usage: '可用于表达心情',
      },
    ]
  }
}

// 单例实例
let serviceInstance: TrendingService | null = null

/**
 * 获取热点服务实例
 */
export function getTrendingService(): TrendingService {
  if (!serviceInstance) {
    serviceInstance = new TrendingService()
  }
  return serviceInstance
}
