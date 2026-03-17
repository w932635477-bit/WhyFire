/**
 * AI 分析模块测试脚本
 * 运行: npx ts-node src/lib/anthropic/test.ts
 */

import {
  analyzeCompetitor,
  diagnoseContent,
  analyzeInspiration,
  XhsNoteData,
  OverseasVideo,
  CompetitorAnalysisResult,
} from './index';

// 测试数据
const mockCompetitorNote: XhsNoteData = {
  noteId: 'test-note-123',
  title: '震惊!这个方法让我7天涨粉10万',
  description: `今天分享一个超级实用的涨粉方法!

第1步: 找准定位
第2步: 研究爆款
第3步: 持续输出

关键是要坚持,不要三天打鱼两天晒网!

#涨粉技巧 #小红书运营 #内容创作`,
  tags: ['涨粉技巧', '小红书运营', '内容创作'],
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ],
  likes: 50000,
  collects: 12000,
  comments: 3500,
  shares: 8900,
  authorName: '运营小能手',
  authorId: 'user456',
  authorFollowers: 250000,
  publishTime: '2026-03-15',
};

const mockUserNote: XhsNoteData = {
  noteId: 'test-note-456',
  title: '分享一些涨粉技巧',
  description: `今天跟大家分享几个涨粉的方法。

主要是要坚持更新内容，还有就是多看别人的爆款。

希望大家能涨粉成功！`,
  tags: ['涨粉'],
  images: ['https://example.com/my-image.jpg'],
  likes: 120,
  collects: 35,
  comments: 8,
  shares: 12,
  authorName: '测试账号',
  authorId: 'test-user',
  authorFollowers: 1500,
  publishTime: '2026-03-17',
};

const mockVideo: OverseasVideo = {
  platform: 'youtube',
  videoId: 'test-video-789',
  title: 'How I Grew to 100K Followers in 30 Days (Exact Strategy)',
  description: `In this video, I share the exact strategy I used to grow from 0 to 100K followers in just 30 days.

Here's what I cover:
1. Content strategy
2. Posting schedule
3. Engagement tactics
4. Analytics review

Follow these steps and you'll see results!`,
  tags: ['growth', 'social media', 'tips', 'strategy'],
  viewCount: 1500000,
  likeCount: 89000,
  commentCount: 3400,
  thumbnail: 'https://example.com/thumb.jpg',
  channelName: 'Content Creator Pro',
  channelId: 'channel123',
  publishedAt: '2026-03-01',
};

// 测试函数
async function testCompetitorAnalysis() {
  console.log('\n=== 测试 1: 竞品分析 ===');
  try {
    const result = await analyzeCompetitor(mockCompetitorNote);
    console.log('✅ 竞品分析成功');
    console.log('- 钩子强度:', result.hookScore);
    console.log('- 内容价值:', result.contentScore);
    console.log('- 视觉吸引力:', result.visualScore);
    console.log('- 爆款潜力:', result.viralPotential);
    console.log('- 关键洞察:', result.keyInsights);
    return result;
  } catch (error) {
    console.error('❌ 竞品分析失败:', error);
    throw error;
  }
}

async function testContentDiagnosis(competitorData: CompetitorAnalysisResult) {
  console.log('\n=== 测试 2: 内容诊断 ===');
  try {
    const result = await diagnoseContent(mockUserNote, competitorData);
    console.log('✅ 内容诊断成功');
    console.log('- 综合评分:', result.overallScore);
    console.log('- 钩子差距:', result.hookGap);
    console.log('- 内容差距:', result.contentGap);
    console.log('- 视觉差距:', result.visualGap);
    console.log('- 改进建议数量:', result.improvements.length);
    console.log('- 优势:', result.strengths);
    console.log('- 劣势:', result.weaknesses);
    return result;
  } catch (error) {
    console.error('❌ 内容诊断失败:', error);
    throw error;
  }
}

async function testInspirationAnalysis(diagnosisResult: any) {
  console.log('\n=== 测试 3: 灵感解读 ===');
  try {
    const result = await analyzeInspiration(mockVideo, diagnosisResult);
    console.log('✅ 灵感解读成功');
    console.log('- 创意要点:', result.creativeInsight);
    console.log('- 可借鉴元素:', result.keyElements);
    console.log('- 情绪风格:', result.emotionalTone);
    console.log('- 本土化建议:', result.localizationAdvice);
    console.log('- 标题建议:', result.suggestedTitles);
    console.log('- 标签建议:', result.suggestedTags);
    console.log('- 相关度:', result.relevanceScore);
    return result;
  } catch (error) {
    console.error('❌ 灵感解读失败:', error);
    throw error;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试 AI 分析模块...\n');

  try {
    // 测试 1: 竞品分析
    const competitorResult = await testCompetitorAnalysis();

    // 测试 2: 内容诊断（依赖测试1的结果）
    const diagnosisResult = await testContentDiagnosis(competitorResult);

    // 测试 3: 灵感解读（可选依赖测试2的结果）
    await testInspirationAnalysis(diagnosisResult);

    console.log('\n✅ 所有测试通过！');
    console.log('\n📊 测试总结:');
    console.log('- 竞品分析: 使用 Claude Sonnet,深度分析爆款要素');
    console.log('- 内容诊断: 使用 Claude Sonnet,对比分析找出差距');
    console.log('- 灵感解读: 使用 Claude Haiku,低成本生成建议');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
runTests();
