import { NextRequest, NextResponse } from 'next/server'

const EVOLINK_API_URL = 'https://api.evolink.ai/v1/images/generations'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.EVOLINK_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'EVOLINK_API_KEY not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { prompt } = body

    // Create image generation task
    const response = await fetch(EVOLINK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedream-4.5',
        prompt: prompt || `A cinematic hero background for an AI rap video generator website.
Dark purple and emerald green gradient atmosphere with glowing orbs.
Abstract music visualizer elements, sound waves, and audio frequencies flowing across the screen.
Futuristic digital studio equipment silhouettes in the background.
Neon violet and green accent lights creating depth.
Modern tech aesthetic with subtle grid patterns.
Professional music production studio vibe.
16:9 aspect ratio, ultra high quality, 4K resolution.`,
        n: 1,
        size: '16:9',
        quality: '2K',
        prompt_priority: 'standard',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error generating background:', error)
    return NextResponse.json(
      { error: 'Failed to generate background' },
      { status: 500 }
    )
  }
}

// Query task status
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.EVOLINK_API_KEY
    const taskId = request.nextUrl.searchParams.get('task_id')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'EVOLINK_API_KEY not configured' },
        { status: 500 }
      )
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`https://api.evolink.ai/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error querying task:', error)
    return NextResponse.json(
      { error: 'Failed to query task' },
      { status: 500 }
    )
  }
}
