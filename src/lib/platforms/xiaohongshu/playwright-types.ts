/**
 * Playwright 类型定义（用于开发时的类型支持）
 *
 * 注意：实际运行时需要安装 playwright
 * 这些类型是 Playwright 的简化版本，仅包含本项目使用的部分
 */

/**
 * 浏览器实例
 */
export interface Browser {
  newContext(options?: BrowserContextOptions): Promise<BrowserContext>;
  close(): Promise<void>;
  isConnected(): boolean;
}

/**
 * 浏览器上下文选项
 */
export interface BrowserContextOptions {
  userAgent?: string;
  viewport?: { width: number; height: number };
  locale?: string;
}

/**
 * 浏览器上下文
 */
export interface BrowserContext {
  newPage(): Promise<Page>;
  close(): Promise<void>;
}

/**
 * 页面
 */
export interface Page {
  goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<Response | null>;
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<void>;
  locator(selector: string): Locator;
  evaluate<T>(fn: () => T): Promise<T>;
  close(): Promise<void>;
}

/**
 * 定位器
 */
export interface Locator {
  first(): Locator;
  textContent(): Promise<string | null>;
  getAttribute(name: string): Promise<string | null>;
  allTextContents(): Promise<string[]>;
}

/**
 * 响应
 */
export interface Response {
  ok(): boolean;
  status(): number;
}

/**
 * Chromium 浏览器启动器
 */
export interface ChromiumBrowser {
  launch(options?: {
    headless?: boolean;
    args?: string[];
  }): Promise<Browser>;
}

// 实际使用时应该从 playwright 导入
// 这里提供一个 mock 实现用于类型检查
export const chromium: ChromiumBrowser = {
  async launch(options?: { headless?: boolean; args?: string[] }) {
    // Mock 实现 - 实际运行时会被 playwright 替换
    throw new Error('Playwright not initialized. Run: pnpm install playwright && pnpm exec playwright install');
  },
};
