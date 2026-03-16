/**
 * 小红书页面抓取测试
 * 验证 Playwright 能否获取公开数据
 */

const { chromium } = require('playwright');

// 测试链接（小红书爆款笔记示例）
const TEST_URL = 'https://www.xiaohongshu.com/explore/674bc2d4000000001e031b22';

async function testXiaohongshuScrape() {
  console.log('🚀 开始测试小红书页面抓取...\n');
  console.log(`📌 测试链接: ${TEST_URL}\n`);

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    console.log('⏳ 正在访问页面...');
    const response = await page.goto(TEST_URL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`📡 响应状态: ${response.status()}`);

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 尝试获取页面内容
    console.log('\n📊 开始提取数据...\n');

    // 1. 尝试多种选择器获取标题
    const titleSelectors = [
      '#detail-title',
      '.title',
      '[class*="title"]',
      'h1',
      '#detail-desc',
    ];

    let title = null;
    for (const selector of titleSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          title = await element.textContent();
          if (title && title.trim()) {
            console.log(`✅ 标题 (通过 ${selector}): ${title.trim().substring(0, 100)}...`);
            break;
          }
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }

    if (!title) {
      console.log('❌ 无法获取标题');
    }

    // 2. 尝试获取正文内容
    const contentSelectors = [
      '#detail-desc',
      '.content',
      '[class*="content"]',
      '[class*="desc"]',
    ];

    let content = null;
    for (const selector of contentSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          content = await element.textContent();
          if (content && content.trim() && content !== title) {
            console.log(`✅ 正文 (通过 ${selector}): ${content.trim().substring(0, 200)}...`);
            break;
          }
        }
      } catch (e) {
        // 继续
      }
    }

    if (!content) {
      console.log('❌ 无法获取正文');
    }

    // 3. 尝试获取互动数据
    console.log('\n📈 互动数据:');

    // 获取整个页面的文本，搜索数字模式
    const pageText = await page.textContent('body');

    // 查找点赞、收藏、评论数
    const likeMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*赞/);
    const collectMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*收藏/);
    const commentMatch = pageText.match(/(\d+(?:\.\d+)?[万]?)\s*评/);

    if (likeMatch) console.log(`  点赞: ${likeMatch[1]}`);
    else console.log('  ❌ 无法获取点赞数');

    if (collectMatch) console.log(`  收藏: ${collectMatch[1]}`);
    else console.log('  ❌ 无法获取收藏数');

    if (commentMatch) console.log(`  评论: ${commentMatch[1]}`);
    else console.log('  ❌ 无法获取评论数');

    // 4. 获取话题标签
    console.log('\n🏷️ 话题标签:');
    const hashtags = await page.$$eval('a[href*="/search_result"]', links =>
      links.map(link => link.textContent?.trim()).filter(Boolean)
    );

    if (hashtags.length > 0) {
      hashtags.slice(0, 5).forEach(tag => console.log(`  #${tag}`));
    } else {
      console.log('  ❌ 无法获取话题标签');
    }

    // 5. 获取封面图
    console.log('\n🖼️ 封面图:');
    const coverImage = await page.$eval(
      'img[src*="sns-webpic-qc"]',
      img => img.src
    ).catch(() => null);

    if (coverImage) {
      console.log(`  ✅ ${coverImage.substring(0, 80)}...`);
    } else {
      // 尝试其他选择器
      const anyImage = await page.$eval('.swiper-slide img, [class*="image"] img, img', img => img.src).catch(() => null);
      if (anyImage) {
        console.log(`  ⚠️ 找到图片（非封面）: ${anyImage.substring(0, 80)}...`);
      } else {
        console.log('  ❌ 无法获取封面图');
      }
    }

    // 6. 截图保存（用于调试）
    await page.screenshot({ path: 'scripts/xhs_test_screenshot.png', fullPage: false });
    console.log('\n📸 已保存截图: scripts/xhs_test_screenshot.png');

    // 7. 打印页面结构（调试用）
    console.log('\n🔍 页面 URL:', page.url());

    // 检查是否有登录弹窗
    const hasLoginModal = await page.$('[class*="login"], [class*="auth"]').then(el => !!el);
    console.log(`🔐 是否有登录弹窗: ${hasLoginModal ? '是' : '否'}`);

    console.log('\n✅ 测试完成！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);

    // 失败时也截图
    try {
      await page.screenshot({ path: 'scripts/xhs_test_error.png' });
      console.log('📸 已保存错误截图: scripts/xhs_test_error.png');
    } catch (e) {
      // 忽略截图错误
    }
  } finally {
    await browser.close();
  }
}

testXiaohongshuScrape();
