/**
 * 平台抓取器基类
 */

import type { ScrapingResult } from './types';

/**
 * 平台抓取器基类
 */
export abstract class BasePlatformScraper<T> {
  abstract readonly platform: string;

  /**
   * 检查 URL 是否有效
   */
  abstract isValidUrl(url: string): boolean;

  /**
   * 抓取数据
   */
  abstract scrapeNote(url: string): Promise<ScrapingResult<T>>;

  /**
   * 延迟
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 随机延迟
   */
  protected async randomDelay(min: number, max: number): Promise<void> {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.delay(ms);
  }
}
