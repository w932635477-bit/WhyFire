/**
 * 小红书页面抓取测试 V5
 * 使用有头浏览器（非 headless）
 */

const { chromium } = require('playwright');

const TEST_URL = 'https://www.xiaohongshu.com/explore/674bc2d4000000001e031b22';

async function testHeadful() {
  console.log('🚀 测试有头浏览器（非 headless）...\n');
  console.log('⚠️  这将打开一个浏览器窗口\n');

  const browser = await chromium.launch({
    headless: false,  // 使用有头模式
    slowMo: 500,      // 减慢操作速度
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'zh-CN',
    });

    const page = await context.newPage();

    console.log('⏳ 访问页面...');
    const response = await page.goto(TEST_URL, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    console.log(`📡 响应状态: ${response.status()}`);
    console.log(`🔗 最终 URL: ${page.url()}`);

    // 等待页面完全加载
    await page.waitForTimeout(5000);

    const finalUrl = page.url();

    if (finalUrl.includes('/explore/') && finalUrl.length > 40) {
      console.log('✅ 成功访问笔记页面！\n');

      // 获取页面文本
      const pageText = await page.textContent('body');

      // 提取互动数据
      console.log('📊 提取数据:');

      const likeMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*赞/);
      const collectMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*收藏/);
      const commentMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*评/);

      if (likeMatch) console.log(`  点赞: ${likeMatch[1]}`);
      if (collectMatch) console.log(`  收藏: ${collectMatch[1]}`);
      if (commentMatch) console.log(`  评论: ${commentMatch[1]}`);

      // 截图保存
      await page.screenshot({ path: 'scripts/xhs_headful_success.png', fullPage: true });
      console.log('\n📸 已保存截图: scripts/xhs_headful_success.png');

      // 尝试获取标题
      const title = await page.$eval('#detail-title, .note-content .title, [class*="title"]', el => el.textContent?.trim()).catch(() => null);
      if (title) {
        console.log(`\n📝 标题: ${title}`);
      }

    } else {
      console.log('❌ 被重定向到其他页面');
      await page.screenshot({ path: 'scripts/xhs_headful_fail.png' });
    }

    // 保持浏览器打开 5 秒让用户看到
    console.log('\n⏳ 5 秒后关闭浏览器...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

testHeadful();
