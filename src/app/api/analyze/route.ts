import { NextRequest, NextResponse } from "next/server";
import { analyzeVideo } from "@/lib/claude";
import { applyRateLimit } from "@/lib/middleware/rate-limit";

export async function POST(request: NextRequest) {
  // 应用速率限制
  const rateLimit = applyRateLimit(request);
  if (rateLimit) return rateLimit;

  try {
    const body = await request.json();
    const { title, description, tags, platform } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // 输入长度验证（防止超长输入）
    if (title.length > 500 || (description && description.length > 10000)) {
      return NextResponse.json(
        { success: false, error: "Input too long" },
        { status: 400 }
      );
    }

    const analysis = await analyzeVideo(
      title,
      description || "",
      tags || [],
      platform || "youtube"
    );

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error("Analysis API error:", error);
    // 生产环境不返回详细错误信息
    const message = process.env.NODE_ENV === 'production'
      ? "Failed to analyze video"
      : error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
