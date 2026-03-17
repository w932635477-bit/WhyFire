import { NextResponse } from "next/server";
import { getTrendingVideos } from "@/lib/youtube";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") || "US";
  const maxResults = parseInt(searchParams.get("maxResults") || "20");

  try {
    const videos = await getTrendingVideos(region, maxResults);
    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    console.error("YouTube API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch YouTube videos" },
      { status: 500 }
    );
  }
}
