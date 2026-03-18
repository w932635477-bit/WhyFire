'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SCENE_CONFIGS, type SceneType } from '@/types'

// SVG 图标组件
const Icons = {
  shoppingCart: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003-3h5.303m3.5-1v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  comedy: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  ),
  clapperboard: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  camera: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 00-1.64-1.055l-.422-.125M13.5 9.75a2.25 2.25 0 104.5 0 2.25 2.25 0 10-4.5 0z" />
    </svg>
  ),
  pencil: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  ),
  microphone: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
  musicalNote: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
    </svg>
  ),
  film: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C2.496 19.5 1.5 18.389 1.5 17.25v-10.5C1.5 5.611 2.496 4.5 3.375 4.5h1.5m0 15h-1.5a1.125 1.125 0 01-1.125-1.125m0-13.5c0-.621.504-1.125 1.125-1.125m0 13.5c0 .621-.504 1.125-1.125 1.125m0-13.5h17.25m-17.25 0a1.125 1.125 0 00-1.125 1.125M20.625 4.5h1.5c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125h-1.5m0-13.5h1.5c.621 0 1.125.504 1.125 1.125m-1.125-1.125v13.5c0 .621-.504 1.125-1.125 1.125m0-13.5v13.5m0-13.5a1.125 1.125 0 011.125-1.125M20.625 4.5a1.125 1.125 0 00-1.125 1.125M20.625 19.5h-1.5m1.5 0a1.125 1.125 0 001.125-1.125m-17.25 0h17.25M7.5 4.5v15M12 4.5v15m4.5-15v15" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
}

const sceneIcons: Record<SceneType, React.ReactNode> = {
  product: Icons.shoppingCart,
  funny: Icons.comedy,
  ip: Icons.clapperboard,
  vlog: Icons.camera,
}

export default function Home() {
  const [selectedScene, setSelectedScene] = useState<SceneType | null>(null)

  return (
    <main className="min-h-screen bg-dark-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* 背景效果 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-secondary-500/10 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-secondary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cta-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16">
          {/* Logo & Title */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="gradient-text">WhyFire</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 font-medium">
              AI Rap 视频一键生成器
            </p>
            <p className="text-gray-500 max-w-md mx-auto">
              输入信息，AI 写词，AI 配乐，一键出片。让你的创意在 60 秒内变成爆款短视频。
            </p>
          </div>

          {/* 场景选择 */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-medium text-center mb-8 text-gray-400">
              你想做什么类型的视频？
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {SCENE_CONFIGS.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => setSelectedScene(scene.id)}
                  className={`
                    group relative p-6 rounded-2xl border transition-all cursor-pointer
                    ${selectedScene === scene.id
                      ? 'border-cta-500 bg-cta-500/10 shadow-glow'
                      : 'border-dark-600 bg-dark-800/50 hover:border-dark-500 hover:bg-dark-700/50'
                    }
                  `}
                >
                  <div className={`
                    mb-4 transition-colors
                    ${selectedScene === scene.id ? 'text-cta-500' : 'text-gray-400 group-hover:text-secondary-400'}
                  `}>
                    {sceneIcons[scene.id]}
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-left">
                    {scene.name}
                  </h3>
                  <p className="text-xs text-gray-500 text-left">
                    {scene.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          {selectedScene && (
            <div className="mt-12 text-center animate-fade-in">
              <Link
                href={`/create?scene=${selectedScene}`}
                className="inline-flex items-center gap-3 btn-cta px-10 py-4 rounded-full text-lg font-semibold text-white pulse-glow"
              >
                开始创作
                {Icons.arrowRight}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 流程说明 */}
      <section className="border-t border-dark-700/50 bg-dark-800/30">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-lg font-medium text-center mb-12 text-gray-400">
            只需 4 步，生成你的 Rap 视频
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: 1, icon: Icons.pencil, title: '输入信息', desc: '填写产品/主题信息', color: 'text-secondary-400' },
              { step: 2, icon: Icons.microphone, title: 'AI 写词', desc: '自动生成 Rap 歌词', color: 'text-purple-400' },
              { step: 3, icon: Icons.musicalNote, title: 'AI 配乐', desc: '生成原创 Rap 音乐', color: 'text-pink-400' },
              { step: 4, icon: Icons.film, title: '一键出片', desc: '合成成品视频', color: 'text-cta-400' },
            ].map((item, index) => (
              <div
                key={item.step}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className={`
                  w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
                  bg-dark-700 border border-dark-600
                  ${item.color}
                `}>
                  {item.icon}
                </div>
                <div className="font-semibold text-white mb-1">{item.title}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700/50 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>WhyFire © 2026 — AI Rap 视频一键生成器</p>
        </div>
      </footer>
    </main>
  )
}
