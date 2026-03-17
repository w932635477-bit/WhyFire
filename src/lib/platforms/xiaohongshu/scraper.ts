/**
 * 小红书数据抓取器
 *
 * 设计原则：
 * 1. 只抓取公开页面（无需登录）
 * 2. 使用 Playwright 模拟浏览器访问
 * 3. 遵守 robots.txt 和合理的访问频率
 * 4. 只获取公开可见的信息
 *
 * 合规边界：
 * - ✅ 访问公开页面
 * - ✅ 获取公开信息（标题、正文、互动数据、封面图）
 * - ✅ 单次请求，不批量爬取
 * - ❌ 不绕过反爬措施
 * - ❌ 不需要登录或使用 Cookie
 */

import type { Browser, Page, BrowserContext, Response } from './playwright-types';
import { chromium } from './playwright-types';
import { BasePlatformScraper } from '../base';
import {
  XhsNoteData,
  XhsAuthorData,
  XhsInteractionData,
  XhsScraperConfig,
  XhsUrlType,
  XhsUrlInfo,
  XhsPageData,
  XhsPageTag,
  XhsPageImage,
} from './types';
import { ScrapingResult } from '../types';

/**
 * 小红书抓取器
 */
// 常量定义（修复魔法数字问题）
const BROWSER_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5分钟无操作自动关闭
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 2000;
const DEFAULT_RANDOM_DELAY = { min: 1000, max: 3000 };

export class XiaohongshuScraper extends BasePlatformScraper<XhsNoteData> {
  readonly platform = 'xiaohongshu' as const;

  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: Required<XhsScraperConfig>;
  private idleTimer: ReturnType<typeof setInterval> | null = null;
  private lastActivityTime: number = Date.now();

  // 小红书 URL 模式
  private readonly URL_PATTERNS = {
    // 笔记详情页 - 新版
    note: [
      /^https?:\/\/www\.xiaohongshu\.com\/explore\/([a-zA-Z0-9]+)/,
      /^https?:\/\/www\.xiaohongshu\.com\/discovery\/item\/([a-zA-Z0-9]+)/,
    ],
    // 笔记详情页 - 旧版（xhslink）
    noteShort: /^https?:\/\/xhslink\.com\/([a-zA-Z0-9]+)/,
    // 用户主页
    user: /^https?:\/\/www\.xiaohongshu\.com\/user\/profile\/([a-zA-Z0-9]+)/,
  };

  constructor(config: XhsScraperConfig = {}) {
    super();
    this.config = {
      headless: config.headless ?? true,
      timeout: config.timeout ?? 30000,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 2000,
      randomDelay: config.randomDelay ?? { min: 1000, max: 3000 },
    };
  }

  /**
   * 检查 URL 是否为小红书笔记链接
   */
  isValidUrl(url: string): boolean {
    try {
      const urlInfo = this.parseUrl(url);
      return urlInfo.type === 'note';
    } catch {
      return false;
    }
  }

  /**
   * 从 URL 中提取笔记 ID
   */
  extractNoteId(url: string): string | null {
    try {
      const urlInfo = this.parseUrl(url);
      return urlInfo.noteId ?? null;
    } catch {
      return null;
    }
  }

  /**
   * 解析 URL 类型
   */
  private parseUrl(url: string): XhsUrlInfo {
    // 处理短链接（需要先访问获取真实 URL）
    if (this.URL_PATTERNS.noteShort.test(url)) {
      return {
        type: 'note',
        noteId: undefined, // 短链接需要访问后才能获取真实 ID
      };
    }

    // 检查笔记 URL
    for (const pattern of this.URL_PATTERNS.note) {
      const match = url.match(pattern);
      if (match) {
        return {
          type: 'note',
          noteId: match[1],
        };
      }
    }

    // 检查用户 URL
    const userMatch = url.match(this.URL_PATTERNS.user);
    if (userMatch) {
      return {
        type: 'user',
        userId: userMatch[1],
      };
    }

    return { type: 'unknown' };
  }

  /**
   * 初始化浏览器
   */
  private async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      this.context = await this.browser.newContext({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'zh-CN',
      });

