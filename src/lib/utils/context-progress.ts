/**
 * 上下文进度追踪工具
 * 显示 Claude Code 的上下文使用情况
 */

// Claude Code 的上下文限制（根据模型不同）
const CONTEXT_LIMITS = {
  'claude-opus-4-6': 200000,    // 200K tokens
  'claude-sonnet-4-6': 200000,  // 200K tokens
  'claude-haiku-4-5': 200000,   // 200K tokens
  'default': 200000,
}

// 警告阈值
const WARNING_THRESHOLDS = {
  info: 0.5,     // 50% - 信息提示
  warning: 0.7,  // 70% - 警告
  critical: 0.85, // 85% - 严重警告
  danger: 0.95,   // 95% - 危险
}

export interface ContextProgress {
  used: number
  total: number
  percentage: number
  level: 'safe' | 'info' | 'warning' | 'critical' | 'danger'
  remaining: number
  estimatedTurns: number
}

/**
 * 计算上下文使用进度
 */
export function calculateContextProgress(
  usedTokens: number,
  modelId: string = 'default'
): ContextProgress {
  const total = CONTEXT_LIMITS[modelId as keyof typeof CONTEXT_LIMITS] || CONTEXT_LIMITS.default
  const percentage = (usedTokens / total) * 100
  const remaining = total - usedTokens

  // 估算剩余轮次（假设每轮平均 2000 tokens）
  const avgTokensPerTurn = 2000
  const estimatedTurns = Math.floor(remaining / avgTokensPerTurn)

  // 确定警告级别
  let level: ContextProgress['level'] = 'safe'
  if (percentage >= WARNING_THRESHOLDS.danger * 100) {
    level = 'danger'
  } else if (percentage >= WARNING_THRESHOLDS.critical * 100) {
    level = 'critical'
  } else if (percentage >= WARNING_THRESHOLDS.warning * 100) {
    level = 'warning'
  } else if (percentage >= WARNING_THRESHOLDS.info * 100) {
    level = 'info'
  }

  return {
    used: usedTokens,
    total,
    percentage: Math.round(percentage * 10) / 10,
    level,
    remaining,
    estimatedTurns,
  }
}

/**
 * 生成进度条字符串
 */
export function generateProgressBar(
  percentage: number,
  width: number = 20,
  showPercentage: boolean = true
): string {
  const filled = Math.round((percentage / 100) * width)
  const empty = width - filled

  // 根据百分比选择颜色
  let color = '\x1b[32m' // 绿色
  if (percentage >= 95) {
    color = '\x1b[31m' // 红色
  } else if (percentage >= 85) {
    color = '\x1b[35m' // 紫色
  } else if (percentage >= 70) {
    color = '\x1b[33m' // 黄色
  } else if (percentage >= 50) {
    color = '\x1b[36m' // 青色
  }

  const reset = '\x1b[0m'
  const bar = '█'.repeat(filled) + '░'.repeat(empty)

  if (showPercentage) {
    return `${color}[${bar}] ${percentage.toFixed(1)}%${reset}`
  }
  return `${color}[${bar}]${reset}`
}

/**
 * 生成上下文进度报告
 */
export function generateContextReport(progress: ContextProgress): string {
  const bar = generateProgressBar(progress.percentage)
  const remainingKB = Math.round(progress.remaining / 1000)

  let report = `\n📊 上下文使用: ${bar}\n`
  report += `   已用: ${progress.used.toLocaleString()} / ${progress.total.toLocaleString()} tokens\n`
  report += `   剩余: ~${remainingKB}K tokens (约 ${progress.estimatedTurns} 轮对话)\n`

  // 根据级别添加警告
  switch (progress.level) {
    case 'danger':
      report += `   ⚠️  警告: 上下文即将耗尽！建议开始新会话。\n`
      break
    case 'critical':
      report += `   ⚡ 注意: 上下文使用率较高，考虑精简对话内容。\n`
      break
    case 'warning':
      report += `   💡 提示: 上下文使用超过 70%，注意控制内容长度。\n`
      break
    case 'info':
      report += `   📈 上下文使用超过 50%。\n`
      break
  }

  return report
}

/**
 * 获取状态栏格式的进度
 */
export function getStatusBarProgress(progress: ContextProgress): string {
  const icon = progress.level === 'danger' || progress.level === 'critical'
    ? '⚠️'
    : progress.level === 'warning'
      ? '⚡'
      : '📊'

  return `${icon} ${progress.percentage.toFixed(0)}%`
}

/**
 * 简单的上下文追踪器类
 * 用于在客户端追踪估算的上下文使用
 */
export class ContextTracker {
  private estimatedTokens: number = 0
  private modelId: string

  constructor(modelId: string = 'default') {
    this.modelId = modelId
  }

  /**
   * 估算文本的 token 数量
   * 简单估算：英文约 4 字符 = 1 token，中文约 2 字符 = 1 token
   */
  estimateTokens(text: string): number {
    // 简单估算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const otherChars = text.length - chineseChars
    return Math.ceil(chineseChars / 2 + otherChars / 4)
  }

  /**
   * 添加消息到上下文
   */
  addMessage(role: 'user' | 'assistant', content: string): void {
    // 每条消息有约 4 tokens 的开销（role, formatting 等）
    const overhead = 4
    this.estimatedTokens += this.estimateTokens(content) + overhead
  }

  /**
   * 获取当前进度
   */
  getProgress(): ContextProgress {
    return calculateContextProgress(this.estimatedTokens, this.modelId)
  }

  /**
   * 获取进度报告
   */
  getReport(): string {
    return generateContextReport(this.getProgress())
  }

  /**
   * 重置追踪器
   */
  reset(): void {
    this.estimatedTokens = 0
  }
}

// 导出单例实例
export const globalContextTracker = new ContextTracker()
