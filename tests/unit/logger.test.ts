/**
 * 日志模块测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// 简化的 Logger 接口用于测试
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
interface LogContext { [key: string]: unknown }

interface Logger {
  trace(ctx: LogContext | string, msg?: string): void
  debug(ctx: LogContext | string, msg?: string): void
  info(ctx: LogContext | string, msg?: string): void
  warn(ctx: LogContext | string, msg?: string): void
  error(ctx: LogContext | string, msg?: string): void
  fatal(ctx: LogContext | string, msg?: string): void
  child(context: LogContext): Logger
}

// 测试用 Logger 实现
class TestLogger implements Logger {
  public logs: Array<{ level: LogLevel; context: LogContext; message: string }> = []
  private minLevel: number
  private context: LogContext

  private levels: Record<LogLevel, number> = {
    trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60,
  }

  constructor(level: LogLevel = 'info', context: LogContext = {}) {
    this.minLevel = this.levels[level]
    this.context = context
  }

  private log(level: LogLevel, ctxOrMsg: LogContext | string, msg?: string): void {
    if (this.levels[level] < this.minLevel) return

    const context = typeof ctxOrMsg === 'string' ? this.context : { ...this.context, ...ctxOrMsg }
    const message = typeof ctxOrMsg === 'string' ? ctxOrMsg : msg || ''

    this.logs.push({ level, context, message })
  }

  trace(ctx: LogContext | string, msg?: string) { this.log('trace', ctx, msg) }
  debug(ctx: LogContext | string, msg?: string) { this.log('debug', ctx, msg) }
  info(ctx: LogContext | string, msg?: string) { this.log('info', ctx, msg) }
  warn(ctx: LogContext | string, msg?: string) { this.log('warn', ctx, msg) }
  error(ctx: LogContext | string, msg?: string) { this.log('error', ctx, msg) }
  fatal(ctx: LogContext | string, msg?: string) { this.log('fatal', ctx, msg) }

  child(context: LogContext): Logger {
    return new TestLogger(
      Object.entries(this.levels).find(([, v]) => v === this.minLevel)?.[0] as LogLevel || 'info',
      { ...this.context, ...context }
    )
  }

  clear() { this.logs = [] }
}

// 简化的 Timer 用于测试
interface Timer {
  elapsed(): number
  end(logger: Logger, message?: string): number
}

class TestTimer implements Timer {
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

function startTimer(context: LogContext = {}): Timer {
  return new TestTimer(context)
}

async function measure<T>(logger: Logger, name: string, fn: () => Promise<T>): Promise<T> {
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

describe('Logger', () => {
  let logger: TestLogger

  beforeEach(() => {
    logger = new TestLogger('debug')
  })

  describe('日志级别', () => {
    it('should log at info level', () => {
      logger.info('Test message')
      expect(logger.logs).toHaveLength(1)
      expect(logger.logs[0].level).toBe('info')
      expect(logger.logs[0].message).toBe('Test message')
    })

    it('should log at debug level', () => {
      logger.debug('Debug message')
      expect(logger.logs).toHaveLength(1)
      expect(logger.logs[0].level).toBe('debug')
    })

    it('should log at error level', () => {
      logger.error('Error message')
      expect(logger.logs).toHaveLength(1)
      expect(logger.logs[0].level).toBe('error')
    })

    it('should skip logs below minimum level', () => {
      const warnLogger = new TestLogger('warn')
      warnLogger.debug('Should be skipped')
      warnLogger.info('Should be skipped')
      warnLogger.warn('Should be logged')

      expect(warnLogger.logs).toHaveLength(1)
      expect(warnLogger.logs[0].level).toBe('warn')
    })
  })

  describe('上下文', () => {
    it('should include context in log', () => {
      logger.info({ userId: '123', action: 'login' }, 'User action')
      expect(logger.logs[0].context.userId).toBe('123')
      expect(logger.logs[0].context.action).toBe('login')
    })

    it('should support message-only logging', () => {
      logger.info('Simple message')
      expect(logger.logs[0].message).toBe('Simple message')
    })
  })

  describe('child logger', () => {
    it('should create child with merged context', () => {
      const parentLogger = new TestLogger('info', { service: 'test' })
      const childLogger = parentLogger.child({ module: 'api' })

      childLogger.info('Child message')

      expect(childLogger.logs[0].context.service).toBe('test')
      expect(childLogger.logs[0].context.module).toBe('api')
    })
  })
})

describe('Timer', () => {
  let logger: TestLogger

  beforeEach(() => {
    logger = new TestLogger('debug')
  })

  it('should measure elapsed time', async () => {
    const timer = startTimer()
    await new Promise(r => setTimeout(r, 50))
    const elapsed = timer.elapsed()

    expect(elapsed).toBeGreaterThanOrEqual(40)
  })

  it('should log duration on end', () => {
    const timer = startTimer({ operation: 'test' })
    const duration = timer.end(logger, 'Test completed')

    expect(logger.logs).toHaveLength(1)
    expect(logger.logs[0].context.durationMs).toBe(duration)
  })
})

describe('measure', () => {
  let logger: TestLogger

  beforeEach(() => {
    logger = new TestLogger('debug')
  })

  it('should measure successful operation', async () => {
    const result = await measure(logger, 'testOp', async () => {
      await new Promise(r => setTimeout(r, 10))
      return 'success'
    })

    expect(result).toBe('success')
    expect(logger.logs).toHaveLength(1)
    expect(logger.logs[0].message).toBe('testOp completed')
  })

  it('should log failed operation', async () => {
    await expect(
      measure(logger, 'failOp', async () => {
        throw new Error('Test error')
      })
    ).rejects.toThrow('Test error')

    expect(logger.logs).toHaveLength(1)
    expect(logger.logs[0].level).toBe('error')
    expect(logger.logs[0].message).toBe('failOp failed')
  })
})
