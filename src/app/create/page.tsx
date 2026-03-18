'use client'

import { useState } from 'react'
import {
  CREATION_STEPS,
  SCENE_CONFIGS,
  type SceneType,
  type SceneInputs,
  type ProductInputs,
  type FunnyInputs,
  type IPInputs,
  type VlogInputs
} from '@/types'
import { MusicGenerator } from '@/components/features/music/music-generator'

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [scene, setScene] = useState<SceneType | null>(null)
  const [inputs, setInputs] = useState<SceneInputs | null>(null)
  const [lyrics, setLyrics] = useState<string | null>(null)
  const [musicUrl, setMusicUrl] = useState<string | null>(null)
  const [musicTaskId, setMusicTaskId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSceneSelect = (selectedScene: SceneType) => {
    setScene(selectedScene)
    setCurrentStep(1)

    // 初始化对应场景的空输入
    const defaultInputs: Record<SceneType, SceneInputs> = {
      product: { productName: '', sellingPoints: [], price: '', targetAudience: '' },
      funny: { theme: '', keywords: [], tone: 'relatable' },
      ip: { ipName: '', coreElements: [], mood: 'cool' },
      vlog: { activities: [], location: '', mood: 'chill' },
    }

    setInputs(defaultInputs[selectedScene])
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SCENE_CONFIGS.map((config) => (
              <button
                key={config.id}
                onClick={() => handleSceneSelect(config.id)}
                className="card-hover p-6 rounded-xl border border-dark-600 bg-dark-800 hover:border-primary-500 transition-all"
              >
                <div className="text-4xl mb-3">{config.icon}</div>
                <h3 className="font-semibold text-white mb-1">{config.name}</h3>
                <p className="text-sm text-gray-400">{config.description}</p>
              </button>
            ))}
          </div>
        )
      case 1:
        return <InputForm scene={scene!} inputs={inputs!} setInputs={setInputs} onNext={() => setCurrentStep(2)} />
      case 2:
        return <LyricsGenerator scene={scene!} inputs={inputs!} lyrics={lyrics} setLyrics={setLyrics} onNext={() => setCurrentStep(3)} />
      case 3:
        return (
          <MusicGenerator
            lyrics={lyrics || ''}
            dialect={(inputs as ProductInputs)?.targetAudience ? 'mandarin' : 'mandarin'}
            style="rap"
            onMusicGenerated={(audioUrl, taskId) => {
              setMusicUrl(audioUrl)
              setMusicTaskId(taskId)
            }}
            onError={(error) => {
              console.error('音乐生成失败:', error)
              alert(`音乐生成失败: ${error.message}`)
            }}
            onNext={() => setCurrentStep(4)}
            initialTaskId={musicTaskId || undefined}
          />
        )
      case 4:
        return <VideoSelector musicUrl={musicUrl!} onNext={() => setCurrentStep(5)} />
      case 5:
        return <div>合成成品（开发中）</div>
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-dark-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {CREATION_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${index <= currentStep ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-400'}`}>
                  {index < currentStep ? '✓' : step.id}
                </div>
                {index < CREATION_STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${index < currentStep ? 'bg-primary-500' : 'bg-dark-700'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            {CREATION_STEPS.map((step) => (
              <span key={step.id} className="w-20 text-center">{step.name}</span>
            ))}
          </div>
        </div>

        {/* 步骤内容 */}
        <div className="animate-fade-in">
          {renderStepContent()}
        </div>
      </div>
    </main>
  )
}

// 输入表单组件
function InputForm({
  scene,
  inputs,
  setInputs,
  onNext,
}: {
  scene: SceneType
  inputs: SceneInputs
  setInputs: (inputs: SceneInputs) => void
  onNext: () => void
}) {
  const config = SCENE_CONFIGS.find((c) => c.id === scene)

  const handleInputChange = (key: string, value: string | string[]) => {
    setInputs({ ...inputs, [key]: value } as SceneInputs)
  }

  const handleArrayInputChange = (key: string, value: string) => {
    const array = value.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
    setInputs({ ...inputs, [key]: array } as SceneInputs)
  }

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
      <h2 className="text-xl font-semibold mb-6">{config?.name} - 输入信息</h2>

      <div className="space-y-4">
        {config?.inputFields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={(inputs as unknown as Record<string, unknown>)[field.key] as string || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none transition-colors"
                rows={3}
              />
            ) : field.type === 'array' ? (
              <input
                type="text"
                value={((inputs as unknown as Record<string, unknown>)[field.key] as string[])?.join('， ') || ''}
                onChange={(e) => handleArrayInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none transition-colors"
              />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={(inputs as unknown as Record<string, unknown>)[field.key] as string || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          className="gradient-btn px-6 py-3 rounded-lg font-medium text-white"
        >
          下一步：生成歌词
        </button>
      </div>
    </div>
  )
}

// 歌词生成组件
function LyricsGenerator({
  scene,
  inputs,
  lyrics,
  setLyrics,
  onNext,
}: {
  scene: SceneType
  inputs: SceneInputs
  lyrics: string | null
  setLyrics: (lyrics: string) => void
  onNext: () => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateLyrics = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene, inputs }),
      })
      const data = await response.json()
      setLyrics(data.lyrics)
    } catch (error) {
      console.error('生成歌词失败:', error)
      // 演示用模拟数据
      setLyrics(`这是示例歌词\n\n产品真的太好\n买了绝对不后悔\n价格实惠又划算\n错过绝对会后悔\n\n🎵 AI生成的Rap歌词`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
      <h2 className="text-xl font-semibold mb-6">生成 Rap 歌词</h2>

      {!lyrics ? (
        <div className="text-center py-12">
          <button
            onClick={generateLyrics}
            disabled={isGenerating}
            className="gradient-btn px-8 py-4 rounded-xl font-medium text-white text-lg"
          >
            {isGenerating ? '生成中...' : '点击生成歌词'}
          </button>
          <p className="text-gray-500 text-sm mt-4">AI 将根据你的输入生成押韵的 Rap 歌词</p>
        </div>
      ) : (
        <div>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            className="w-full h-64 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white font-mono text-sm"
          />
          <div className="mt-4 flex justify-between">
            <button
              onClick={generateLyrics}
              className="px-4 py-2 border border-dark-600 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              重新生成
            </button>
            <button
              onClick={onNext}
              className="gradient-btn px-6 py-3 rounded-lg font-medium text-white"
            >
              下一步：生成音乐
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 音乐生成组件 - 已集成到步骤4，使用 MusicGenerator 组件

// 视频选择组件
function VideoSelector({
  musicUrl,
  onNext,
}: {
  musicUrl: string
  onNext: () => void
}) {
  const [videoFile, setVideoFile] = useState<File | null>(null)

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
      <h2 className="text-xl font-semibold mb-6">选择视频</h2>

      <div className="space-y-6">
        {/* 上传视频 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            上传你的视频素材
          </label>
          <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📹</div>
              <p className="text-gray-400">
                {videoFile ? videoFile.name : '点击或拖拽上传视频'}
              </p>
            </label>
          </div>
        </div>

        {/* 模板选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            或选择内置模板
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video bg-dark-700 rounded-lg flex items-center justify-center text-gray-500">
                模板 {i}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={!videoFile}
          className="gradient-btn px-6 py-3 rounded-lg font-medium text-white disabled:opacity-50"
        >
          下一步：合成成品
        </button>
      </div>
    </div>
  )
}
