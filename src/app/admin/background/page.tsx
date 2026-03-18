'use client'

import { useState } from 'react'

export default function BackgroundGenerator() {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState(`A cinematic hero background for an AI rap video generator website.
Dark purple and emerald green gradient atmosphere with glowing orbs.
Abstract music visualizer elements, sound waves, and audio frequencies flowing across the screen.
Futuristic digital studio equipment silhouettes in the background.
Neon violet and green accent lights creating depth.
Modern tech aesthetic with subtle grid patterns.
Professional music production studio vibe.
16:9 aspect ratio, ultra high quality, 4K resolution.`)

  const generateBackground = async () => {
    setLoading(true)
    setStatus('Creating task...')
    setImageUrl(null)

    try {
      const response = await fetch('/api/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (data.id) {
        setTaskId(data.id)
        setStatus(`Task created: ${data.status}`)
        pollTaskStatus(data.id)
      } else {
        setStatus(`Error: ${JSON.stringify(data)}`)
        setLoading(false)
      }
    } catch (error) {
      setStatus(`Error: ${error}`)
      setLoading(false)
    }
  }

  const pollTaskStatus = async (id: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/generate-background?task_id=${id}`)
        const data = await response.json()

        setStatus(`Status: ${data.status} (${data.progress}%)`)

        if (data.status === 'completed' && data.results?.[0]) {
          setImageUrl(data.results[0])
          setStatus('Completed!')
          setLoading(false)
        } else if (data.status === 'failed') {
          setStatus(`Failed: ${JSON.stringify(data)}`)
          setLoading(false)
        } else {
          // Continue polling
          setTimeout(poll, 3000)
        }
      } catch (error) {
        setStatus(`Error polling: ${error}`)
        setLoading(false)
      }
    }

    poll()
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Background Image Generator</h1>

        <div className="bg-zinc-800 rounded-xl p-6 mb-8">
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-40 bg-zinc-700 rounded-lg p-4 text-white border border-zinc-600 focus:border-violet-500 focus:outline-none"
          />

          <button
            onClick={generateBackground}
            disabled={loading}
            className="mt-4 px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Background'}
          </button>
        </div>

        {status && (
          <div className="bg-zinc-800 rounded-xl p-6 mb-8">
            <p className="text-zinc-300">{status}</p>
            {taskId && (
              <p className="text-zinc-500 text-sm mt-2">Task ID: {taskId}</p>
            )}
          </div>
        )}

        {imageUrl && (
          <div className="bg-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Image</h2>
            <img
              src={imageUrl}
              alt="Generated background"
              className="w-full rounded-lg"
            />
            <div className="mt-4 flex gap-4">
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
              >
                Open Full Size
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(imageUrl)}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
              >
                Copy URL
              </button>
            </div>
            <p className="mt-4 text-zinc-500 text-sm break-all">
              URL: {imageUrl}
            </p>
          </div>
        )}

        <div className="mt-8 bg-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Usage Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-zinc-300">
            <li>Configure your EVOLINK_API_KEY in .env.local</li>
            <li>Click "Generate Background" to create a new image</li>
            <li>Wait for the image to be generated (about 30-60 seconds)</li>
            <li>Copy the URL and update it in the homepage code</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
