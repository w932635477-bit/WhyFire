/**
 * 使用保存的 Cookie 测试小红书访问
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, 'xhs_cookies.json');

async function testWithCookie() {
  console.log('🚀 使用保存的 Cookie 测试\n');

  if (!fs.existsSync(COOKIE_FILE)) {
    console.log('❌ Cookie 文件不存在');
    return;
  }

  const savedCookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
  console.log(`📋 已加载 ${savedCookies.length} 个 Cookie\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    await context.addCookies(savedCookies);
    console.log('✅ Cookie 已注入\n');

    const page = await context.newPage();

    // 访问搜索页获取真实笔记链接
    console.log('📍 访问搜索页面...');
    await page.goto('https://www.xiaohongshu.com/search_result?keyword=美食', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // 提取笔记链接
    const noteLinks = await page.$$eval('a[href*="/explore/"]', links =>
      [...new Set(links.map(a => a.href).filter(href => href.includes('/explore/')))]
    );

    console.log(`   找到 ${noteLinks.length} 个笔记链接\n`);

    if (noteLinks.length > 0) {
      const testUrl = noteLinks[0];
      console.log(`📍 访问第一个笔记...`);
      console.log(`   ${testUrl}\n`);

      await page.goto(testUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await page.waitForTimeout(3000);

      const finalUrl = page.url();
      console.log(`   最终 URL: ${finalUrl}\n`);

      if (finalUrl.includes('/explore/') && finalUrl.length > 40) {
        console.log('✅ 成功访问笔记页面！\n');

        const content = await page.content();

        // 提取数据
        const extractData = (html, pattern) => {
          const match = html.match(pattern);
          return match ? match[1] : null;
        };

        const title = extractData(content, /"title"\s*:\s*"([^"]+)"/);
        const noteId = extractData(content, /"noteId"\s*:\s*"([^"]+)"/);
        const likes = extractData(content, /"likedCount"\s*:\s*(\d+)/);
        const collects = extractData(content, /"collectedCount"\s*:\s*(\d+)/);
        const comments = extractData(content, /"commentCount"\s*:\s*(\d+)/);
        const desc = extractData(content, /"desc"\s*:\s*"([^"]+)"/);

        console.log('📊 提取到的数据:');
        console.log('─'.repeat(50));
        if (noteId) console.log(`笔记ID: ${noteId}`);
        if (title) console.log(`标题: ${title}`);
        if (likes) console.log(`点赞: ${likes}`);
        if (collects) console.log(`收藏: ${collects}`);
        if (comments) console.log(`评论: ${comments}`);
        if (desc) console.log(`正文: ${desc.substring(0, 100)}...`);
        console.log('─'.repeat(50));

        // 保存截图
        await page.screenshot({ path: path.join(__dirname, 'xhs_success.png') });
        console.log('\n📸 截图: scripts/xhs_success.png');

        console.log('\n🎉 验证成功！Cookie 方案可行！');
      } else {
        console.log('❌ 被重定向，访问失败');
      }
    } else {
      console.log('❌ 未找到笔记链接');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
}

testWithCookie();
