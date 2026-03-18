'use client'

import { useState } from 'react'
import { SCENE_CONFIGS, type SceneType } from '@/types'

export default function Home() {
  const [selectedScene, setSelectedScene] = useState<SceneType | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* 头部 */}
      <header className="pt-8 pb-4 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">WhyFire</span>
          </h1>
          <p className="text-xl text-gray-400 mb-2">
            AI Rap 视频一键生成器
          </p>
          <p className="text-sm text-gray-500">
            输入信息 → AI写词 → AI配乐 → 一键出片
          </p>
        </div>
      </header>

      {/* 场景选择 */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-8 text-gray-300">
            你想做什么类型的视频？
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SCENE_CONFIGS.map((scene) => (
              <button
                key={scene.id}
                onClick={() => setSelectedScene(scene.id)}
                className={`
                  p-6 rounded-2xl border-2 transition-all card-hover
                  ${selectedScene === scene.id
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                  }
                `}
              >
                <div className="text-4xl mb-3">{scene.icon}</div>
                <div className="font-semibold text-white mb-1">{scene.name}</div>
                <div className="text-xs text-gray-500">{scene.description}</div>
              </button>
            ))}
          </div>

          {/* 开始按钮 */}
          {selectedScene && (
            <div className="mt-12 text-center animate-fade-in">
              <button className="gradient-btn px-12 py-4 rounded-full text-lg font-semibold text-white pulse-glow">
                开始创作 →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 功能介绍 */}
      <section className="px-6 py-12 border-t border-dark-700">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-8 text-gray-300">
            只需 4 步，生成你的 Rap 视频
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: 1, icon: '✍️', title: '输入信息', desc: '填写产品/主题信息' },
              { step: 2, icon: '🎤', title: 'AI 写词', desc: '自动生成 Rap 歌词' },
              { step: 3, icon: '🎵', title: 'AI 配乐', desc: '生成原创 Rap 音乐' },
              { step: 4, icon: '🎬', title: '一键出片', desc: '合成成品视频' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div className="font-semibold text-white mb-1">{item.title}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部 */}
      <footer className="px-6 py-8 border-t border-dark-700">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          <p>WhyFire © 2026 - AI Rap 视频一键生成器</p>
        </div>
      </footer>
    </main>
  )
}
