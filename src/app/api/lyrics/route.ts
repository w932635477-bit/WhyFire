import { NextRequest, NextResponse } from 'next/server'

const EVOLINK_BASE_URL = 'https://api.evolink.ai/v1'
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

// 使用 EvoLink 国内代理访问 Claude API
async function generateLyrics(prompt: string): Promise<string> {
  const apiKey = process.env.EVOLINK_API_KEY
  if (!apiKey) {
    throw new Error('EVOLINK_API_KEY 环境变量未配置')
  }

  const response = await fetch(`${EVOLINK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`API 调用失败: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

export async function POST(request: NextRequest) {
  try {
    const { scene, inputs } = await request.json()

    // 根据场景构建 prompt
    const scenePrompts: Record<string, string> = {
      product: `你是一个专业的Rap歌词创作人。为以下产品创作一段30秒左右的Rap歌词，要求：
- 洗脑、好记、押韵
- 突出产品卖点
- 适合短视频传播
- 节奏感强

产品信息：
${JSON.stringify(inputs, null, 2)}

直接输出歌词，不要其他内容。`,

      funny: `你是一个专业的搞笑Rap歌词创作人。为以下主题创作一段30秒左右的搞笑Rap歌词，要求：
- 魔性、接地气、有网络梗
- 押韵、节奏感强
- 让人听了会笑

主题信息：
${JSON.stringify(inputs, null, 2)}

直接输出歌词，不要其他内容。`,

      ip: `你是一个专业的IP混剪Rap歌词创作人。为以下IP创作一段30秒左右的Rap歌词，要求：
- 符合IP调性
- 情感共鸣
- 粉丝向
- 押韵、节奏感强

IP信息：
${JSON.stringify(inputs, null, 2)}

直接输出歌词，不要其他内容。`,

      vlog: `你是一个专业的日常Vlog Rap歌词创作人。为以下日常内容创作一段30秒左右的Rap歌词，要求：
- 生活化、真实
- 轻松、有趣
- 押韵、节奏感强

日常信息：
${JSON.stringify(inputs, null, 2)}

直接输出歌词，不要其他内容。`,
    }

    const prompt = scenePrompts[scene] || scenePrompts.vlog

    const lyrics = await generateLyrics(prompt)

    return NextResponse.json({ lyrics })
  } catch (error) {
    console.error('生成歌词失败:', error)
    return NextResponse.json(
      { error: '生成歌词失败' },
      { status: 500 }
    )
  }
}
