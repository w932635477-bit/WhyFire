/**
 * TikTok 数据获取封装 (via Apify)
 * 使用 Apify TikTok Scraper 获取热门数据
 */

export interface TikTokVideo {
  id: string;
  text: string;
  hashtags: string[];
  playCount: number;
  shareCount: number;
  commentCount: number;
  diggCount: number;
  createTime: number;
  author: {
    uniqueId: string;
    nickname: string;
    avatar: string;
  };
  video: {
    playAddr: string;
    cover: string;
    duration: number;
  };
}

const APIFY_API_BASE = "https://api.apify.com/v2";

/**
 * 使用 Apify TikTok Scraper 获取热门视频
 */
export async function getTrendingVideos(
  maxResults: number = 20
): Promise<TikTokVideo[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN is not set");
  }

  // 启动 Apify actor
  const runUrl = new URL(
    `${APIFY_API_BASE}/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items`
  );
  runUrl.searchParams.set("token", token);

  const response = await fetch(runUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hashtags: ["fyp", "viral", "trending"],
      resultsPerPage: maxResults,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.status}`);
  }

  const data = await response.json();

  return data.map((item: Record<string, unknown>) => ({
    id: item.id as string,
    text: item.text as string,
    hashtags: (item.hashtags as Array<Record<string, unknown>>)?.map((h) => h.name as string) || [],
    playCount: (item.playCount as number) || 0,
    shareCount: (item.shareCount as number) || 0,
    commentCount: (item.commentCount as number) || 0,
    diggCount: (item.diggCount as number) || 0,
    createTime: item.createTime as number,
    author: {
      uniqueId: (item.authorMeta as Record<string, unknown>)?.name as string || "",
      nickname: (item.authorMeta as Record<string, unknown>)?.nickName as string || "",
      avatar: (item.authorMeta as Record<string, unknown>)?.avatar as string || "",
    },
    video: {
      playAddr: (item.videoUrl as string) || "",
      cover: (item.imageUrl as string) || "",
      duration: 0,
    },
  }));
}
