/**
 * 小红书页面抓取测试 V6
 * 尝试从 SEO 元数据获取信息
 */

const { chromium } = require('playwright');

const TEST_URL = 'https://www.xiaohongshu.com/explore/674bc2d4000000001e031b22';

async function testMetadata() {
  console.log('🚀 测试从 SEO 元数据获取信息...\n');

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    });

    const page = await context.newPage();

    console.log('⏳ 访问页面（模拟 Google Bot）...');
    const response = await page.goto(TEST_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    console.log(`📡 响应状态: ${response.status()}`);
    console.log(`🔗 最终 URL: ${page.url()}\n`);

    // 获取 meta 标签
    console.log('📋 Meta 标签信息:');

    const metaTags = await page.evaluate(() => {
      const metas = document.querySelectorAll('meta');
      const result = {};
      metas.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          result[name] = content;
        }
      });
      return result;
    });

    // 打印关键 meta 标签
    const importantMetas = [
      'og:title',
      'og:description',
      'og:image',
      'description',
      'title',
      'keywords',
    ];

    for (const key of importantMetas) {
      if (metaTags[key]) {
        console.log(`  ${key}: ${metaTags[key].substring(0, 100)}...`);
      }
    }

    // 获取 title 标签
    const title = await page.title();
    console.log(`\n📄 页面标题: ${title}`);

    // 尝试获取 JSON-LD 结构化数据
    const jsonLd = await page.$eval('script[type="application/ld+json"]', el => el.textContent).catch(() => null);
    if (jsonLd) {
      console.log('\n📊 JSON-LD 数据:');
      try {
        const data = JSON.parse(jsonLd);
        console.log(JSON.stringify(data, null, 2).substring(0, 500));
      } catch (e) {
        console.log('  解析失败');
      }
    }

    // 获取页面上所有脚本中的数据
    console.log('\n🔍 搜索页面脚本中的笔记数据...');
    const pageContent = await page.content();

    // 查找可能的笔记 ID
    const noteIdMatch = pageContent.match(/"noteId"\s*:\s*"([^"]+)"/);
    if (noteIdMatch) {
      console.log(`  笔记 ID: ${noteIdMatch[1]}`);
    }

    // 查找可能的标题
    const titleMatch = pageContent.match(/"title"\s*:\s*"([^"]+)"/);
    if (titleMatch) {
      console.log(`  标题: ${titleMatch[1]}`);
    }

    // 查找可能的描述
    const descMatch = pageContent.match(/"desc"\s*:\s*"([^"]+)"/);
    if (descMatch) {
      console.log(`  描述: ${descMatch[1].substring(0, 100)}...`);
    }

    // 查找互动数据
    const likeMatch = pageContent.match(/"likedCount"\s*:\s*(\d+)/);
    const collectMatch = pageContent.match(/"collectedCount"\s*:\s*(\d+)/);
    const commentMatch = pageContent.match(/"commentCount"\s*:\s*(\d+)/);

    console.log('\n📈 互动数据:');
    if (likeMatch) console.log(`  点赞: ${likeMatch[1]}`);
    if (collectMatch) console.log(`  收藏: ${collectMatch[1]}`);
    if (commentMatch) console.log(`  评论: ${commentMatch[1]}`);

    // 截图
    await page.screenshot({ path: 'scripts/xhs_metadata_test.png' });
    console.log('\n📸 截图: scripts/xhs_metadata_test.png');

    // 返回成功标志
    const hasData = titleMatch || likeMatch || collectMatch;
    console.log(`\n🎯 结果: ${hasData ? '✅ 成功获取到数据' : '❌ 无法获取数据'}`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

testMetadata();
