/**
 * 小红书页面抓取测试 V3
 * 使用 Stealth 模式绑过检测
 */

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 使用 stealth 插件
chromium.use(StealthPlugin());

// 测试链接
const TEST_URL = 'https://www.xiaohongshu.com/explore/674bc2d4000000001e031b22';

async function testWithStealth() {
  console.log('🚀 测试小红书页面抓取（Stealth 模式）...\n');

  const browser = await chromium.launch({
    headless: true,
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
      timeout: 30000,
    });

    console.log(`📡 响应状态: ${response.status()}`);
    console.log(`🔗 最终 URL: ${page.url()}`);

    await page.waitForTimeout(3000);

    // 检查是否成功
    const currentUrl = page.url();
    if (currentUrl.includes('/explore/') && !currentUrl.includes('404') && !currentUrl.includes('sec_')) {
      console.log('✅ 成功访问笔记页面！\n');
    } else {
      console.log('⚠️ 仍被拦截或重定向\n');
    }

    // 截图
    await page.screenshot({ path: 'scripts/xhs_stealth_test.png', fullPage: false });

    // 获取页面文本
    const pageText = await page.textContent('body').catch(() => '');

    console.log(`📄 页面文本长度: ${pageText.length} 字符`);

    // 检查页面内容
    if (pageText.includes('登录') && pageText.includes('手机号')) {
      console.log('🔐 状态: 显示登录页面');
    } else if (currentUrl.includes('404') || currentUrl.includes('sec_')) {
      console.log('🛡️ 状态: 触发安全验证');
    } else if (pageText.length > 1000) {
      console.log('📝 状态: 可能获取到内容');

      // 尝试提取数据
      console.log('\n📊 提取数据:');

      // 点赞
      const likeMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*赞/);
      if (likeMatch) console.log(`  点赞: ${likeMatch[1]}`);

      // 收藏
      const collectMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*收藏/);
      if (collectMatch) console.log(`  收藏: ${collectMatch[1]}`);

      // 评论
      const commentMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*评/);
      if (commentMatch) console.log(`  评论: ${commentMatch[1]}`);
    }

    // 尝试获取标题
    const title = await page.$eval('#detail-title, .title, h1', el => el.textContent?.trim()).catch(() => null);
    if (title) {
      console.log(`\n📝 标题: ${title.substring(0, 100)}`);
    }

    console.log('\n📸 已保存截图: scripts/xhs_stealth_test.png');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

testWithStealth();
