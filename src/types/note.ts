/**
 * 统一的小红书笔记类型定义
 *
 * 解决 src/lib/anthropic/types.ts 和 src/lib/platforms/xiaohongshu/types.ts 之间的重复问题
 */

/**
 * 小红书互动数据
 */
export interface XhsInteractions {
  likeCount: number;
  collectCount: number;
  commentCount: number;
  shareCount: number;

  // 计算字段（可选，由服务端计算）
  totalInteractions?: number;
  collectToLikeRatio?: number;
}

/**
 * 小红书作者数据
 */
export interface XhsAuthor {
  authorId: string;
  authorName: string;
  avatarUrl?: string;
  followerCount?: number;

  // 小红书特有字段
  redId?: string;
  noteCount?: number;
  likedCount?: number;
  verified?: boolean;
  verifiedType?: string;
}

/**
 * 小红书笔记数据（统一版本）
 *
 * 这是系统中唯一的小红书笔记数据类型定义
 */
export interface XhsNoteData {
  // 标识信息
  noteId: string;
  noteUrl: string;
  platform: 'xiaohongshu';

  // 基础信息
  title: string;
  description: string;
  noteType: 'normal' | 'video';

  // 媒体内容
  coverImage: string;
  images?: string[];
  videoUrl?: string;

  // 话题标签
  hashtags: string[];

  // 作者信息
  author: XhsAuthor;

  // 互动数据
  interactions: XhsInteractions;

  // 元数据
  publishedAt?: Date;
  scrapedAt: Date;
  location?: string;
  isRecommended?: boolean;
}

/**
 * 简化的笔记数据（用于AI分析）
 *
 * 当只需要基本字段时使用此类型
 */
export interface XhsNoteDataSimple {
  noteId: string;
  title: string;
  description: string;
  tags: string[];
  images: string[];
  likes: number;
  collects: number;
  comments: number;
  shares: number;
  authorName: string;
  authorId: string;
  authorFollowers?: number;
  publishTime?: string;
}

/**
 * 类型转换：从完整数据转换为简化数据
 */
export function toSimpleNoteData(note: XhsNoteData): XhsNoteDataSimple {
  return {
    noteId: note.noteId,
    title: note.title,
    description: note.description,
    tags: note.hashtags,
    images: note.images || [],
    likes: note.interactions.likeCount,
    collects: note.interactions.collectCount,
    comments: note.interactions.commentCount,
    shares: note.interactions.shareCount,
    authorName: note.author.authorName,
    authorId: note.author.authorId,
    authorFollowers: note.author.followerCount,
    publishTime: note.publishedAt?.toISOString(),
  };
}

/**
 * 类型转换：从简化数据转换为完整数据
 */
export function toFullNoteData(
  simple: XhsNoteDataSimple,
  options: Partial<Pick<XhsNoteData, 'noteUrl' | 'noteType' | 'coverImage'>> = {}
): XhsNoteData {
  return {
    noteId: simple.noteId,
    noteUrl: options.noteUrl || `https://www.xiaohongshu.com/explore/${simple.noteId}`,
    platform: 'xiaohongshu',
    title: simple.title,
    description: simple.description,
    noteType: options.noteType || 'normal',
    coverImage: options.coverImage || (simple.images[0] || ''),
    images: simple.images,
    hashtags: simple.tags,
    author: {
      authorId: simple.authorId,
      authorName: simple.authorName,
      followerCount: simple.authorFollowers,
    },
    interactions: {
      likeCount: simple.likes,
      collectCount: simple.collects,
      commentCount: simple.comments,
      shareCount: simple.shares,
    },
    publishedAt: simple.publishTime ? new Date(simple.publishTime) : undefined,
    scrapedAt: new Date(),
  };
}

// 重导出兼容旧代码的类型别名
export type { XhsNoteData as XhsNoteDataFull } from './note';
