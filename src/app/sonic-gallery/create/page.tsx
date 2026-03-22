'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Step1VoiceCloning } from './step-1-voice-cloning'
import { Step2BeatDialect } from './step-2-beat-dialect'
import { Step3LyricsGeneration } from './step-3-lyrics-generation'
import { Step4Preview } from './step-4-preview'

const steps = [
  { id: 1, title: '音色克隆', description: '建立你的数字身份', time: '1-2分钟', icon: 'mic' },
  { id: 2, title: '节奏方言', description: '选择声音灵魂', time: '30秒', icon: 'graphic_eq' },
  { id: 3, title: '歌词创作', description: '生成个性化歌词', time: '1分钟', icon: 'lyrics' },
  { id: 4, title: '预览生成', description: '预览你的杰作', time: '2分钟', icon: 'play_circle' },
]

// 欢迎引导弹窗组件 - Apple Style Refined
function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative max-w-md w-full bg-[#0f0f0f] border border-white/[0.08] rounded-2xl p-8 animate-fade-in">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.1] transition-all"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-white/80 text-2xl">mic</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            欢迎使用方言回响
          </h2>
          <p className="text-white/40 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            用你自己的声音，创作独一无二的方言 Rap
          </p>
        </div>

        {/* 流程预览 */}
        <div className="space-y-2 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                <span className="text-white/50 text-xs font-medium">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    {step.title}
                  </span>
                  <span className="text-white/30 text-xs">{step.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 时间预估 */}
        <div className="text-center mb-6 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-center gap-2 text-white/50">
            <span className="material-symbols-outlined text-base">schedule</span>
            <span className="text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              整个流程约 5 分钟完成
            </span>
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={onClose}
          className="w-full bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors font-['PingFang_SC','Noto_Sans_SC',sans-serif] flex items-center justify-center gap-2"
        >
          开始创作
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>

        {/* 提示 */}
        <p className="text-center text-white/25 text-xs mt-4 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          中间步骤可以随时返回修改，只有最终导出才计入使用次数
        </p>
      </div>
    </div>
  )
}

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showWelcome, setShowWelcome] = useState(false)

  // 检查是否首次使用
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('dialect-rap-welcome-seen')
    if (!hasSeenWelcome) {
      setShowWelcome(true)
    }
  }, [])

  const handleCloseWelcome = () => {
    setShowWelcome(false)
    localStorage.setItem('dialect-rap-welcome-seen', 'true')
  }

  // 计算已用时间和剩余时间
  const getRemainingTime = () => {
    const times = ['1-2分钟', '30秒', '1分钟', '2分钟']
    if (currentStep === 1) return '约 5 分钟'
    if (currentStep === 2) return '约 3-4 分钟'
    if (currentStep === 3) return '约 3 分钟'
    return '约 2 分钟'
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1VoiceCloning onNext={() => setCurrentStep(2)} />
      case 2:
        return (
          <Step2BeatDialect
            onNext={() => setCurrentStep(3)}
            onPrev={() => setCurrentStep(1)}
          />
        )
      case 3:
        return (
          <Step3LyricsGeneration
            onNext={() => setCurrentStep(4)}
            onPrev={() => setCurrentStep(2)}
          />
        )
      case 4:
        return <Step4Preview onPrev={() => setCurrentStep(3)} />
      default:
        return null
    }
  }

  return (
    <>
      {/* 欢迎引导弹窗 */}
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}

      {/* 顶部导航栏 - Logo + 返回按钮 */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-8 lg:px-16 py-4">
          <div className="flex items-center justify-between">
            {/* 返回按钮 */}
            <Link
              href="/sonic-gallery"
              className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span className="text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">返回首页</span>
            </Link>

            {/* Logo */}
            <Link href="/sonic-gallery" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-semibold text-lg block font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  方言回响
                </span>
                <span className="text-white/30 text-xs">WhyFire Studio</span>
              </div>
            </Link>

            {/* 右侧占位 - 保持布局平衡 */}
            <div className="w-24 hidden sm:block" />
          </div>
        </div>
      </header>

      <div className="px-8 lg:px-16 py-12 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <span className="text-violet-400 text-sm font-medium tracking-wider uppercase mb-3 block">
            创作工坊
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            创作你的方言说唱
          </h1>
        </div>

        {/* Step Indicator - Apple Style Refined */}
        <div className="mb-12">
          <div className="flex items-center justify-center max-w-lg mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  className={`flex flex-col items-center group ${
                    step.id < currentStep ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      currentStep === step.id
                        ? 'bg-white text-black'
                        : currentStep > step.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/[0.03] text-white/30 border border-white/[0.08]'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <span className="material-symbols-outlined text-base">check</span>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif] transition-colors duration-300 ${
                    currentStep >= step.id ? 'text-white/70' : 'text-white/30'
                  }`}>
                    {step.title}
                  </span>
                  {currentStep === step.id && (
                    <span className="text-white/40 text-[10px] mt-0.5 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                      {step.time}
                    </span>
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div className="relative w-12 mx-1.5 h-px">
                    <div className="absolute inset-0 bg-white/[0.08]" />
                    <div
                      className="absolute inset-y-0 left-0 bg-white/40 transition-all duration-300"
                      style={{ width: currentStep > step.id ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 剩余时间提示 */}
          <div className="text-center mt-3">
            <span className="text-white/25 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              预计剩余时间：{getRemainingTime()}
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="animate-fade-in">
          {renderStep()}
        </div>
      </div>
    </>
  )
}
