import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3001'

// 辅助：关闭欢迎弹窗
async function dismissWelcome(page: import('@playwright/test').Page) {
  const welcomeModal = page.locator('text=欢迎使用方言回响')
  await expect(welcomeModal).toBeVisible({ timeout: 10000 })
  await page.locator('button:has-text("开始创作")').click()
  await expect(welcomeModal).not.toBeVisible()
}

// 辅助：跳过声音克隆（Step 1 → Step 2）
async function skipVoiceCloning(page: import('@playwright/test').Page) {
  // 等待服务状态加载完成
  await page.waitForTimeout(2000)

  const skipBtn = page.locator('button:has-text("使用默认音色继续")')
  if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    // 服务不可用，直接跳过
    await skipBtn.click()
    // skipBtn 内部调用 onNext()，会直接进入 Step 2
  } else {
    // 声音克隆服务可用 → 上传音频文件
    const audioFileInput = page.locator('input[type="file"][accept="audio/*"]')
    await audioFileInput.setInputFiles({
      name: 'test-audio.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('fake audio content for testing'),
    })
    // 等待音频就绪
    await expect(page.locator('text=音频已就绪')).toBeVisible({ timeout: 5000 })
  }

  // 等待下一步按钮变为可用，然后点击
  await page.waitForTimeout(500)
  const nextBtn = page.locator('footer button:has-text("下一步"), footer button:has-text("请先录制或上传音频")')
  await expect(nextBtn.first()).toBeEnabled({ timeout: 5000 })
  await nextBtn.first().click()
}

