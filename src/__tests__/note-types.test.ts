/**
 * 类型转换工具测试
 */

import { describe, it, expect } from 'vitest';
import { toSimpleNoteData, toFullNoteData, type XhsNoteData, type XhsNoteDataSimple } from '@/types/note';

describe('Note Type Conversions', () => {
  const mockFullNote: XhsNoteData = {
    noteId: 'test123',
    noteUrl: 'https://www.xiaohongshu.com/explore/test123',
    platform: 'xiaohongshu',
    title: 'Test Title',
    description: 'Test Description',
    noteType: 'normal',
    coverImage: 'https://example.com/cover.jpg',
    images: ['https://example.com/img1.jpg'],
    hashtags: ['tag1', 'tag2'],
    author: {
      authorId: 'author1',
      authorName: 'Test Author',
      followerCount: 1000,
    },
    interactions: {
      likeCount: 100,
      collectCount: 50,
      commentCount: 20,
      shareCount: 10,
    },
    scrapedAt: new Date('2026-03-17'),
  };

  describe('toSimpleNoteData', () => {
    it('should convert full note to simple format', () => {
      const simple = toSimpleNoteData(mockFullNote);

      expect(simple.noteId).toBe('test123');
      expect(simple.title).toBe('Test Title');
      expect(simple.tags).toEqual(['tag1', 'tag2']);
      expect(simple.likes).toBe(100);
      expect(simple.collects).toBe(50);
      expect(simple.authorName).toBe('Test Author');
    });

    it('should handle missing optional fields', () => {
      const noteWithoutOptional: XhsNoteData = {
        ...mockFullNote,
        images: undefined,
        publishedAt: undefined,
      };

      const simple = toSimpleNoteData(noteWithoutOptional);

      expect(simple.images).toEqual([]);
      expect(simple.publishTime).toBeUndefined();
    });
  });

  describe('toFullNoteData', () => {
    const mockSimpleNote: XhsNoteDataSimple = {
      noteId: 'simple123',
      title: 'Simple Title',
      description: 'Simple Desc',
      tags: ['tagA'],
      images: ['img1.jpg'],
      likes: 200,
      collects: 100,
      comments: 30,
      shares: 15,
      authorName: 'Simple Author',
      authorId: 'authorA',
    };

    it('should convert simple note to full format', () => {
      const full = toFullNoteData(mockSimpleNote);

      expect(full.noteId).toBe('simple123');
      expect(full.platform).toBe('xiaohongshu');
      expect(full.noteType).toBe('normal');
      expect(full.interactions.likeCount).toBe(200);
    });

    it('should accept custom options', () => {
      const full = toFullNoteData(mockSimpleNote, {
        noteUrl: 'https://custom.url',
        noteType: 'video',
        coverImage: 'https://custom.cover.jpg',
      });

      expect(full.noteUrl).toBe('https://custom.url');
      expect(full.noteType).toBe('video');
      expect(full.coverImage).toBe('https://custom.cover.jpg');
    });

    it('should generate default noteUrl', () => {
      const full = toFullNoteData(mockSimpleNote);

      expect(full.noteUrl).toBe('https://www.xiaohongshu.com/explore/simple123');
    });
  });
});
