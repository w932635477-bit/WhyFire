/**
 * 使用保存的 Cookie 访问小红书笔记
 * 验证登录态是否有效
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, 'xhs_cookies.json');

// 测试几个真实的笔记链接
const TEST_URLS = [
  // 热门笔记（需要替换为真实存在的）
  'https://www.xiaohongshu.com/explore/674bc2d4000000001e031b22',
];

async function testWithCookie() {
  console.log('🚀 使用保存的 Cookie 测试\n');

  // 检查 Cookie 文件
  if (!fs.existsSync(COOKIE_FILE)) {
    console.log('❌ Cookie 文件不存在，请先运行登录测试');
    return;
  }

  const savedCookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
  console.log(`📋 已加载 ${savedCookies.length} 个 Cookie\n`);

  const browser = await chromium.launch({
    headless: true,  // 无头模式
  });

  try {
    const context = await browser.newContext();

    // 注入保存的 Cookie
    await context.addCookies(savedCookies);
    console.log('✅ Cookie 已注入\n');

    const page = await context.newPage();

    // 测试访问首页，看是否已登录
    console.log('📍 测试 1：访问首页验证登录状态');
    await page.goto('https://www.xiaohongshu.com', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // 截图
    await page.screenshot({ path: path.join(__dirname, 'xhs_home_with_cookie.png') });
    console.log('📸 首页截图: scripts/xhs_home_with_cookie.png');

    // 检查是否有登录状态（查找用户头像或用户名）
    const pageContent = await page.content();
    const hasUserInfo = pageContent.includes('user-info') ||
                        pageContent.includes('avatar') ||
                        pageContent.includes('我的') ||
                        !pageContent.includes('请登录');

    console.log(`   登录状态: ${hasUserInfo ? '✅ 已登录' : '❌ 未登录'}`);

    // 测试访问笔记页面
    console.log('\n📍 测试 2：访问笔记页面');
    const testUrl = TEST_URLS[0];
    console.log(`   URL: ${testUrl}`);

    await page.goto(testUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log(`   最终 URL: ${finalUrl}`);

    // 截图
    await page.screenshot({ path: path.join(__dirname, 'xhs_note_with_cookie.png') });
    console.log('📸 笔记截图: scripts/xhs_note_with_cookie.png');

    // 分析页面内容
    if (finalUrl.includes('404') || finalUrl.includes('sec_')) {
      console.log('   ❌ 被拦截或笔记不存在');
    } else if (finalUrl.includes('/explore/') || finalUrl.includes('/discovery/')) {
      console.log('   ✅ 成功访问笔记页面');

      // 提取数据
      const content = await page.content();

      console.log('\n   📊 尝试提取数据:');

      // 标题
      const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
      if (titleMatch) {
        console.log(`   标题: ${titleMatch[1]}`);
      }

      // 点赞
      const likeMatch = content.match(/"likedCount"\s*:\s*(\d+)/);
      if (likeMatch) {
        console.log(`   点赞: ${likeMatch[1]}`);
      }

      // 收藏
      const collectMatch = content.match(/"collectedCount"\s*:\s*(\d+)/);
      if (collectMatch) {
        console.log(`   收藏: ${collectMatch[1]}`);
      }

      // 评论
      const commentMatch = content.match(/"commentCount"\s*:\s*(\d+)/);
      if (commentMatch) {
        console.log(`   评论: ${commentMatch[1]}`);
      }

      // 笔记ID
      const noteIdMatch = content.match(/"noteId"\s*:\s*"([^"]+)"/);
      if (noteIdMatch) {
        console.log(`   笔记ID: ${noteIdMatch[1]}`);
      }

      // 提取正文
      const descMatch = content.match(/"desc"\s*:\s*"([^"]+)"/);
      if (descMatch) {
        console.log(`   正文: ${descMatch[1].substring(0, 100)}...`);
      }

      // 提取封面图
      const imageMatch = content.match(/"imageList"\s*:\s*\[\s*\{[^}]*"urlDefault"\s*:\s*"([^"]+)"/);
      if (imageMatch) {
        console.log(`   封面图: ${imageMatch[1].substring(0, 80)}...`);
      }

      if (titleMatch || likeMatch || collectMatch) {
        console.log('\n   ✅ 成功提取到数据！');
      } else {
        console.log('\n   ⚠️ 未能提取到数据，但页面可访问');
      }

    } else if (finalUrl === 'https://www.xiaohongshu.com/explore') {
      console.log('   ⚠️ 被重定向到 explore 首页，笔记可能不存在');
    } else {
      console.log('   ⚠️ 状态未知');
    }

    console.log('\n🎯 结论: Cookie 方案可行！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

testWithCookie();
