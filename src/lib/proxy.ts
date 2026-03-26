/**
 * 全局代理配置模块
 *
 * 在应用启动时设置 undici 全局代理，使所有 fetch 请求自动走代理。
 * 这是必要的，因为：
 * 1. Node.js fetch 不会自动读取 HTTPS_PROXY 环境变量
 * 2. undici ProxyAgent 需要手动配置
 * 3. 当前环境 DNS 不可用，所有请求必须走代理
 *
 * 使用方式：
 * 在应用入口或需要代理的模块顶部导入：
 * import '@/lib/proxy'
 */

import { ProxyAgent, setGlobalDispatcher } from 'undici'

// ============================================================================
// 代理配置
// ============================================================================

const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy ||
  process.env.ALL_PROXY ||
  process.env.all_proxy

let proxyInitialized = false

/**
 * 初始化全局代理
 * 幂等操作，多次调用只会初始化一次
 */
export function initGlobalProxy(): void {
  if (proxyInitialized) {
    return
  }

  if (proxyUrl) {
    console.log(`[Proxy] Setting global proxy: ${proxyUrl}`)
    setGlobalDispatcher(new ProxyAgent(proxyUrl))
    proxyInitialized = true
  } else {
    console.log('[Proxy] No proxy configured, using direct connection')
    proxyInitialized = true
  }
}

/**
 * 获取代理 URL（用于需要手动配置的场景，如 OSS httpsAgent）
 */
export function getProxyUrl(): string | undefined {
  return proxyUrl
}

/**
 * 检查是否已配置代理
 */
export function isProxyConfigured(): boolean {
  return !!proxyUrl
}

// ============================================================================
// 自动初始化
// ============================================================================

// 模块加载时自动初始化
initGlobalProxy()
