/**
 * 小红书数据类型定义
 */

import { BaseNoteData, BaseAuthorData, BaseInteractionData } from '../types';

/**
 * 小红书笔记数据（完整）
 */
export interface XhsNoteData extends BaseNoteData {
  platform: 'xiaohongshu';

  // 笔记基础信息
  title: string;
  description: string;
  noteType: 'normal' | 'video'; // 普通图文 or 视频

  // 封面图
  coverImage: string;

  // 图片列表（图文笔记）
  images?: string[];

  // 视频链接（视频笔记）
  videoUrl?: string;

  // 话题标签
  hashtags: string[];

  // 作者信息
  author: XhsAuthorData;

  // 互动数据
  interactions: XhsInteractionData;

  // 发布时间
  publishedAt?: Date;

  // 位置信息
  location?: string;

  // 是否推荐
  isRecommended?: boolean;
}

/**
 * 小红书作者数据
 */
export interface XhsAuthorData extends BaseAuthorData {
  // 小红书特有字段
  redId?: string; // 小红书号
  noteCount?: number; // 笔记数
  likedCount?: number; // 获赞数

  // 认证信息
  verified?: boolean;
  verifiedType?: string;
}

/**
 * 小红书互动数据
 */
export interface XhsInteractionData extends BaseInteractionData {
  // 小红书特有的互动类型
  collectCount: number; // 收藏数
  shareCount: number; // 分享数

  // 计算字段
  totalInteractions: number; // 总互动数
  collectToLikeRatio: number; // 收藏/点赞比（实用性指标）
}

/**
 * 抓取配置
 */
export interface XhsScraperConfig {
  // 是否使用无头浏览器
  headless?: boolean;

  // 超时时间（毫秒）
  timeout?: number;

  // 重试次数
  maxRetries?: number;

  // 重试延迟（毫秒）
  retryDelay?: number;

  // 请求间随机延迟范围
  randomDelay?: {
    min: number;
    max: number;
  };
}

/**
 * 小红书 URL 类型
 */
export type XhsUrlType = 'note' | 'user' | 'explore' | 'unknown';

/**
 * 从 URL 解析的信息
 */
export interface XhsUrlInfo {
  type: XhsUrlType;
  noteId?: string;
  userId?: string;
}

/**
 * 小红书页面原始数据（从 __INITIAL_STATE__ 提取）
 */
export interface XhsPageData {
  // 笔记 ID
  id?: string;
  // 笔记类型
  type?: 'normal' | 'video';
  // 标题
  title?: string;
  // 描述/正文
  desc?: string;
  // 发布时间戳
  time?: number;
  // IP 位置
  ipLocation?: string;
  // 是否推荐
  isRecommended?: boolean;
  // 互动信息
  interactInfo?: {
    likedCount?: number;
    collectedCount?: number;
    commentCount?: number;
    shareCount?: number;
  };
  // 用户信息
  user?: {
    userId?: string;
    nickname?: string;
    image?: string;
    redId?: string;
    fansCount?: number;
    noteCount?: number;
    likedCount?: number;
  };
  // 标签列表
  tagList?: XhsPageTag[];
  // 图片列表
  imageList?: XhsPageImage[];
  // 视频信息
  video?: {
    cover?: string;
    media?: {
      stream?: Array<{
        masterUrl?: string;
      }>;
    };
  };
}

/**
 * 小红书页面标签
 */
export interface XhsPageTag {
  name?: string;
  id?: string;
  type?: string;
}

/**
 * 小红书页面图片
 */
export interface XhsPageImage {
  urlDefault?: string;
  url?: string;
  width?: number;
  height?: number;
}
