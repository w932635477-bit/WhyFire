/**
 * WhyFire Hero Background Videos Generator
 * 生成 6 个 Neural Frames 风格的短视频循环
 */

const EVOLINK_API_ENDPOINT = 'https://api.evolink.ai'

// 6 个不同主题的视频 Prompt - 每个包含人物角色
const VIDEO_PROMPTS = [
  // 1. Rapper 表演
  {
    name: 'rapper-performer',
    prompt: `A cinematic loop video of a silhouetted rapper performing on stage, microphone in hand.
Dynamic pose with one arm raised, gold chain necklace catching purple and green neon lights.
Audio-reactive visual effects: sound waves emanating from the microphone, pulsing equalizer bars in background.
Dark stage atmosphere with dramatic purple (#8B5CF6) and emerald (#10B981) spotlight beams.
Abstract geometric shapes floating around, reacting to invisible beat drops.
Smooth continuous motion, perfect for seamless loop. No text, no faces clearly visible.
Style: Music video aesthetic, high contrast, professional lighting.`
  },

  // 2. DJ 打碟
  {
    name: 'dj-mixing',
    prompt: `A cinematic loop video of a DJ silhouette mixing on turntables, hands on the decks.
Head bobbing to the rhythm, headphones around neck catching glints of light.
Audio-reactive effects: vinyl records spinning with colorful waveforms, beat-synced particle explosions.
Dark club atmosphere with purple and green laser lights cutting through smoke.
Abstract sound frequency bars rising and falling in background.
Smooth continuous motion, perfect for seamless loop. No text, no clear faces.
Style: EDM music video, neon glow effects, professional quality.`
  },

  // 3. 舞者剪影
  {
    name: 'dancer-silhouette',
    prompt: `A cinematic loop video of a hip-hop dancer silhouette in dynamic pose.
Body in mid-breakdance move, one hand on floor, legs in the air.
Audio-reactive effects: motion trails in purple and green following the dancer's movements.
Dark background with pulsing geometric patterns reacting to imaginary beat.
Abstract music notes and waveform lines floating around the figure.
Smooth continuous motion, perfect for seamless loop. No text, silhouette only.
Style: Street dance video, high contrast, energetic feel.`
  },

  // 4. 歌手录音
  {
    name: 'singer-recording',
    prompt: `A cinematic loop video of a singer silhouette in a recording booth, standing before a microphone.
Hands expressing emotion, one reaching toward the mic, body leaning forward.
Audio-reactive effects: voice visualized as colorful sound waves, glowing particles floating.
Dark studio atmosphere with purple and green LED strip lighting.
Abstract frequency spectrum bars on the booth glass, pulsing rhythmically.
Smooth continuous motion, perfect for seamless loop. No text, no clear faces.
Style: Professional studio video, atmospheric lighting, emotional.`
  },

  // 5. 音乐制作人
  {
    name: 'producer-creating',
    prompt: `A cinematic loop video of a music producer silhouette working at a computer with MIDI controller.
Hands moving across keyboard and pads, head nodding to the beat.
Audio-reactive effects: on-screen waveforms dancing, colorful particle bursts from speakers.
Dark studio with purple and green ambient lighting, multiple monitors glowing.
Abstract equalizer visualization on screens, bass waves visible in the air.
Smooth continuous motion, perfect for seamless loop. No text, no clear faces.
Style: Behind-the-scenes studio video, tech aesthetic, creative energy.`
  },

  // 6. 街头艺术家
  {
    name: 'street-artist',
    prompt: `A cinematic loop video of a street artist silhouette spray-painting a wall mural.
Arm extended with spray can, creating colorful graffiti art.
Audio-reactive effects: paint spray transforming into musical notes and sound waves.
Urban night scene with purple and green neon reflections on wet pavement.
Abstract boombox and microphone elements emerging from the painted wall.
Smooth continuous motion, perfect for seamless loop. No text, silhouette style.
Style: Hip-hop culture video, urban aesthetic, artistic expression.`
  }
]

interface VideoGenerationResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  results?: string[]
  error?: { message: string }
}

async function generateMultipleVideos(apiKey: string, prompt: string, name: string): Promise<string> {
  console.log(`🎬 Generating video: ${name}...`)

  const response = await fetch(`${EVOLINK_API_ENDPOINT}/v1/videos/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sora-2-pro-preview',
      prompt: prompt,
      aspect_ratio: '16:9',
      duration: 4, // 短视频 4 秒（API 只支持 4/8/12）
      quality: '720p',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create video task: ${error}`)
  }

  const task: VideoGenerationResponse = await response.json()
  console.log(`  ✅ Task created: ${task.id}`)

  // 轮询状态
  let attempts = 0
  const maxAttempts = 120

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000))

    const statusResponse = await fetch(`${EVOLINK_API_ENDPOINT}/v1/tasks/${task.id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!statusResponse.ok) {
      throw new Error(`Failed to check task status: ${await statusResponse.text()}`)
    }

    const status: VideoGenerationResponse = await statusResponse.json()
    process.stdout.write(`\r  📊 ${name}: ${status.progress}% - ${status.status}    `)

    if (status.status === 'completed' && status.results?.[0]) {
      console.log('\n  🎉 Completed!')
      return status.results[0]
    }

    if (status.status === 'failed') {
      throw new Error(`Video generation failed: ${status.error?.message || 'Unknown error'}`)
    }

    attempts++
  }

  throw new Error('Video generation timeout')
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const fs = await import('fs')
  const path = await import('path')

  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(outputPath, buffer)
  console.log(`  📥 Saved: ${outputPath}`)
}

async function main() {
  const apiKey = process.env.EVOLINK_API_KEY

  if (!apiKey) {
    console.error('❌ Error: EVOLINK_API_KEY not found')
    process.exit(1)
  }

  console.log('🎥 WhyFire Hero Videos Generator')
  console.log(`📦 Generating ${VIDEO_PROMPTS.length} videos...\n`)

  const results: { name: string; url: string; path: string }[] = []

  for (let i = 0; i < VIDEO_PROMPTS.length; i++) {
    const video = VIDEO_PROMPTS[i]
    console.log(`\n[${i + 1}/${VIDEO_PROMPTS.length}] ${video.name}`)

    try {
      const videoUrl = await generateMultipleVideos(apiKey, video.prompt, video.name)
      const outputPath = `./public/videos/hero/${video.name}.mp4`
      await downloadVideo(videoUrl, outputPath)

      results.push({ name: video.name, url: videoUrl, path: outputPath })
    } catch (error) {
      console.error(`  ❌ Failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  console.log('\n\n🎉 Generation Complete!')
  console.log('━'.repeat(50))
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`)
    console.log(`   📁 ${r.path}`)
    console.log(`   🔗 ${r.url}`)
  })
  console.log('\n🌐 Refresh http://localhost:3000 to see the videos!')
}

main()
