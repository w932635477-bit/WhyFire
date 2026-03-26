/**
 * 结构化日志模块
 *
 * 高性能结构化日志，支持日志级别、上下文、性能追踪
 */

// ============================================================================
// 类型定义
// ============================================================================

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  [key: string]: unknown
}

export interface Logger {
  trace(context: LogContext | string, message?: string): void
  debug(context: LogContext | string, message?: string): void
  info(context: LogContext | string, message?: string): void
  warn(context: LogContext | string, message?: string): void
  error(context: LogContext | string, message?: string): void
  fatal(context: LogContext | string, message?: string): void
  child(context: LogContext): Logger
}

export interface Timer {
  elapsed(): number
  end(logger: Logger, message?: string): number
}

// ============================================================================
// 日志级别和颜色
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60,
}

const COLORS: Record<LogLevel, string> = {
  trace: '\x1b[90m', debug: '\x1b[36m', info: '\x1b[32m',
  warn: '\x1b[33m', error: '\x1b[31m', fatal: '\x1b[35m',
}
const RESET = '\x1b[0m'

// ============================================================================
// Logger 类
// ============================================================================

class SimpleLogger implements Logger {
  private minLevel: number
  private context: LogContext
  private isDev: boolean

  constructor(level: LogLevel, context: LogContext = {}) {
    this.minLevel = LOG_LEVELS[level]
    this.context = context
    this.isDev = process.env.NODE_ENV === 'development'
  }

  private log(level: LogLevel, ctxOrMsg: LogContext | string, msg?: string): void {
    if (LOG_LEVELS[level] < this.minLevel) return

    const timestamp = new Date().toISOString()
    const context = typeof ctxOrMsg === 'string' ? this.context : { ...this.context, ...ctxOrMsg }
    const message = typeof ctxOrMsg === 'string' ? ctxOrMsg : msg || ''

    if (this.isDev) {
      const color = COLORS[level]
      const levelPad = level.toUpperCase().padEnd(5)
      const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : ''
      console.log(`${color}[${timestamp}] ${levelPad}${RESET} ${message}${contextStr}`)
    } else {
      console.log(JSON.stringify({ timestamp, level, message, ...context }))
    }
  }

  trace(ctx: LogContext | string, msg?: string) { this.log('trace', ctx, msg) }
  debug(ctx: LogContext | string, msg?: string) { this.log('debug', ctx, msg) }
  info(ctx: LogContext | string, msg?: string) { this.log('info', ctx, msg) }
  warn(ctx: LogContext | string, msg?: string) { this.log('warn', ctx, msg) }
  error(ctx: LogContext | string, msg?: string) { this.log('error', ctx, msg) }
  fatal(ctx: LogContext | string, msg?: string) { this.log('fatal', ctx, msg) }

  child(context: LogContext): Logger {
    return new SimpleLogger(
      Object.entries(LOG_LEVELS).find(([, v]) => v === this.minLevel)?.[0] as LogLevel || 'info',
      { ...this.context, ...context }
    )
  }
}

// ============================================================================
// 计时器
// ============================================================================

class SimpleTimer implements Timer {
  private start: number
  private ctx: LogContext

  constructor(context: LogContext = {}) {
    this.start = Date.now()
    this.ctx = context
  }

  elapsed() { return Date.now() - this.start }

  end(logger: Logger, message = 'Operation completed'): number {
    const duration = this.elapsed()
    logger.debug({ ...this.ctx, durationMs: duration }, message)
    return duration
  }
}

export function startTimer(context: LogContext = {}): Timer {
  return new SimpleTimer(context)
}

export async function measure<T>(logger: Logger, name: string, fn: () => Promise<T>): Promise<T> {
  const timer = startTimer({ operation: name })
  try {
    const result = await fn()
    timer.end(logger, `${name} completed`)
    return result
  } catch (error) {
    logger.error({ operation: name, durationMs: timer.elapsed(), error: String(error) }, `${name} failed`)
    throw error
  }
}

// ============================================================================
// 默认实例
// ============================================================================

const defaultLevel = (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'development' ? 'debug' : 'info')

export const logger = new SimpleLogger(defaultLevel, { service: 'whyfire' })
export const rapLogger = logger.child({ module: 'rap' })
export const apiLogger = logger.child({ module: 'api' })
export const audioLogger = logger.child({ module: 'audio' })

export default logger
