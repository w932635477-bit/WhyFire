/**
 * URL 安全校验工具
 *
 * SSRF 防护：只允许 http/https 协议的公网 URL，阻止内网地址、本地地址、特殊域名。
 * 阻止 file://、data: 等危险协议。
 */

/** 检查 URL 是否为公网可访问地址（SSRF 防护） */
export function isValidPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // 只允许 http 和 https 协议，阻止 file://、data: 等
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    const hostname = parsed.hostname.toLowerCase()
    // 空主机名（如 http://）也拒绝
    if (!hostname) return false
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname.startsWith('169.254.') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost')
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}
