import { NextResponse } from "next/server";
import { analyzeVideo } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, tags, platform } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
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
    return NextResponse.json(
      { success: false, error: "Failed to analyze video" },
      { status: 500 }
    );
  }
}
