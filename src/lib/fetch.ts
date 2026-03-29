/**
 * 代理感知的 fetch 工具
 *
 * Node.js 22 的原生 fetch (undici) 不自动读取 HTTP_PROXY 环境变量。
 * 这个模块提供统一的代理感知 fetch，供所有外部 API 调用使用。
 *
 * 开发环境：通过 HTTP_PROXY/HTTPS_PROXY 走代理（解决 DNS 不可用问题）
 * 生产环境：无代理环境变量时直连
 */

import type { Dispatcher } from 'undici'

let _dispatcher: Dispatcher | undefined = undefined
let _dispatcherInit = false

/**
 * 获取 undici dispatcher（有代理时返回 ProxyAgent，否则 undefined 表示直连）
 */
export async function getProxyDispatcher(): Promise<Dispatcher | undefined> {
  if (_dispatcherInit) return _dispatcher

  _dispatcherInit = true
  const proxyUrl =
    process.env.HTTPS_PROXY || process.env.https_proxy ||
    process.env.HTTP_PROXY || process.env.http_proxy

  if (proxyUrl) {
    try {
      const { ProxyAgent } = await import('undici')
      _dispatcher = new ProxyAgent(proxyUrl) as Dispatcher
    } catch {
      // undici 不可用时直连
    }
  }

  return _dispatcher
}

/**
 * 代理感知的 fetch（开发环境自动走代理，生产环境直连）
 *
 * 用法同原生 fetch，自动处理代理。
 */
export async function proxiedFetch(
  url: string | URL,
  init?: RequestInit & { dispatcher?: unknown }
): Promise<Response> {
  const { fetch: undiciFetch } = await import('undici')
  const dispatcher = await getProxyDispatcher()

  // 分离 dispatcher 和标准 RequestInit
  const { dispatcher: _d, ...fetchInit } = init || {}

  return undiciFetch(url, {
    ...fetchInit,
    ...(dispatcher ? { dispatcher } : {}),
  } as Parameters<typeof undiciFetch>[1]) as unknown as Promise<Response>
}
