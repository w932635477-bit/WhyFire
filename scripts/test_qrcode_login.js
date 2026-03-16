/**
 * 小红书扫码登录测试
 * 参考 MediaCrawler 的登录态保存方案
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, 'xhs_cookies.json');

async function testQRCodeLogin() {
  console.log('🚀 小红书扫码登录测试\n');
  console.log('📋 参考 MediaCrawler 方案：');
  console.log('   1. 打开登录页面');
  console.log('   2. 显示二维码');
  console.log('   3. 等待用户扫码');
  console.log('   4. 保存登录态（Cookie）');
  console.log('   5. 验证 Cookie 有效性\n');

  const browser = await chromium.launch({
    headless: false,  // 需要显示二维码
    slowMo: 100,
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'zh-CN',
    });

    const page = await context.newPage();

    // 步骤 1：访问小红书首页
    console.log('📍 步骤 1：访问小红书首页...');
    await page.goto('https://www.xiaohongshu.com', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`   当前 URL: ${page.url()}`);

    // 步骤 2：点击登录按钮
    console.log('\n📍 步骤 2：查找并点击登录按钮...');

    // 尝试多种登录按钮选择器
    const loginSelectors = [
      'button:has-text("登录")',
      '[class*="login"]',
      '.login-btn',
      'a:has-text("登录")',
    ];

    let loginClicked = false;
    for (const selector of loginSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          loginClicked = true;
          console.log(`   ✅ 点击登录按钮: ${selector}`);
          break;
        }
      } catch (e) {
        // 继续尝试
      }
    }

    if (!loginClicked) {
      // 直接访问登录页
      console.log('   直接访问登录页...');
      await page.goto('https://www.xiaohongshu.com/login', {
        waitUntil: 'networkidle',
      });
    }

    await page.waitForTimeout(2000);

    // 步骤 3：等待二维码出现
    console.log('\n📍 步骤 3：等待二维码出现...');

    // 截图保存当前页面
    await page.screenshot({ path: path.join(__dirname, 'xhs_login_page.png') });
    console.log('   📸 已保存登录页面截图: scripts/xhs_login_page.png');

    // 查找二维码
    const qrSelectors = [
      'img[src*="qr"]',
      'canvas',
      '[class*="qr"]',
      '[class*="qrcode"]',
    ];

    let qrFound = false;
    for (const selector of qrSelectors) {
      const qr = await page.$(selector);
      if (qr) {
        qrFound = true;
        console.log(`   ✅ 找到二维码元素: ${selector}`);
        break;
      }
    }

    if (!qrFound) {
      console.log('   ⚠️ 未找到二维码，可能需要切换登录方式');

      // 尝试切换到扫码登录
      const qrTab = await page.$('text=扫码登录, [class*="scan"], button:has-text("扫码")');
      if (qrTab) {
        await qrTab.click();
        console.log('   ✅ 切换到扫码登录');
        await page.waitForTimeout(1000);
      }
    }

    // 步骤 4：等待用户扫码
    console.log('\n📍 步骤 4：等待用户扫码...');
    console.log('   ⏳ 请用小红书 APP 扫描二维码登录');
    console.log('   ⏳ 等待登录成功（最多等待 120 秒）...\n');

    // 等待登录成功的标志：URL 变化或出现用户头像
    let loginSuccess = false;
    const startTime = Date.now();
    const timeout = 120000; // 120 秒

    while (!loginSuccess && Date.now() - startTime < timeout) {
      const currentUrl = page.url();

      // 检查是否登录成功（URL 回到首页或出现用户信息）
      if (!currentUrl.includes('login') && currentUrl !== 'https://www.xiaohongshu.com/') {
        loginSuccess = true;
        console.log('   ✅ 检测到 URL 变化，登录可能成功');
        break;
      }

      // 检查是否有用户头像/用户名出现
      const userAvatar = await page.$('[class*="avatar"], [class*="user"]');
      if (userAvatar) {
        loginSuccess = true;
        console.log('   ✅ 检测到用户信息，登录成功');
        break;
      }

      // 每秒检查一次
      await page.waitForTimeout(1000);
      process.stdout.write('.');
    }

    console.log('');

    if (!loginSuccess) {
      console.log('   ❌ 登录超时');
      return;
    }

    // 步骤 5：保存 Cookie
    console.log('\n📍 步骤 5：保存登录态（Cookie）...');

    const cookies = await context.cookies();
    console.log(`   获取到 ${cookies.length} 个 Cookie`);

    // 提取关键 Cookie
    const importantCookies = cookies.filter(c =>
      ['web_session', 'a1', 'webId', 'sec_poison_id', 'websectiga'].includes(c.name)
    );

    console.log('   关键 Cookie:');
    for (const c of importantCookies) {
      console.log(`   - ${c.name}: ${c.value.substring(0, 20)}...`);
    }

    // 保存到文件
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
    console.log(`   ✅ Cookie 已保存到: ${COOKIE_FILE}`);

    // 步骤 6：验证 Cookie 有效性
    console.log('\n📍 步骤 6：验证 Cookie 有效性...');

    // 访问一个笔记页面
    const testNoteUrl = 'https://www.xiaohongshu.com/explore/674bc2d4000000001e031b22';
    console.log(`   访问测试笔记: ${testNoteUrl}`);

    await page.goto(testNoteUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log(`   最终 URL: ${finalUrl}`);

    // 截图
    await page.screenshot({ path: path.join(__dirname, 'xhs_note_page.png'), fullPage: false });

    if (finalUrl.includes('/explore/') && finalUrl.length > 40) {
      console.log('   ✅ 成功访问笔记页面！');

      // 尝试提取数据
      const pageContent = await page.content();

      const titleMatch = pageContent.match(/"title"\s*:\s*"([^"]+)"/);
      const likeMatch = pageContent.match(/"likedCount"\s*:\s*(\d+)/);
      const collectMatch = pageContent.match(/"collectedCount"\s*:\s*(\d+)/);
      const commentMatch = pageContent.match(/"commentCount"\s*:\s*(\d+)/);

      console.log('\n   📊 提取到的数据:');
      if (titleMatch) console.log(`   标题: ${titleMatch[1].substring(0, 50)}...`);
      if (likeMatch) console.log(`   点赞: ${likeMatch[1]}`);
      if (collectMatch) console.log(`   收藏: ${collectMatch[1]}`);
      if (commentMatch) console.log(`   评论: ${commentMatch[1]}`);

      console.log('\n🎉 验证成功！扫码登录方案可行！');

    } else if (finalUrl.includes('404') || finalUrl.includes('sec_')) {
      console.log('   ❌ 仍被拦截');
    } else {
      console.log('   ⚠️ 状态未知');
    }

    console.log('\n📸 已保存笔记页面截图: scripts/xhs_note_page.png');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    console.log('\n⏳ 5 秒后关闭浏览器...');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  }
}

testQRCodeLogin();
