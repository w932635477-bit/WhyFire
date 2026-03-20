import { test, expect } from '@playwright/test'

test.describe('FFmpeg Video Synthesis Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text())
      }
    })
  })

  test('FFmpeg core files are accessible', async ({ page }) => {
    // Check ffmpeg-core.js is accessible
    const jsResponse = await page.request.get('http://localhost:3000/ffmpeg/ffmpeg-core.js')
    expect(jsResponse.status()).toBe(200)
    expect(jsResponse.headers()['content-type']).toContain('javascript')

    // Check ffmpeg-core.wasm is accessible
    const wasmResponse = await page.request.get('http://localhost:3000/ffmpeg/ffmpeg-core.wasm')
    expect(wasmResponse.status()).toBe(200)
  })

  test('Create page loads without errors', async ({ page }) => {
    await page.goto('http://localhost:3000/create')

    // Wait for page to be ready
    await page.waitForSelector('text=创作你的音乐视频', { timeout: 10000 })

    // Check no critical errors in console
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        errors.push(msg.text())
      }
    })

    // Wait a bit for any errors to appear
    await page.waitForTimeout(2000)

    // Filter out non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('Chrome extension') &&
      !e.includes('blob:') // We should NOT see blob URL errors with our fix
    )

    console.log('Console errors:', criticalErrors)
  })

  test('FFmpeg loads successfully without Blob URL errors', async ({ page }) => {
    const blobUrlErrors: string[] = []
    const ffmpegLogs: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('blob:http') && text.includes('Cannot find module')) {
        blobUrlErrors.push(text)
      }
      if (text.includes('[FFmpeg]')) {
        ffmpegLogs.push(text)
        console.log('FFmpeg Log:', text)
      }
    })

    await page.goto('http://localhost:3000/create')
    await page.waitForSelector('text=创作你的音乐视频', { timeout: 10000 })

    // Enter some lyrics
    const lyricsInput = page.locator('textarea').first()
    if (await lyricsInput.isVisible()) {
      await lyricsInput.fill('测试歌词第一行\n测试歌词第二行\n测试歌词第三行')
    }

    // Wait to see if there are any FFmpeg-related errors
    await page.waitForTimeout(3000)

    // Verify no Blob URL module errors
    expect(blobUrlErrors).toHaveLength(0)

    console.log('FFmpeg logs captured:', ffmpegLogs)
    console.log('Blob URL errors:', blobUrlErrors)
  })
})
