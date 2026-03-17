import { NextResponse } from "next/server";
import { getTrendingVideos } from "@/lib/tiktok";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const maxResults = parseInt(searchParams.get("maxResults") || "20");

  try {
    const videos = await getTrendingVideos(maxResults);
    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    console.error("TikTok API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch TikTok videos" },
      { status: 500 }
    );
  }
}
