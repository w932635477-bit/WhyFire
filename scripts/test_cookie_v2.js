/**
 * 使用保存的 Cookie 测试 - 改进版
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, 'xhs_cookies.json');

async function testWithCookie() {
  console.log('🚀 Cookie 方案验证测试\n');

  if (!fs.existsSync(COOKIE_FILE)) {
    console.log('❌ Cookie 文件不存在，请先运行扫码登录');
    return;
  }

  const savedCookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
  console.log(`📋 已加载 ${savedCookies.length} 个 Cookie`);

  // 显示关键 Cookie
  const keyCookies = ['web_session', 'a1', 'webId'];
  for (const name of keyCookies) {
    const c = savedCookies.find(c => c.name === name);
    if (c) {
      console.log(`   ${name}: ${c.value.substring(0, 20)}...`);
    }
  }
  console.log('');

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    await context.addCookies(savedCookies);
    console.log('✅ Cookie 已注入\n');

    const page = await context.newPage();

    // 测试 1：访问首页确认登录状态
    console.log('📍 测试 1：访问首页');
    await page.goto('https://www.xiaohongshu.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(__dirname, 'xhs_home_v2.png'), fullPage: false });
    console.log('   📸 首页截图: scripts/xhs_home_v2.png');

    const homeContent = await page.content();
    console.log(`   页面内容长度: ${homeContent.length}`);

    // 检查登录状态
    const hasLoginBtn = homeContent.includes('登录') && homeContent.includes('注册');
    const hasUserInfo = homeContent.includes('avatar') || homeContent.includes('用户');
    console.log(`   有登录按钮: ${hasLoginBtn}`);
    console.log(`   有用户信息: ${hasUserInfo}`);

    // 测试 2：直接构造一个真实的笔记 URL 访问
    // 使用一个热门笔记的 ID（可以从搜索结果或其他地方获取）
    console.log('\n📍 测试 2：直接访问热门笔记');

    // 先访问发现页获取一些笔记
    await page.goto('https://www.xiaohongshu.com/explore', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    const exploreUrl = page.url();
    console.log(`   discover 页 URL: ${exploreUrl}`);

    await page.screenshot({ path: path.join(__dirname, 'xhs_explore_v2.png'), fullPage: false });

    // 从页面内容中提取笔记 ID
    const exploreContent = await page.content();
    const noteIdPattern = /"noteId"\s*:\s*"([a-f0-9]{24})"/g;
    const noteIds = [];
    let match;
    while ((match = noteIdPattern.exec(exploreContent)) !== null) {
      if (!noteIds.includes(match[1])) {
        noteIds.push(match[1]);
      }
    }

    console.log(`   找到 ${noteIds.length} 个笔记 ID`);

    if (noteIds.length > 0) {
      // 访问第一个笔记
      const testNoteId = noteIds[0];
      const testUrl = `https://www.xiaohongshu.com/explore/${testNoteId}`;

      console.log(`\n📍 测试 3：访问笔记`);
      console.log(`   ID: ${testNoteId}`);
      console.log(`   URL: ${testUrl}\n`);

      await page.goto(testUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(5000);

      const noteUrl = page.url();
      console.log(`   最终 URL: ${noteUrl}`);

      await page.screenshot({ path: path.join(__dirname, 'xhs_note_v2.png'), fullPage: false });

      if (noteUrl.includes('/explore/') && noteUrl.length > 45) {
        console.log('\n✅ 成功访问笔记页面！\n');

        const content = await page.content();

        // 提取数据
        const extract = (pattern) => {
          const m = content.match(pattern);
          return m ? m[1] : null;
        };

        const title = extract(/"title"\s*:\s*"([^"]+)"/);
        const noteId = extract(/"noteId"\s*:\s*"([^"]+)"/);
        const likes = extract(/"likedCount"\s*:\s*(\d+)/);
        const collects = extract(/"collectedCount"\s*:\s*(\d+)/);
        const comments = extract(/"commentCount"\s*:\s*(\d+)/);
        const desc = extract(/"desc"\s*:\s*"([^"]+)"/);

        console.log('📊 提取到的数据:');
        console.log('─'.repeat(50));
        if (noteId) console.log(`笔记ID: ${noteId}`);
        if (title) console.log(`标题: ${title}`);
        if (likes) console.log(`点赞: ${likes}`);
        if (collects) console.log(`收藏: ${collects}`);
        if (comments) console.log(`评论: ${comments}`);
        if (desc) console.log(`正文: ${desc.substring(0, 100)}...`);
        console.log('─'.repeat(50));

        // 计算收藏/点赞比
        if (likes && collects && parseInt(likes) > 0) {
          const ratio = (parseInt(collects) / parseInt(likes)).toFixed(2);
          console.log(`\n📈 收藏/点赞比: ${ratio} ${ratio > 0.5 ? '(干货型)' : '(情绪型)'}`);
        }

        console.log('\n🎉 Cookie 方案验证成功！');
        console.log('✅ 可以正常访问小红书笔记页面');
        console.log('✅ 可以正常提取笔记数据');

      } else {
        console.log('\n❌ 访问笔记失败');
        console.log(`   可能被重定向到: ${noteUrl}`);
      }

    } else {
      console.log('\n⚠️ 未能从发现页提取到笔记 ID');

      // 尝试直接访问一个已知存在的笔记
      console.log('\n📍 尝试访问一个测试笔记...');
      await page.goto('https://www.xiaohongshu.com/explore/65d8e6d4000000002701907d', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(5000);

      const testUrl = page.url();
      console.log(`   最终 URL: ${testUrl}`);
      await page.screenshot({ path: path.join(__dirname, 'xhs_test_note.png') });
    }

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
}

testWithCookie();
