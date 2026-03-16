/**
 * Cookie 方案最终验证
 * 从页面 __INITIAL_STATE__ 提取数据
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, 'xhs_cookies.json');

async function testFinal() {
  console.log('🚀 Cookie 方案最终验证\n');

  if (!fs.existsSync(COOKIE_FILE)) {
    console.log('❌ 请先运行扫码登录');
    return;
  }

  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
  console.log(`📋 Cookie: ${cookies.length} 个\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X_10_15_7) AppleWebKit/537.36',
    });
    await context.addCookies(cookies);

    const page = await context.newPage();

    // 访问发现页
    console.log('📍 访问发现页...');
    await page.goto('https://www.xiaohongshu.com/explore', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // 提取 __INITIAL_STATE__
    const initialState = await page.evaluate(() => {
      try {
        // 小红书在 window.__INITIAL_STATE__ 中存储数据
        if (window.__INITIAL_STATE__) {
          return JSON.stringify(window.__INITIAL_STATE__);
        }
        return null;
      } catch (e) {
        return null;
      }
    });

    if (initialState) {
      console.log('✅ 找到 __INITIAL_STATE__');
      const data = JSON.parse(initialState);
      console.log(`   数据结构: ${Object.keys(data).join(', ')}`);

      // 尝试提取首页笔记数据
      if (data.homeFeed || data.notes) {
        const feedData = data.homeFeed || data.notes;
        console.log(`   笔记数据: ${Array.isArray(feedData) ? feedData.length + ' 条' : '存在'}`);
      }
    }

    // 从页面 HTML 中提取笔记数据
    console.log('\n📍 从页面提取笔记数据...');
    const html = await page.content();

    // 匹配所有 noteId
    const noteIdRegex = /"noteId"\s*:\s*"([a-f0-9]{24})"/g;
    const noteIds = new Set();
    let m;
    while ((m = noteIdRegex.exec(html)) !== null) {
      noteIds.add(m[1]);
    }

    console.log(`   找到 ${noteIds.size} 个笔记 ID`);

    if (noteIds.size > 0) {
      const testId = [...noteIds][0];
      const testUrl = `https://www.xiaohongshu.com/explore/${testId}`;

      console.log(`\n📍 访问笔记: ${testId}`);

      await page.goto(testUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await page.waitForTimeout(3000);

      const finalUrl = page.url();
      console.log(`   URL: ${finalUrl}`);

      await page.screenshot({ path: path.join(__dirname, 'xhs_final_note.png') });

      // 提取笔记数据
      const noteState = await page.evaluate(() => {
        try {
          if (window.__INITIAL_STATE__) {
            return window.__INITIAL_STATE__;
          }
          return null;
        } catch (e) {
          return null;
        }
      });

      if (noteState && noteState.note) {
        const note = noteState.note;
        console.log('\n📊 笔记数据:');
        console.log('─'.repeat(50));

        if (note.noteId) console.log(`ID: ${note.noteId}`);
        if (note.title) console.log(`标题: ${note.title}`);
        if (note.desc) console.log(`正文: ${note.desc.substring(0, 100)}...`);
        if (note.interactInfo) {
          console.log(`点赞: ${note.interactInfo.likedCount || 0}`);
          console.log(`收藏: ${note.interactInfo.collectedCount || 0}`);
          console.log(`评论: ${note.interactInfo.commentCount || 0}`);
          console.log(`分享: ${note.interactInfo.shareCount || 0}`);
        }
        if (note.tagList) {
          console.log(`标签: ${note.tagList.map(t => t.name || t).join(', ')}`);
        }

        console.log('─'.repeat(50));
        console.log('\n🎉 Cookie 方案验证成功！');

      } else {
        // 从 HTML 中提取
        console.log('\n📍 从 HTML 提取数据...');
        const noteHtml = await page.content();

        const extract = (regex) => {
          const match = noteHtml.match(regex);
          return match ? match[1] : null;
        };

        const title = extract(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const noteId = extract(/"noteId"\s*:\s*"([^"]+)"/);
        const likes = extract(/"likedCount"\s*:\s*(\d+)/);
        const collects = extract(/"collectedCount"\s*:\s*(\d+)/);
        const comments = extract(/"commentCount"\s*:\s*(\d+)/);

        console.log('\n📊 笔记数据:');
        console.log('─'.repeat(50));
        if (noteId) console.log(`ID: ${noteId}`);
        if (title) console.log(`标题: ${title}`);
        if (likes) console.log(`点赞: ${likes}`);
        if (collects) console.log(`收藏: ${collects}`);
        if (comments) console.log(`评论: ${comments}`);
        console.log('─'.repeat(50));

        if (title || likes) {
          console.log('\n🎉 Cookie 方案验证成功！');
        } else {
          console.log('\n⚠️ 未能提取数据，但页面可访问');
          console.log('📸 截图已保存: scripts/xhs_final_note.png');
        }
      }

    } else {
      console.log('\n⚠️ 未找到笔记 ID，尝试手动构造...');

      // 访问一个真实的笔记
      await page.goto('https://www.xiaohongshu.com/explore/65d8e6d4000000002701907d', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await page.waitForTimeout(3000);

      const noteHtml = await page.content();
      const title = noteHtml.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);

      if (title) {
        console.log(`\n✅ 标题: ${title[1]}`);
        console.log('🎉 Cookie 方案验证成功！');
      }

      await page.screenshot({ path: path.join(__dirname, 'xhs_manual_note.png') });
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
}

testFinal();
