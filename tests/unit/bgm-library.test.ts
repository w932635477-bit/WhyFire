/**
 * BGM Library 单元测试
 */

import { describe, it, expect } from 'vitest'
import {
  BGM_LIBRARY,
  getBGMById,
  getDefaultBGM,
  listAllBGM,
  toSunoStyle,
  type BGMMetadata,
} from '@/lib/music/bgm-library.js'

describe('BGM Library', () => {
  describe('BGM_LIBRARY', () => {
    it('should have at least 6 BGMs', () => {
      expect(BGM_LIBRARY.length).toBeGreaterThanOrEqual(6)
    })

    it('each BGM should have required fields', () => {
      const requiredFields: (keyof BGMMetadata)[] = ['id', 'url', 'bpm', 'styleTags', 'energy', 'mood', 'duration']

      BGM_LIBRARY.forEach(bgm => {
        requiredFields.forEach(field => {
          expect(bgm[field]).toBeDefined()
        })
      })
    })

    it('all BGMs should have valid URLs', () => {
      BGM_LIBRARY.forEach(bgm => {
        // 支持 OSS 直链 或 audio-proxy 本地代理路径
        const isValid = bgm.url.startsWith('https://') || bgm.url.startsWith('/api/audio-proxy')
        expect(isValid).toBe(true)
      })
    })

    it('all BGMs should have valid BPM (positive integer)', () => {
      BGM_LIBRARY.forEach(bgm => {
        expect(bgm.bpm).toBeGreaterThan(0)
        expect(Number.isInteger(bgm.bpm)).toBe(true)
      })
    })

    it('all BGMs should have valid energy level', () => {
      const validEnergy = ['low', 'medium', 'high']

      BGM_LIBRARY.forEach(bgm => {
        expect(validEnergy).toContain(bgm.energy)
      })
    })

    it('all BGMs should have at least one mood tag', () => {
      BGM_LIBRARY.forEach(bgm => {
        expect(bgm.mood.length).toBeGreaterThan(0)
      })
    })
  })

  describe('getBGMById', () => {
    it('should return BGM for valid ID', () => {
      const bgm = getBGMById('fortune-flow')
      expect(bgm).toBeDefined()
      expect(bgm?.id).toBe('fortune-flow')
    })

    it('should return undefined for invalid ID', () => {
      const bgm = getBGMById('non-existent-bgm')
      expect(bgm).toBeUndefined()
    })

    it('should return correct BGM for each known ID', () => {
      const knownIds = ['apt-remix', 'brazilian-phonk', 'fortune-flow', 'karma-dark', 'warm-gray', 'wonderful-01']

      knownIds.forEach(id => {
        const bgm = getBGMById(id)
        expect(bgm).toBeDefined()
        expect(bgm?.id).toBe(id)
      })
    })
  })

  describe('getDefaultBGM', () => {
    it('should return the first BGM', () => {
      const defaultBgm = getDefaultBGM()
      expect(defaultBgm).toBeDefined()
      expect(defaultBgm?.id).toBe(BGM_LIBRARY[0].id)
    })

    it('should return a valid BGM with all fields', () => {
      const defaultBgm = getDefaultBGM()
      expect(defaultBgm?.url).toBeDefined()
      expect(defaultBgm?.bpm).toBeGreaterThan(0)
      expect(defaultBgm?.styleTags).toBeDefined()
    })
  })

  describe('listAllBGM', () => {
    it('should return all BGMs', () => {
      const list = listAllBGM()
      expect(list.length).toBe(BGM_LIBRARY.length)
    })

    it('should return the same reference (performance optimization)', () => {
      const list1 = listAllBGM()
      const list2 = listAllBGM()
      // 注意：这是故意返回同一引用，避免不必要的复制
      expect(list1).toBe(list2)
    })

    it('should contain all BGM IDs', () => {
      const list = listAllBGM()
      const ids = list.map(b => b.id)
      expect(ids).toContain('fortune-flow')
      expect(ids).toContain('karma-dark')
    })
  })

  describe('toSunoStyle', () => {
    it('should combine styleTags, BPM, and mood', () => {
      const bgm: BGMMetadata = {
        id: 'test',
        url: 'https://example.com/test.mp3',
        bpm: 120,
        styleTags: 'trap, dark',
        energy: 'high',
        mood: ['aggressive', 'confident'],
        duration: 120,
      }

      const style = toSunoStyle(bgm)

      expect(style).toContain('trap, dark')
      expect(style).toContain('120 BPM')
      expect(style).toContain('aggressive')
      expect(style).toContain('confident')
    })

    it('should handle empty styleTags', () => {
      const bgm: BGMMetadata = {
        id: 'test',
        url: 'https://example.com/test.mp3',
        bpm: 100,
        styleTags: '',
        energy: 'low',
        mood: ['chill'],
        duration: 100,
      }

      const style = toSunoStyle(bgm)

      expect(style).toContain('100 BPM')
      expect(style).toContain('chill')
    })

    it('should handle empty mood array', () => {
      const bgm: BGMMetadata = {
        id: 'test',
        url: 'https://example.com/test.mp3',
        bpm: 90,
        styleTags: 'ambient',
        energy: 'low',
        mood: [],
        duration: 90,
      }

      const style = toSunoStyle(bgm)

      expect(style).toContain('ambient')
      expect(style).toContain('90 BPM')
    })
  })
})
