'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Step1VoiceCloning } from './step-1-voice-cloning'
import { Step2BeatDialect } from './step-2-beat-dialect'
import { Step3LyricsGeneration } from './step-3-lyrics-generation'
import { Step4Preview } from './step-4-preview'
import { CreateProvider, useCreateContext } from './create-context'

const steps = [
  { id: 1, title: '音色克隆', description: '建立你的数字身份', time: '1-2分钟', icon: 'mic' },
  { id: 2, title: '节奏方言', description: '选择声音灵魂', time: '30秒', icon: 'graphic_eq' },
  { id: 3, title: '歌词创作', description: '生成个性化歌词', time: '1分钟', icon: 'lyrics' },
  { id: 4, title: '预览生成', description: '预览你的杰作', time: '2分钟', icon: 'play_circle' },
]

// Step 1 底栏 - 只有"下一步"
function Step1Footer() {
  const { state, goToStep } = useCreateContext()
  const hasAudio = state.voiceCloning.audioFile || state.voiceCloning.recordingBlob
  const cloningStatus = state.voiceCloning.cloningStatus
  const canProceed = hasAudio && (cloningStatus === 'completed' || cloningStatus === 'idle')

  return (
    <div className="flex justify-end">
      <button
        onClick={() => goToStep(2)}
        disabled={!canProceed}
        className={`group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 active:scale-95 min-h-[48px] btn-press ${
          canProceed
            ? 'bg-white text-black hover:shadow-lg hover:shadow-white/20'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        {canProceed ? '下一步' : '请先录制或上传音频'}
        <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </button>
    </div>
  )
}

// Step 2/3 通用底栏 - 上一步 + 下一步
function StepNavigationFooter({
  currentStep,
  onPrev,
  onNext,
  canProceed,
  nextDisabledText,
}: {
  currentStep: number
  onPrev: () => void
  onNext: () => void
  canProceed: boolean
  nextDisabledText?: string
}) {
  const nextHint = currentStep === 2 ? 'AI 帮你生成个性化歌词' : '生成你的方言 Rap'
  const nextHintIcon = currentStep === 2 ? 'lyrics' : 'play_circle'
  const nextHintColor = currentStep === 2 ? 'text-violet-400' : 'text-emerald-400'

  return (
    <div className="flex justify-between items-center">
      <button
        onClick={onPrev}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white/60 hover:text-white hover:bg-white/[0.03] transition-all min-h-[48px]"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        上一步
      </button>
      <div className="hidden md:block text-right mr-4">
        <p className="text-white/30 text-xs mb-1">下一步</p>
        <div className="flex items-center justify-end gap-2">
          <span className="text-white/50 text-sm">{nextHint}</span>
          <span className={`material-symbols-outlined text-lg ${nextHintColor}`}>{nextHintIcon}</span>
        </div>
      </div>
      <button
        onClick={onNext}
        disabled={!canProceed}
        className={`group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 active:scale-95 min-h-[48px] btn-press ${
          canProceed
            ? 'bg-white text-black hover:shadow-lg hover:shadow-white/20'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        下一步
        <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </button>
    </div>
  )
}

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
          <h2 className="text-xl font-semibold text-white mb-2 font-sans">
            欢迎使用方言回响
          </h2>
          <p className="text-white/40 text-sm font-sans">
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
                  <span className="text-white/80 text-sm font-medium font-sans">
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
            <span className="text-sm font-sans">
              整个流程约 5 分钟完成
            </span>
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={onClose}
          className="w-full bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors font-sans flex items-center justify-center gap-2"
        >
          开始创作
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>

        {/* 提示 */}
        <p className="text-center text-white/25 text-xs mt-4 font-sans">
          中间步骤可以随时返回修改，只有最终导出才计入使用次数
        </p>
      </div>
    </div>
  )
}

export default function CreatePage() {
  return (
    <CreateProvider>
      <CreatePageContent />
    </CreateProvider>
  )
}

function CreatePageContent() {
  const { state, goToStep } = useCreateContext()
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
    if (state.currentStep === 1) return '约 5 分钟'
    if (state.currentStep === 2) return '约 3-4 分钟'
    if (state.currentStep === 3) return '约 3 分钟'
    return '约 2 分钟'
  }

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <Step1VoiceCloning onNext={() => goToStep(2)} />
      case 2:
        return (
          <Step2BeatDialect
            onNext={() => goToStep(3)}
            onPrev={() => goToStep(1)}
          />
        )
      case 3:
        return (
          <Step3LyricsGeneration
            onNext={() => goToStep(4)}
            onPrev={() => goToStep(2)}
          />
        )
      case 4:
        return <Step4Preview onPrev={() => goToStep(3)} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 欢迎引导弹窗 */}
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}

      {/* 顶部导航栏 - Logo + 返回按钮 */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-16 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* 返回按钮 */}
            <Link
              href="/sonic-gallery"
              className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors min-h-[44px] min-w-[44px]"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span className="text-sm font-sans hidden sm:inline">返回首页</span>
            </Link>

            {/* Logo */}
            <Link href="/sonic-gallery" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-semibold text-lg block font-sans">
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

      {/* 步骤标签栏 - 紧凑头部 */}
      <div className="border-b border-white/[0.04] bg-[#0a0a0a]/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-16">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => step.id <= state.currentStep && goToStep(step.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  state.currentStep === step.id
                    ? 'bg-white/[0.08] text-white'
                    : step.id < state.currentStep
                    ? 'text-white/50 hover:text-white/70 hover:bg-white/[0.04] cursor-pointer'
                    : 'text-white/25 cursor-default'
                }`}
              >
                {state.currentStep > step.id ? (
                  <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
                ) : (
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    state.currentStep === step.id ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-white/30'
                  }`}>{step.id}</span>
                )}
                <span className="font-sans">{step.title}</span>
                {state.currentStep === step.id && (
                  <span className="text-white/30 text-xs hidden sm:inline">· {step.time}</span>
                )}
              </button>
            ))}
            {/* 右侧时间提示 */}
            <div className="ml-auto pl-4 flex-shrink-0 hidden md:flex items-center gap-1.5 text-white/25 text-xs">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span className="font-sans">剩余 {getRemainingTime()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 - 可滚动 */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-16 py-6 sm:py-8 pb-28 max-w-6xl mx-auto">
          {/* Step Content */}
          <div className="animate-fade-in">
            {renderStep()}
          </div>
        </div>
      </main>

      {/* 底部导航栏 - 统一在 page 层 */}
      <footer className="sticky bottom-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-16 py-4">
          {state.currentStep === 1 && (
            <Step1Footer />
          )}
          {(state.currentStep === 2 || state.currentStep === 3) && (
            <StepNavigationFooter
              currentStep={state.currentStep}
              onPrev={() => goToStep(state.currentStep - 1)}
              onNext={() => goToStep(state.currentStep + 1)}
              canProceed={state.currentStep === 2 ? true : (state.lyrics.generatedLyrics.length > 0)}
              nextDisabledText={state.currentStep === 3 ? '请先生成歌词' : undefined}
            />
          )}
        </div>
      </footer>
    </div>
  )
}
