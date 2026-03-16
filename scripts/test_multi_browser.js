/**
 * 小红书页面抓取测试 V4
 * 尝试多种浏览器引擎
 */

const { chromium, firefox, webkit } = require('playwright');

const TEST_URL = 'https://www.xiaohongshu.com/explore/674bc2d4000000001e031b22';

async function testBrowser(browserType, name) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🧪 测试 ${name} 引擎`);
  console.log('='.repeat(50));

  let browser;
  try {
    browser = await browserType.launch({
      headless: true,
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      viewport: { width: 1280, height: 800 },
      locale: 'zh-CN',
    });

    const page = await context.newPage();

    const response = await page.goto(TEST_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log(`📡 状态: ${response.status()}`);
    console.log(`🔗 URL: ${finalUrl}`);

    // 截图
    await page.screenshot({ path: `scripts/xhs_${name.toLowerCase()}.png` });

    // 判断结果
    if (finalUrl.includes('/explore/') && finalUrl.length > 40) {
      console.log('✅ 成功访问笔记页面！');

      const pageText = await page.textContent('body');

      // 提取数据
      const likeMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*赞/);
      const collectMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*收藏/);
      const commentMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*评/);

      console.log('\n📊 提取到的数据:');
      if (likeMatch) console.log(`  点赞: ${likeMatch[1]}`);
      if (collectMatch) console.log(`  收藏: ${collectMatch[1]}`);
      if (commentMatch) console.log(`  评论: ${commentMatch[1]}`);

      return true;
    } else if (finalUrl.includes('404') || finalUrl.includes('sec_')) {
      console.log('🛡️ 触发安全验证');
      return false;
    } else if (finalUrl.includes('/explore') && finalUrl.length < 35) {
      console.log('🔐 被重定向到登录页');
      return false;
    } else {
      console.log('⚠️ 未知状态');
      return false;
    }

  } catch (error) {
    console.log(`❌ 错误: ${error.message}`);
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

async function main() {
  console.log('🚀 小红书页面抓取 - 多浏览器测试');
  console.log(`📌 测试链接: ${TEST_URL}`);

  const results = {};

  // 测试 Chromium
  results.chromium = await testBrowser(chromium, 'Chromium');

  // 测试 Firefox
  results.firefox = await testBrowser(firefox, 'Firefox');

  // 测试 WebKit
  results.webkit = await testBrowser(webkit, 'WebKit');

  // 汇总结果
  console.log('\n' + '='.repeat(50));
  console.log('📋 测试结果汇总');
  console.log('='.repeat(50));

  for (const [browser, success] of Object.entries(results)) {
    console.log(`  ${browser}: ${success ? '✅ 成功' : '❌ 失败'}`);
  }

  const anySuccess = Object.values(results).some(v => v);
  console.log(`\n🎯 结论: ${anySuccess ? '至少一个引擎可用' : '所有引擎均被拦截'}`);
}

main();