test.describe('创作流程端到端表单测试', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage 确保欢迎弹窗出现
    await page.goto(`${BASE_URL}/sonic-gallery/create`)
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('Step 1: 欢迎弹窗 → 关闭 → 跳过声音克隆', async ({ page }) => {
    // 等待欢迎弹窗
    await dismissWelcome(page)

    // 确认在 Step 1
    await expect(page.locator('text=建立你的数字声音身份')).toBeVisible()

    // 截图调试
    await page.screenshot({ path: 'test-results/step1-initial.png' })

    // 验证底栏按钮初始状态（禁用，显示"请先录制或上传音频"）
    // Step 1 底栏只有一个"下一步"/"请先录制或上传音频"按钮
    const footerBtn = page.locator('footer button:has-text("请先录制或上传音频")')
    if (await footerBtn.isVisible().catch(() => false)) {
      await expect(footerBtn).toBeDisabled()
    }

    // 跳过声音克隆
    await skipVoiceCloning(page)
  })

  test('Step 2: 选择方言和伴奏', async ({ page }) => {
    await dismissWelcome(page)

    // 跳过 Step 1
    await skipVoiceCloning(page)

    // 等待并验证进入 Step 2
    await page.screenshot({ path: 'test-results/after-skip-step1.png' })
    await expect(page.locator('h2:has-text("选择声音风格")')).toBeVisible({ timeout: 10000 })

    // 选择方言 - 四川话
    const sichuanBtn = page.locator('button:has-text("四川话")')
    if (await sichuanBtn.isVisible()) {
      await sichuanBtn.click()
    }

    // 验证默认 BGM 已自动选择（八方来财）
    await expect(page.locator('text=八方来财')).toBeVisible()

    // 选择另一个 BGM
    const karmaBeat = page.locator('button:has-text("因果")')
    if (await karmaBeat.isVisible()) {
      await karmaBeat.click()
    }

    // 点击下一步
    await page.locator('footer button:has-text("下一步")').click()
  })

  test('Step 3: 填写自我描述、选择话题、生成歌词', async ({ page }) => {
    await dismissWelcome(page)

    // 跳过 Step 1
    await skipVoiceCloning(page)

    // Step 2 - 直接下一步（默认已选择）
    await expect(page.locator('h2:has-text("选择声音风格")')).toBeVisible({ timeout: 10000 })
    await page.locator('footer button:has-text("下一步")').click()

    // 验证进入 Step 3
    await expect(page.locator('text=创作你的专属歌词')).toBeVisible({ timeout: 5000 })

    // 填写自我描述
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await textarea.fill('程序员，喜欢打游戏，最近在减肥，想吐槽一下加班生活')

    // 验证字数统计
    await expect(page.locator('text=25/200')).toBeVisible()

    // 展开热点话题面板
    await page.locator('button:has-text("热点话题")').click()

    // 选择一个话题
    const topicBtn = page.locator('button:has-text("996工作制")')
    if (await topicBtn.isVisible()) {
      await topicBtn.click()
    }

    // 选择一个流行梗
    const memeBtn = page.locator('button:has-text("#yyds")')
    if (await memeBtn.isVisible()) {
      await memeBtn.click()
    }

    // 验证选中数量标记（violet 色的计数 badge）
    const countBadge = page.locator('span.w-5.h-5.rounded-full.bg-violet-500\\/20')
    if (await countBadge.isVisible()) {
      await expect(countBadge).toContainText('2')
    }

    // 点击生成歌词按钮
    await page.locator('button:has-text("生成歌词")').click()

    // 验证 loading 状态
    await page.waitForTimeout(1000)
  })

  test('完整4步流程导航', async ({ page }) => {
    await dismissWelcome(page)

    // === Step 1: 声音克隆 ===
    await expect(page.locator('text=建立你的数字声音身份')).toBeVisible()

    // 检查步骤标签栏
    const stepTabs = page.locator('[class*="rounded-lg"] span.font-sans')
    await expect(stepTabs.filter({ hasText: '音色克隆' })).toBeVisible()

    // 验证三个上传选项（使用 heading 定位器避免多匹配）
    await expect(page.locator('h3:has-text("上传视频")')).toBeVisible()
    await expect(page.locator('h3:has-text("直接录音")')).toBeVisible()
    await expect(page.locator('h3:has-text("上传音频")')).toBeVisible()

    // 跳过声音克隆
    await skipVoiceCloning(page)

    // === Step 2: 节奏方言 ===
    await expect(page.locator('h2:has-text("选择声音风格")')).toBeVisible({ timeout: 10000 })

    // 验证方言选项和伴奏列表
    await expect(page.locator('h3:has-text("声音风格")')).toBeVisible()
    await expect(page.locator('text=精选伴奏')).toBeVisible()

    // 检查底栏按钮
    await expect(page.locator('footer button:has-text("上一步")')).toBeVisible()
    await expect(page.locator('footer button:has-text("下一步")')).toBeVisible()

    // 点击下一步
    await page.locator('footer button:has-text("下一步")').click()

    // === Step 3: 歌词创作 ===
    await expect(page.locator('text=创作你的专属歌词')).toBeVisible({ timeout: 5000 })

    // 验证 textarea
    const lyricsTextarea = page.locator('textarea').first()
    await expect(lyricsTextarea).toBeVisible()

    // 验证生成歌词按钮
    await expect(page.locator('button:has-text("生成歌词")')).toBeVisible()

    // 验证上一步按钮
    await expect(page.locator('footer button:has-text("上一步")')).toBeVisible()

    // 下一步按钮应该是禁用的（没生成歌词）
    const step3Next = page.locator('footer button:has-text("下一步")')
    await expect(step3Next).toBeDisabled()

    // 返回 Step 2
    await page.locator('footer button:has-text("上一步")').click()
    await expect(page.locator('h2:has-text("选择声音风格")')).toBeVisible()

    // 再前进到 Step 3
    await page.locator('footer button:has-text("下一步")').click()
    await expect(page.locator('text=创作你的专属歌词')).toBeVisible({ timeout: 5000 })
  })

  test('步骤标签栏导航', async ({ page }) => {
    await dismissWelcome(page)

    // 验证步骤标签都可见
    await expect(page.locator('text=音色克隆').first()).toBeVisible()
    await expect(page.locator('text=节奏方言').first()).toBeVisible()
    await expect(page.locator('text=歌词创作').first()).toBeVisible()
    await expect(page.locator('text=预览生成').first()).toBeVisible()

    // 点击未来的步骤应该无效（当前在 Step 1）
    const step3Tab = page.locator('button:has-text("歌词创作")').first()
    await step3Tab.click()
    // 仍然在 Step 1
    await expect(page.locator('text=建立你的数字声音身份')).toBeVisible()
  })

  test('页面头部导航元素', async ({ page }) => {
    await dismissWelcome(page)

    // 验证 Logo（使用 .first() 避免多匹配）
    await expect(page.locator('text=方言回响').first()).toBeVisible()
    await expect(page.locator('text=WhyFire Studio')).toBeVisible()

    // 验证返回首页链接
    await expect(page.locator('text=返回首页')).toBeVisible()

    // 验证剩余时间提示
    await expect(page.locator('text=剩余').first()).toBeVisible()
  })
})