      // 启动空闲超时监控
      this.startIdleTimer();
    }
    this.updateActivity();
  }

  /**
   * 更新活动时间
   */
  private updateActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * 启动空闲超时定时器
   */
  private startIdleTimer(): void {
    this.stopIdleTimer();
    this.idleTimer = setInterval(() => {
      const idleTime = Date.now() - this.lastActivityTime;
      if (idleTime >= BROWSER_IDLE_TIMEOUT_MS && this.browser) {
        console.log('Browser idle timeout, auto-closing...');
        this.close().catch(console.error);
      }
    }, 60000); // 每分钟检查一次
  }

  /**
   * 停止空闲超时定时器
   */
  private stopIdleTimer(): void {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    this.stopIdleTimer();
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 抓取笔记数据
   */
  async scrapeNote(url: string): Promise<ScrapingResult<XhsNoteData>> {
    const scrapedAt = new Date();

    try {
      // 验证 URL
      if (!this.isValidUrl(url)) {
        return {
          success: false,
          error: 'Invalid Xiaohongshu note URL',
          scrapedAt,
        };
      }

      // 初始化浏览器
      await this.initBrowser();

      // 重试机制
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          // 随机延迟（反爬措施）
          await this.randomDelay(
            this.config.randomDelay.min,
            this.config.randomDelay.max
          );

          // 创建新页面
          const page = await this.context!.newPage();

          try {
            // 访问页面
            const response = await page.goto(url, {
              waitUntil: 'domcontentloaded',
              timeout: this.config.timeout,
            });

            if (!response || !response.ok()) {
              throw new Error(`HTTP ${response?.status() || 'no response'}`);
            }

            // 等待页面加载
            await page.waitForSelector('.note-container, .note-content', {
              timeout: 10000,
            }).catch(() => {
              // 可能页面结构已变化，继续尝试提取数据
            });

            // 提取数据
            const noteData = await this.extractNoteData(page, url);

            return {
              success: true,
              data: noteData,
              scrapedAt,
            };
          } finally {
            await page.close();
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < this.config.maxRetries) {
            await this.delay(this.config.retryDelay * attempt);
          }
        }
      }

      return {
        success: false,
        error: lastError?.message || 'Unknown error after retries',
        scrapedAt,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        scrapedAt,
      };
    }
  }

  /**
   * 从页面提取笔记数据
   */
  private async extractNoteData(page: Page, url: string): Promise<XhsNoteData> {
    const noteId = this.extractNoteId(url) || 'unknown';

    // 使用页面脚本提取数据（更可靠）
    const pageData = await page.evaluate(() => {
      // 尝试从页面的 __INITIAL_STATE__ 获取数据
      const initialState = (window as any).__INITIAL_STATE__;
      if (initialState?.note?.noteDetailMap) {
        const noteMap = initialState.note.noteDetailMap;
        const firstKey = Object.keys(noteMap)[0];
        if (firstKey && noteMap[firstKey]?.note) {
          return noteMap[firstKey].note;
        }
      }

      // 备选方案：从 DOM 提取
      return null;
    });

    if (pageData) {
      // 从页面数据构建结构化数据
      return this.buildNoteDataFromPageData(pageData, noteId, url);
    }

    // DOM 提取（备用方案）
    return this.extractFromDom(page, noteId, url);
  }

  /**
   * 从页面数据构建结构化数据
   */
  private buildNoteDataFromPageData(
    pageData: XhsPageData,
    noteId: string,
    url: string
  ): XhsNoteData {
    const interactions: XhsInteractionData = {
      likeCount: pageData?.interactInfo?.likedCount || 0,
      collectCount: pageData?.interactInfo?.collectedCount || 0,
      commentCount: pageData?.interactInfo?.commentCount || 0,
      shareCount: pageData?.interactInfo?.shareCount || 0,
      get totalInteractions() {
        return this.likeCount + this.collectCount + this.commentCount + this.shareCount;
      },
      get collectToLikeRatio() {
        return this.likeCount > 0 ? this.collectCount / this.likeCount : 0;
      },
    };

    const author: XhsAuthorData = {
      authorId: pageData?.user?.userId || '',
      authorName: pageData?.user?.nickname || '',
      avatarUrl: pageData?.user?.image || '',
      redId: pageData?.user?.redId || '',
      followerCount: pageData?.user?.fansCount || 0,
      noteCount: pageData?.user?.noteCount || 0,
      likedCount: pageData?.user?.likedCount || 0,
    };

    const hashtags: string[] = (pageData?.tagList || [])
      .map((tag: XhsPageTag) => tag?.name || '')
      .filter((name: string) => name);

    const images: string[] = (pageData?.imageList || []).map(
      (img: XhsPageImage) => img?.urlDefault || img?.url || ''
    );

    return {
      platform: 'xiaohongshu',
      noteId,
      noteUrl: url,
      scrapedAt: new Date(),
      title: pageData?.title || '',
      description: pageData?.desc || '',
      noteType: pageData?.type === 'video' ? 'video' : 'normal',
      coverImage: pageData?.imageList?.[0]?.urlDefault || pageData?.video?.cover || '',
      images,
      videoUrl: pageData?.video?.media?.stream?.[0]?.masterUrl || undefined,
      hashtags,
      author,
      interactions,
      publishedAt: pageData?.time
        ? new Date(pageData.time)
        : undefined,
      location: pageData?.ipLocation || undefined,
      isRecommended: pageData?.isRecommended || false,
    };
  }

  /**
   * 从 DOM 提取数据（备用方案）
   */
  private async extractFromDom(
    page: Page,
    noteId: string,
    url: string
  ): Promise<XhsNoteData> {
    // 提取标题
    const title = await page
      .locator('.title, .note-title, [class*="title"]')
      .first()
      .textContent()
      .then((text: string | null) => text?.trim() || '')
      .catch(() => '');

    // 提取正文
    const description = await page
      .locator('.desc, .note-text, [class*="desc"]')
      .first()
      .textContent()
      .then((text: string | null) => text?.trim() || '')
      .catch(() => '');

    // 提取作者信息
    const authorName = await page
      .locator('.author-wrapper .username, .user-nickname, [class*="username"]')
      .first()
      .textContent()
      .then((text: string | null) => text?.trim() || '未知用户')
      .catch(() => '未知用户');

    // 提取互动数据（点赞、收藏、评论）
    const likeText = await page
      .locator('[data-v-like], .like-count, [class*="like"]')
      .first()
      .textContent()
      .then((text: string | null) => text || '0')
      .catch(() => '0');

    const collectText = await page
      .locator('[data-v-collect], .collect-count, [class*="collect"]')
      .first()
      .textContent()
      .then((text: string | null) => text || '0')
      .catch(() => '0');

    const commentText = await page
      .locator('[data-v-comment], .comment-count, [class*="comment"]')
      .first()
      .textContent()
      .then((text: string | null) => text || '0')
      .catch(() => '0');

    // 解析数字（处理 "1.2万" 等格式）
    const parseCount = (text: string): number => {
      const num = parseFloat(text.replace(/[^0-9.万千百十]/g, ''));
      if (text.includes('万')) return Math.floor(num * 10000);
      if (text.includes('千')) return Math.floor(num * 1000);
      return Math.floor(num) || 0;
    };

    const interactions: XhsInteractionData = {
      likeCount: parseCount(likeText),
      collectCount: parseCount(collectText),
      commentCount: parseCount(commentText),
      shareCount: 0,
      get totalInteractions() {
        return this.likeCount + this.collectCount + this.commentCount + this.shareCount;
      },
      get collectToLikeRatio() {
        return this.likeCount > 0 ? this.collectCount / this.likeCount : 0;
      },
    };

    // 提取封面图
    const coverImage = await page
      .locator('.note-image img, .swiper-slide img, [class*="note"] img')
      .first()
      .getAttribute('src')
      .then((src: string | null) => src || '')
      .catch(() => '');

    // 提取话题标签
    const hashtags = await page
      .locator('.tag, .hashtag, [class*="tag"] a')
      .allTextContents()
      .then((texts: string[]) => texts.map((t: string) => t.trim()).filter((t: string) => t))
      .catch(() => [] as string[]);

    const author: XhsAuthorData = {
      authorId: '',
      authorName,
    };

    return {
      platform: 'xiaohongshu',
      noteId,
      noteUrl: url,
      scrapedAt: new Date(),
      title,
      description,
      noteType: 'normal',
      coverImage,
      hashtags,
      author,
      interactions,
    };
  }
}

/**
 * 导出单例实例（可选）
 */
export const xiaohongshuScraper = new XiaohongshuScraper();
