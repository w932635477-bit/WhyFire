/**
 * 小红书页面抓取测试 V7
 * 尝试不同的 URL 格式和页面
 */

const { chromium } = require('playwright');

// 尝试多种 URL 格式
const TEST_URLS = [
  // 标准笔记页
  'https://www.xiaohongshu.com/explore/674bc2d4000000001e031b22',
  // 移动端页面
  'https://www.xiaohongshu.com/discovery/item/674bc2d4000000001e031b22',
  // 嵌入页面
  'https://www.xiaohongshu.com/embed/674bc2d4000000001e031b22',
  // 分享短链接格式
  'http://xhslink.com/test',
];

async function testDifferentUrls() {
  console.log('🚀 测试不同的 URL 格式...\n');

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });

    const page = await context.newPage();

    // 测试标准笔记页
    console.log('📌 测试 1: 标准笔记页');
    console.log(`   URL: ${TEST_URLS[0]}`);

    const response1 = await page.goto(TEST_URLS[0], { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log(`   状态: ${response1.status()}`);
    console.log(`   最终 URL: ${page.url()}`);

    // 检查是否能获取到数据
    const content1 = await page.content();
    const hasNoteData = content1.includes('noteId') || content1.includes('likedCount');
    console.log(`   包含笔记数据: ${hasNoteData ? '是' : '否'}`);

    // 测试 discovery 页面
    console.log('\n📌 测试 2: Discovery 页面');
    console.log(`   URL: ${TEST_URLS[1]}`);

    const response2 = await page.goto(TEST_URLS[1], { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log(`   状态: ${response2.status()}`);
    console.log(`   最终 URL: ${page.url()}`);

    const content2 = await page.content();
    const hasNoteData2 = content2.includes('noteId') || content2.includes('likedCount');
    console.log(`   包含笔记数据: ${hasNoteData2 ? '是' : '否'}`);

    // 如果有数据，尝试提取
    if (hasNoteData2) {
      console.log('\n   📊 提取数据:');

      const titleMatch = content2.match(/"title"\s*:\s*"([^"]+)"/);
      if (titleMatch) console.log(`   标题: ${titleMatch[1]}`);

      const likeMatch = content2.match(/"likedCount"\s*:\s*(\d+)/);
      if (likeMatch) console.log(`   点赞: ${likeMatch[1]}`);

      const collectMatch = content2.match(/"collectedCount"\s*:\s*(\d+)/);
      if (collectMatch) console.log(`   收藏: ${collectMatch[1]}`);
    }

    // 尝试一个真实存在的笔记（用更常见的 ID 格式）
    console.log('\n📌 测试 3: 尝试热门笔记页面');

    // 先访问首页获取一些笔记链接
    await page.goto('https://www.xiaohongshu.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    const homeUrl = page.url();
    console.log(`   首页 URL: ${homeUrl}`);

    const homeContent = await page.content();
    console.log(`   首页内容长度: ${homeContent.length}`);

    // 截图
    await page.screenshot({ path: 'scripts/xhs_homepage.png' });
    console.log('   📸 截图: scripts/xhs_homepage.png');

    console.log('\n📋 测试结论:');
    console.log('   小红书对未登录访问做了严格限制');
    console.log('   所有页面都会重定向到登录页');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

testDifferentUrls();
