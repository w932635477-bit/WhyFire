/**
 * 平台通用类型定义
 */

export type Platform = 'xiaohongshu' | 'douyin' | 'bilibili' | 'youtube' | 'tiktok';

export interface BaseNoteData {
  platform: Platform;
  noteId: string;
  noteUrl: string;
  scrapedAt: Date;
}

export interface BaseAuthorData {
  authorId: string;
  authorName: string;
  avatarUrl?: string;
  followerCount?: number;
}

export interface BaseInteractionData {
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  collectCount?: number;
}

export interface ScrapingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  scrapedAt: Date;
}
