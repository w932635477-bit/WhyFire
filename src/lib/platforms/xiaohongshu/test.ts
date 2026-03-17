/**
 * 小红书抓取模块测试脚本
 *
 * 使用方法：
 * 1. 安装依赖：npm install playwright
 * 2. 安装浏览器：npx playwright install chromium
 * 3. 运行测试：npx ts-node src/lib/platforms/xiaohongshu/test.ts
 */

import { XiaohongshuScraper } from './scraper';

async function testScraper() {
  console.log('🧪 开始测试小红书抓取模块...\n');

  const scraper = new XiaohongshuScraper({
    headless: true, // 设置为 false 可以看到浏览器操作
    timeout: 30000,
    maxRetries: 2,
  });

  try {
    // 测试 URL（示例链接，实际使用时替换为真实链接）
    const testUrls = [
      'https://www.xiaohongshu.com/explore/xxxxx', // 替换为真实笔记 ID
      // 可以添加更多测试 URL
    ];

    for (const url of testUrls) {
      console.log(`\n📍 测试 URL: ${url}`);
      console.log('⏳ 正在抓取...');

      const result = await scraper.scrapeNote(url);

      if (result.success && result.data) {
        const note = result.data;
        console.log('\n✅ 抓取成功！');
        console.log('─'.repeat(50));
        console.log(`📝 标题: ${note.title}`);
        console.log(`👤 作者: ${note.author.authorName}`);
        console.log(`❤️  点赞: ${note.interactions.likeCount}`);
        console.log(`⭐ 收藏: ${note.interactions.collectCount}`);
        console.log(`💬 评论: ${note.interactions.commentCount}`);
        console.log(`🏷️  话题: ${note.hashtags.join(', ')}`);
        console.log(`📊 收藏/点赞比: ${(note.interactions.collectToLikeRatio * 100).toFixed(1)}%`);
        console.log(`📅 抓取时间: ${result.scrapedAt.toISOString()}`);
        console.log('─'.repeat(50));

        // 打印部分正文
        if (note.description) {
          const preview = note.description.substring(0, 100);
          console.log(`📄 正文预览: ${preview}${note.description.length > 100 ? '...' : ''}`);
        }
      } else {
        console.log('❌ 抓取失败');
        console.log(`错误信息: ${result.error}`);
      }
    }

    // 测试 URL 验证
    console.log('\n\n🧪 测试 URL 验证...');
    const validationTests = [
      { url: 'https://www.xiaohongshu.com/explore/abc123', expected: true },
      { url: 'https://www.xiaohongshu.com/discovery/item/abc123', expected: true },
      { url: 'https://xhslink.com/abc123', expected: true },
      { url: 'https://www.google.com', expected: false },
      { url: 'invalid-url', expected: false },
    ];

    for (const test of validationTests) {
      const isValid = scraper.isValidUrl(test.url);
      const status = isValid === test.expected ? '✅' : '❌';
      console.log(`${status} ${test.url} - 预期: ${test.expected}, 实际: ${isValid}`);
    }

    // 测试 ID 提取
    console.log('\n\n🧪 测试 ID 提取...');
    const extractionTests = [
      'https://www.xiaohongshu.com/explore/abc123xyz',
      'https://www.xiaohongshu.com/discovery/item/xyz789',
    ];

    for (const url of extractionTests) {
      const noteId = scraper.extractNoteId(url);
      console.log(`📍 ${url}`);
      console.log(`   提取的 ID: ${noteId}`);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 关闭浏览器
    await scraper.close();
    console.log('\n\n✅ 测试完成，浏览器已关闭');
  }
}

// 运行测试
testScraper().catch(console.error);

/**
 * 示例：如何在 API 路由中使用
 *
 * // app/api/scrape/route.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { XiaohongshuScraper } from '@/lib/platforms/xiaohongshu';
 *
 * export async function POST(request: NextRequest) {
 *   try {
 *     const { url } = await request.json();
 *
 *     if (!url) {
 *       return NextResponse.json(
 *         { error: 'URL is required' },
 *         { status: 400 }
 *       );
 *     }
 *
 *     const scraper = new XiaohongshuScraper();
 *     const result = await scraper.scrapeNote(url);
 *     await scraper.close();
 *
 *     if (!result.success) {
 *       return NextResponse.json(
 *         { error: result.error },
 *         { status: 400 }
 *       );
 *     }
 *
 *     return NextResponse.json(result.data);
 *   } catch (error) {
 *     return NextResponse.json(
 *       { error: 'Internal server error' },
 *       { status: 500 }
 *     );
 *   }
 * }
 */
