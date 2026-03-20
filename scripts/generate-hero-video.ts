/**
 * WhyFire Hero Background Video Generator
 * 使用 EvoLink Sora 2 Pro API 生成 Hero 区背景视频
 *
 * 使用方法:
 * EVOLINK_API_KEY=your_key npx tsx scripts/generate-hero-video.ts
 */

const EVOLINK_API_URL = 'https://api.evolink.ai'

// WhyFire 品牌视频 Prompt - Neural Frames 风格
// 参考: https://www.neuralframes.com/ - 音频反应式 AI 动画，抽象迷幻视觉
const HERO_VIDEO_PROMPT = `
A mesmerizing AI-generated abstract music video loop in the style of Neural Frames audio-reactive animations.

CORE CONCEPT:
A hypnotic, psychedelic journey through a rap music universe. Abstract morphing shapes and flowing patterns that pulse and breathe like they're alive, synchronized to an imagined hip-hop beat.

VISUAL ELEMENTS:

1. CENTRAL SUBJECT - Morphing Rap Iconography:
   - A stylized, abstract microphone made of liquid metal that continuously transforms
   - Golden chains and diamond-encrusted elements dissolving into sound waves
   - Floating boombox speakers that morph into pulsing equalizer bars
   - All elements should be semi-abstract, recognizable but dreamlike

2. ABSTRACT AUDIO VISUALIZATION:
   - Organic, flowing waveform lines that look like ink in water
   - Sound frequency represented as colorful smoke or vapor
   - Bass hits visualized as expanding circular shockwaves
   - High frequencies shown as shimmering particle effects
   - Everything moves rhythmically to an unseen beat

3. PSYCHEDELIC BACKGROUND:
   - Deep void black with swirling purple (#8B5CF6) and emerald (#10B981) nebulae
   - Geometric fractal patterns subtly emerging and dissolving
   - Hypnotic tunnel effects creating infinite depth
   - Stained glass window effects with brand colors
   - Occasional flash of gold and silver for luxury feel

4. STYLE INFLUENCES:
   - Neural Frames audio-reactive aesthetic
   - Music video visualizers for electronic/hip-hop
   - Abstract expressionist art in motion
   - Synesthesia-inducing color relationships
   - Instagram viral AI art style
   - Spotify Canvas loop aesthetic

MOTION CHARACTERISTICS:
- Seamless infinite loop (start and end frames match perfectly)
- Smooth 60fps quality motion
- Elements morph continuously without abrupt changes
- Camera slowly zooms through the scene
- Particles and shapes react to imagined bass drops
- Hypnotic, trance-inducing repetition

COLOR TREATMENT:
- Dominant: Pure black background (#000000)
- Primary accent: Vibrant purple (#8B5CF6) - glowing, neon-like
- Secondary accent: Emerald green (#10B981) - luminous
- Highlights: Gold (#FFD700) and silver for luxury
- Occasional: Hot pink and electric blue for energy
- All colors should feel like they're emitting light, not reflecting

TECHNICAL SPECS:
- No text, no faces, no realistic people
- No copyrighted imagery or logos
- Abstract enough to not distract from overlaid text
- High contrast for white text readability
- Professional music video quality
- Cinematic depth and atmosphere

EMOTIONAL TARGET:
- Feel the energy of creating a rap video
- Sense of unlimited creative possibilities
- Captivating and slightly hypnotic
- Makes viewer want to create something amazing
- Modern, cutting-edge, innovative

The final result should feel like a premium AI-generated music video background that could be on Neural Frames, created by a professional visual artist for a hip-hop track.
`

interface VideoGenerationResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  results?: string[]
  error?: { message: string }
}

async function generateSingleVideo(apiKey: string): Promise<string> {
  console.log('🎬 Starting video generation with Sora 2 Pro...')
  console.log('📝 Prompt:', HERO_VIDEO_PROMPT.substring(0, 100) + '...')

  // 1. 创建视频生成任务
  const response = await fetch(`${EVOLINK_API_URL}/v1/videos/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sora-2-pro-preview',
      prompt: HERO_VIDEO_PROMPT,
      aspect_ratio: '16:9',
      duration: 12, // 12秒，适合循环播放
      quality: '720p', // 720p 性价比高
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create video task: ${error}`)
  }

  const task: VideoGenerationResponse = await response.json()
  console.log(`✅ Task created: ${task.id}`)
  console.log(`⏳ Estimated time: ~5 minutes`)

  // 2. 轮询任务状态
  let attempts = 0
  const maxAttempts = 120 // 最多等待 10 分钟

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)) // 每 5 秒查询一次

    const statusResponse = await fetch(`${EVOLINK_API_URL}/v1/tasks/${task.id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!statusResponse.ok) {
      throw new Error(`Failed to check task status: ${await statusResponse.text()}`)
    }

    const status: VideoGenerationResponse = await statusResponse.json()
    console.log(`📊 Progress: ${status.progress}% - Status: ${status.status}`)

    if (status.status === 'completed' && status.results?.[0]) {
      console.log('🎉 Video generation completed!')
      return status.results[0]
    }

    if (status.status === 'failed') {
      throw new Error(`Video generation failed: ${status.error?.message || 'Unknown error'}`)
    }

    attempts++
  }

  throw new Error('Video generation timeout - please try again')
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  console.log('📥 Downloading video...')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const fs = await import('fs')
  const path = await import('path')

  // 确保目录存在
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(outputPath, buffer)
  console.log(`✅ Video saved to: ${outputPath}`)
}

async function main() {
  const apiKey = process.env.EVOLINK_API_KEY

  if (!apiKey) {
    console.error('❌ Error: EVOLINK_API_KEY not found in environment variables')
    console.log('Please add EVOLINK_API_URL_KEY=your_key to .env.local')
    process.exit(1)
  }

  try {
    // 生成视频
    const videoUrl = await generateSingleVideo(apiKey)
    console.log(`🔗 Video URL: ${videoUrl}`)

    // 下载视频
    const outputPath = './public/videos/hero-rap-bg.mp4'
    await downloadVideo(videoUrl, outputPath)

    console.log('\n🎉 Hero background video generated successfully!')
    console.log('📁 Location: public/videos/hero-rap-bg.mp4')
    console.log('🌐 Refresh http://localhost:3000 to see the video in action!')

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
