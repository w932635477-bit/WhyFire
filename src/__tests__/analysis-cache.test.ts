/**
 * 分析缓存模块测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 由于 analysis-cache 使用 Node.js crypto，我们需要模拟它
vi.mock('crypto', () => ({
  default: {
    createHash: () => ({
      update: () => ({
        digest: () => ({
          slice: () => 'mockedhash123456',
        }),
      }),
    }),
  },
  createHash: () => ({
    update: () => ({
      digest: () => ({
        slice: () => 'mockedhash123456',
      }),
    }),
  }),
}));

describe('Analysis Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', async () => {
    const { withCache } = await import('@/lib/cache/analysis-cache');
    expect(withCache).toBeDefined();
    expect(typeof withCache).toBe('function');
  });

  it('should cache function results', async () => {
    const { withCache } = await import('@/lib/cache/analysis-cache');

    const mockFn = vi.fn().mockResolvedValue({ data: 'test' });
    const cachedFn = withCache(mockFn, 'test', 60000);

    // 第一次调用
    const result1 = await cachedFn('arg1');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result1).toEqual({ data: 'test' });

    // 第二次调用应该使用缓存
    const result2 = await cachedFn('arg1');
    expect(mockFn).toHaveBeenCalledTimes(1); // 没有再次调用
    expect(result2).toEqual({ data: 'test' });
  });

  it('should use custom key generator', async () => {
    const { withCache } = await import('@/lib/cache/analysis-cache');

    const mockFn = vi.fn().mockResolvedValue({ id: 1 });
    const keyGen = vi.fn().mockReturnValue('custom-key');
    const cachedFn = withCache(mockFn, 'test', 60000, keyGen);

    await cachedFn({ id: 1 }, { id: 2 });

    expect(keyGen).toHaveBeenCalledWith({ id: 1 }, { id: 2 });
  });
});

describe('Cache Stats', () => {
  it('should return cache statistics', async () => {
    const { getCacheStats } = await import('@/lib/cache/analysis-cache');

    const stats = getCacheStats();

    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('maxEntries');
    expect(typeof stats.size).toBe('number');
    expect(typeof stats.maxEntries).toBe('number');
  });
});
