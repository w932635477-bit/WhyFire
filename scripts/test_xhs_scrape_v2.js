/**
 * 小红书页面抓取测试 V2
 * 使用移动端 UA 绕过登录限制
 */

const { chromium } = require('playwright');

// 测试链接
const TEST_URL = 'https://www.xiaohongshu.com/explore/674bc2d4000000001e031b22';

async function testXiaohongshuMobile() {
  console.log('🚀 测试小红书页面抓取（移动端 UA）...\n');

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    // 使用移动端 UA
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });

    const page = await context.newPage();

    console.log('⏳ 访问页面...');
    const response = await page.goto(TEST_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    console.log(`📡 响应状态: ${response.status()}`);
    console.log(`🔗 最终 URL: ${page.url()}`);

    // 等待内容加载
    await page.waitForTimeout(5000);

    // 检查是否在笔记页面
    const currentUrl = page.url();
    if (currentUrl.includes('/explore/') && currentUrl.length > 30) {
      console.log('✅ 成功访问笔记页面！\n');
    } else {
      console.log('⚠️ 被重定向，尝试其他方案...\n');
    }

    // 截图
    await page.screenshot({ path: 'scripts/xhs_mobile_test.png', fullPage: true });
    console.log('📸 已保存截图: scripts/xhs_mobile_test.png');

    // 尝试获取页面 HTML 分析
    const html = await page.content();

    // 查找 __INITIAL_STATE__ 数据（小红书可能在页面中嵌入 JSON 数据）
    const stateMatch = html.match(/__INITIAL_STATE__\s*=\s*({.+?})\s*<\/script>/);
    if (stateMatch) {
      console.log('\n✅ 发现 __INITIAL_STATE__ 数据！');
      try {
        const stateData = JSON.parse(stateMatch[1]);
        console.log('数据结构:', Object.keys(stateData));
      } catch (e) {
        console.log('解析失败，数据可能被截断');
      }
    }

    // 查找笔记数据
    const noteDataMatch = html.match(/"noteId"\s*:\s*"([^"]+)"/);
    if (noteDataMatch) {
      console.log(`\n✅ 找到笔记 ID: ${noteDataMatch[1]}`);
    }

    // 尝试获取标题
    const titleSelectors = [
      '#detail-title',
      '.note-content .title',
      '[class*="title"]',
      'h1',
    ];

    for (const selector of titleSelectors) {
      const text = await page.$eval(selector, el => el.textContent?.trim()).catch(() => null);
      if (text && text.length > 5 && !text.includes('登录')) {
        console.log(`\n📝 标题: ${text.substring(0, 100)}`);
        break;
      }
    }

    // 尝试获取互动数据
    const pageText = await page.textContent('body').catch(() => '');

    if (pageText.length > 100) {
      console.log(`\n📄 页面文本长度: ${pageText.length} 字符`);

      // 搜索关键数据
      const patterns = [
        { name: '点赞', regex: /(\d+(?:\.\d+)?[万]?)\s*赞/ },
        { name: '收藏', regex: /(\d+(?:\.\d+)?[万]?)\s*收藏/ },
        { name: '评论', regex: /(\d+(?:\.\d+)?[万]?)\s*评/ },
      ];

      console.log('\n📊 互动数据:');
      for (const p of patterns) {
        const match = pageText.match(p.regex);
        if (match) {
          console.log(`  ${p.name}: ${match[1]}`);
        }
      }
    }

    // 检查是否需要登录
    const hasLoginRequired = pageText.includes('登录') && pageText.includes('查看更多');
    console.log(`\n🔐 需要登录: ${hasLoginRequired ? '是' : '否'}`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

testXiaohongshuMobile();
