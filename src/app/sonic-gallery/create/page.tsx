'use client'

import { useState, useEffect } from 'react'
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

// 欢迎引导弹窗组件
function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative max-w-lg w-full bg-[#0f0f0f] border border-white/[0.08] rounded-3xl p-8 animate-fade-in">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎤</div>
          <h2 className="text-2xl font-bold text-white mb-2 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            欢迎使用方言回响
          </h2>
          <p className="text-white/50 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            用你自己的声音，创作独一无二的方言 Rap
          </p>
        </div>

        {/* 流程预览 */}
        <div className="space-y-3 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-violet-400 text-lg">
                  {step.icon}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    {index + 1}. {step.title}
                  </span>
                  <span className="text-white/40 text-xs">{step.time}</span>
                </div>
                <span className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  {step.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 时间预估 */}
        <div className="text-center mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <div className="flex items-center justify-center gap-2 text-violet-400">
            <span className="material-symbols-outlined text-lg">schedule</span>
            <span className="font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              整个流程约 5 分钟完成
            </span>
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-violet-500 to-emerald-500 text-white py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity font-['PingFang_SC','Noto_Sans_SC',sans-serif] flex items-center justify-center gap-2"
        >
          开始创作
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </button>

        {/* 提示 */}
        <p className="text-center text-white/30 text-xs mt-4 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          💡 中间步骤可以随时返回修改，只有最终导出才计入使用次数
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

        {/* Step Indicator with Time Estimate */}
        <div className="mb-16">
          <div className="flex items-center justify-center max-w-xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  className={`flex flex-col items-center group ${
                    step.id < currentStep ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      currentStep === step.id
                        ? 'bg-gradient-to-br from-violet-500 to-emerald-500 text-white shadow-lg shadow-violet-500/30 scale-110'
                        : currentStep > step.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/[0.05] text-white/30 border border-white/[0.1]'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <span className="material-symbols-outlined text-lg">
                        check
                      </span>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`text-xs mt-3 font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif] transition-colors duration-300 ${
                    currentStep >= step.id ? 'text-white' : 'text-white/30'
                  }`}>
                    {step.title}
                  </span>
                  {currentStep === step.id && (
                    <span className="text-violet-400 text-[10px] mt-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                      {step.time}
                    </span>
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div className="relative w-16 mx-2 h-[2px]">
                    <div className="absolute inset-0 bg-white/[0.1]" />
                    <div
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500`}
                      style={{ width: currentStep > step.id ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 剩余时间提示 */}
          <div className="text-center mt-4">
            <span className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
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
