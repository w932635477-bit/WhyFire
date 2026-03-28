/**
 * 网络配置模块
 *
 * 所有外部服务在当前环境下均可直连，不需要代理。
 * 此模块保留仅用于获取代理 URL（如 OSS SDK 可能需要）。
 *
 * 注意：不要使用 setGlobalDispatcher，它会破坏 Node.js fetch。
 */

const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy ||
  process.env.ALL_PROXY ||
  process.env.all_proxy

if (proxyUrl) {
  console.log(`[Network] Proxy available but not used by default: ${proxyUrl}`)
} else {
  console.log('[Network] Direct connection (no proxy)')
}

/**
 * 获取代理 URL（供 OSS SDK 等需要单独配置的场景使用）
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
