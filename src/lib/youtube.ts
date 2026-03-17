/**
 * YouTube Data API v3 封装
 * 用于获取 YouTube Shorts trending 数据
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  statistics: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
  snippet: {
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    tags?: string[];
    categoryId: string;
  };
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * 获取热门视频列表
 */
export async function getTrendingVideos(
  regionCode: string = "US",
  maxResults: number = 20
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }

  // 先获取视频ID列表
  const videosUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
  videosUrl.searchParams.set("part", "snippet,statistics,contentDetails");
  videosUrl.searchParams.set("chart", "mostPopular");
  videosUrl.searchParams.set("regionCode", regionCode);
  videosUrl.searchParams.set("maxResults", maxResults.toString());
  videosUrl.searchParams.set("videoCategoryId", "0"); // All categories
  videosUrl.searchParams.set("key", apiKey);

  const response = await fetch(videosUrl.toString());
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();

  return data.items.map((item: Record<string, unknown>) => ({
    id: item.id as string,
    title: (item.snippet as Record<string, unknown>).title as string,
    description: (item.snippet as Record<string, unknown>).description as string,
    thumbnails: (item.snippet as Record<string, unknown>).thumbnails as YouTubeVideo["thumbnails"],
    statistics: {
      viewCount: parseInt((item.statistics as Record<string, unknown>).viewCount as string) || 0,
      likeCount: parseInt((item.statistics as Record<string, unknown>).likeCount as string) || 0,
      commentCount: parseInt((item.statistics as Record<string, unknown>).commentCount as string) || 0,
    },
    snippet: {
      channelId: (item.snippet as Record<string, unknown>).channelId as string,
      channelTitle: (item.snippet as Record<string, unknown>).channelTitle as string,
      publishedAt: (item.snippet as Record<string, unknown>).publishedAt as string,
      tags: (item.snippet as Record<string, unknown>).tags as string[] | undefined,
      categoryId: (item.snippet as Record<string, unknown>).categoryId as string,
    },
  }));
}

/**
 * 搜索视频
 */
export async function searchVideos(
  query: string,
  maxResults: number = 20
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }

  const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", maxResults.toString());
  searchUrl.searchParams.set("key", apiKey);

  const response = await fetch(searchUrl.toString());
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();

  // 需要额外请求获取统计数据
  const videoIds = data.items
    .map((item: Record<string, unknown>) => (item.id as Record<string, unknown>).videoId as string)
    .join(",");

  const videosUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
  videosUrl.searchParams.set("part", "snippet,statistics,contentDetails");
  videosUrl.searchParams.set("id", videoIds);
  videosUrl.searchParams.set("key", apiKey);

  const videosResponse = await fetch(videosUrl.toString());
  const videosData = await videosResponse.json();

  return videosData.items.map((item: Record<string, unknown>) => ({
    id: item.id as string,
    title: (item.snippet as Record<string, unknown>).title as string,
    description: (item.snippet as Record<string, unknown>).description as string,
    thumbnails: (item.snippet as Record<string, unknown>).thumbnails as YouTubeVideo["thumbnails"],
    statistics: {
      viewCount: parseInt((item.statistics as Record<string, unknown>).viewCount as string) || 0,
      likeCount: parseInt((item.statistics as Record<string, unknown>).likeCount as string) || 0,
      commentCount: parseInt((item.statistics as Record<string, unknown>).commentCount as string) || 0,
    },
    snippet: {
      channelId: (item.snippet as Record<string, unknown>).channelId as string,
      channelTitle: (item.snippet as Record<string, unknown>).channelTitle as string,
      publishedAt: (item.snippet as Record<string, unknown>).publishedAt as string,
      tags: (item.snippet as Record<string, unknown>).tags as string[] | undefined,
      categoryId: (item.snippet as Record<string, unknown>).categoryId as string,
    },
  }));
}
