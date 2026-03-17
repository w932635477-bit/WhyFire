/**
 * AI 分析模块使用示例
 * 展示如何在 API Route 或 Server Action 中使用
 */

import {
  analyzeCompetitor,
  diagnoseContent,
  analyzeInspiration,
  analyzeInspirationBatch,
  XhsNoteData,
  OverseasVideo,
} from '@/lib/anthropic';

/**
 * 示例 1: 竞品分析
 * 用于 Step 1: 竞品分析
 */
export async function exampleCompetitorAnalysis() {
  // 假设这是从小红书抓取的竞品数据
  const competitorNote: XhsNoteData = {
    noteId: 'note123',
    title: '震惊!这个方法让我7天涨粉10万',
    description:
      '今天分享一个超级实用的涨粉方法,只需要3步...',
    tags: ['涨粉技巧', '小红书运营', '内容创作'],
    images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
    likes: 50000,
    collects: 12000,
    comments: 3500,
    shares: 8900,
    authorName: '运营小能手',
    authorId: 'user456',
    authorFollowers: 250000,
    publishTime: '2026-03-15',
  };

  // 执行竞品分析
  const result = await analyzeCompetitor(competitorNote);

  console.log('竞品分析结果:', result);
  // {
  //   hookScore: 9,
  //   contentScore: 8,
  //   visualScore: 7,
  //   viralPotential: '...',
  //   keyInsights: [...],
  //   ...
  // }

  return result;
}

/**
 * 示例 2: 内容诊断
 * 用于 Step 2: 内容诊断
 */
export async function exampleContentDiagnosis() {
  // 竞品分析结果（从 Step 1 获取）
  const competitorResult = await exampleCompetitorAnalysis();

  // 用户笔记数据
  const userNote: XhsNoteData = {
    noteId: 'note789',
    title: '分享一些涨粉技巧',
    description: '今天跟大家分享几个涨粉的方法...',
    tags: ['涨粉'],
    images: ['image1.jpg'],
    likes: 120,
    collects: 35,
    comments: 8,
    shares: 12,
    authorName: '我的账号',
    authorId: 'user999',
    authorFollowers: 1500,
    publishTime: '2026-03-17',
  };

  // 执行内容诊断
  const result = await diagnoseContent(userNote, competitorResult);

  console.log('诊断结果:', result);
  // {
  //   overallScore: 5,
  //   hookGap: -4,  // 与竞品差距
  //   contentGap: -3,
  //   visualGap: -2,
  //   improvements: [
  //     { priority: 'HIGH', category: '标题优化', ... },
  //     ...
  //   ],
  //   ...
  // }

  return result;
}

/**
 * 示例 3: 灵感解读（单个视频）
 * 用于 Step 4: 海外创意灵感库
 */
export async function exampleInspirationAnalysis() {
  // 诊断结果（从 Step 2 获取，可选）
  const diagnosisResult = await exampleContentDiagnosis();

  // 海外视频数据（从 YouTube/TikTok API 获取）
  const video: OverseasVideo = {
    platform: 'youtube',
    videoId: 'abc123',
    title: 'How I Grew to 100K Followers in 30 Days',
    description:
      'In this video, I share the exact strategy I used to grow...',
    tags: ['growth', 'social media', 'tips'],
    viewCount: 1500000,
    likeCount: 89000,
    commentCount: 3400,
    thumbnail: 'https://example.com/thumb.jpg',
    channelName: 'Content Creator',
    channelId: 'channel123',
    publishedAt: '2026-03-01',
  };

  // 执行灵感解读
  const result = await analyzeInspiration(video, diagnosisResult);

  console.log('灵感解读:', result);
  // {
  //   creativeInsight: '...',
  //   keyElements: [...],
  //   localizationAdvice: '...',
  //   suggestedTitles: [...],
  //   relevanceScore: 8,
  //   ...
  // }

  return result;
}

/**
 * 示例 4: 批量分析灵感视频
 * 用于 Step 4: 海外创意灵感库
 */
export async function exampleBatchAnalysis() {
  // 诊断结果
  const diagnosisResult = await exampleContentDiagnosis();

  // 多个海外视频（6-10个）
  const videos: OverseasVideo[] = [
    {
      platform: 'youtube',
      videoId: 'vid1',
      title: 'Video 1',
      description: 'Description 1',
      tags: ['tag1'],
      viewCount: 100000,
      likeCount: 5000,
      commentCount: 200,
      thumbnail: 'thumb1.jpg',
      channelName: 'Channel 1',
      channelId: 'ch1',
      publishedAt: '2026-03-01',
    },
    // ... 更多视频
  ];

  // 批量分析（并行执行）
  const results = await analyzeInspirationBatch(videos, diagnosisResult);

  console.log('批量分析结果:', results);
  // 按相关度排序的结果数组

  return results;
}

/**
 * 示例 5: 在 API Route 中使用
 * app/api/wizard/competitor/route.ts
 */
export async function POST_competitor(request: Request) {
  try {
    const { noteUrl } = await request.json();

    // 1. 抓取小红书数据（调用 Playwright 服务）
    const noteData = await fetchXhsNoteData(noteUrl);

    // 2. AI 分析
    const result = await analyzeCompetitor(noteData);

    // 3. 返回结果
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Competitor analysis error:', error);
    return Response.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

/**
 * 示例 6: 在 Server Action 中使用
 * app/actions/analyze.ts
 */
'use server';

export async function analyzeCompetitorAction(noteUrl: string) {
  try {
    // 1. 抓取数据
    const noteData = await fetchXhsNoteData(noteUrl);

    // 2. AI 分析
    const result = await analyzeCompetitor(noteData);

    // 3. 保存到数据库或 Session
    // await saveToSession(result);

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Analysis failed' };
  }
}

// 辅助函数（实际实现需要调用 Playwright 服务）
async function fetchXhsNoteData(url: string): Promise<XhsNoteData> {
  // TODO: 实现 Playwright 抓取逻辑
  throw new Error('Not implemented');
}
