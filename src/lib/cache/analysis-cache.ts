/**
 * AI分析结果缓存层
 *
 * 基于内容hash的缓存机制，避免重复调用AI API
 */

import { createHash } from 'crypto';

// 缓存配置
const CACHE_CONFIG = {
  // 默认缓存时间（毫秒）
  DEFAULT_TTL: 60 * 60 * 1000, // 1小时
  // 最大缓存条目数
  MAX_ENTRIES: 1000,
  // 清理间隔
  CLEANUP_INTERVAL: 10 * 60 * 1000, // 10分钟
} as const;

/**
 * 缓存条目
 */
interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
}

/**
 * 内存缓存实现
 */
class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanup();
  }

  /**
   * 生成内容hash作为缓存key
   */
  generateKey(content: string, prefix: string = ''): string {
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): void {
    // 如果超过最大条目数，清理最老的条目
    if (this.cache.size >= CACHE_CONFIG.MAX_ENTRIES) {
      this.evictOldest();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      createdAt: now,
      expiresAt: now + ttl,
      hits: 0,
    });
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    size: number;
    maxEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldest: number | null = null;
    let newest: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldest === null || entry.createdAt < oldest) {
        oldest = entry.createdAt;
      }
      if (newest === null || entry.createdAt > newest) {
        newest = entry.createdAt;
      }
    }

    return {
      size: this.cache.size,
      maxEntries: CACHE_CONFIG.MAX_ENTRIES,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }

  /**
   * 清理过期条目
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
  }

  /**
   * 停止定期清理
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 驱逐最老的条目
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// 全局缓存实例
const analysisCache = new MemoryCache<unknown>();

/**
 * 缓存包装器 - 为任意函数添加缓存
 *
 * @example
 * ```typescript
 * const cachedAnalyze = withCache(
 *   analyzeCompetitor,
 *   'competitor',
 *   30 * 60 * 1000 // 30分钟
 * );
 *
 * const result = await cachedAnalyze(noteData);
 * ```
 */
export function withCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  prefix: string,
  ttl: number = CACHE_CONFIG.DEFAULT_TTL,
  keyGenerator?: (...args: TArgs) => string
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    // 生成缓存key
    const cacheKey = keyGenerator
      ? `${prefix}:${keyGenerator(...args)}`
      : analysisCache.generateKey(JSON.stringify(args), prefix);

    // 尝试从缓存获取
    const cached = analysisCache.get(cacheKey) as TResult | null;
    if (cached !== null) {
      console.log(`[Cache] Hit for ${cacheKey}`);
      return cached;
    }

    // 执行函数
    console.log(`[Cache] Miss for ${cacheKey}, executing...`);
    const result = await fn(...args);

    // 存入缓存
    analysisCache.set(cacheKey, result, ttl);

    return result;
  };
}

/**
 * 清除特定前缀的缓存
 */
export function clearCacheByPrefix(prefix: string): void {
  // 注意：MemoryCache目前不支持按前缀清除
  // 这是一个简化实现，生产环境应使用Redis等支持模式匹配的缓存
  console.log(`[Cache] Clear prefix: ${prefix}`);
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  return analysisCache.getStats();
}

/**
 * 竞品分析缓存key生成器
 */
export function competitorAnalysisKeyGenerator(noteData: {
  noteId: string;
  title: string;
}): string {
  return `${noteData.noteId}:${noteData.title.slice(0, 50)}`;
}

/**
 * 内容诊断缓存key生成器
 */
export function diagnosisKeyGenerator(userNote: {
  noteId: string;
}, competitorNote: { noteId: string }): string {
  return `${userNote.noteId}_vs_${competitorNote.noteId}`;
}

/**
 * 灵感解读缓存key生成器
 */
export function inspirationKeyGenerator(video: {
  videoId: string;
  platform: string;
}): string {
  return `${video.platform}:${video.videoId}`;
}

export { analysisCache, CACHE_CONFIG };
