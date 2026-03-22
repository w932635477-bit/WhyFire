'use client'

import { useState } from 'react'
import { Step1VoiceCloning } from './step-1-voice-cloning'
import { Step2BeatDialect } from './step-2-beat-dialect'
import { Step3LyricsGeneration } from './step-3-lyrics-generation'
import { Step4Preview } from './step-4-preview'

const steps = [
  { id: 1, title: '音色克隆', description: '建立你的数字身份' },
  { id: 2, title: '节奏方言', description: '选择声音灵魂' },
  { id: 3, title: '歌词创作', description: '生成个性化歌词' },
  { id: 4, title: '预览生成', description: '预览你的杰作' },
]

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState(1)

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

      {/* Step Indicator */}
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
              </button>
              {index < steps.length - 1 && (
                <div className="relative w-20 mx-3 h-[2px]">
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
      </div>

      {/* Step Content */}
      <div className="animate-fade-in">
        {renderStep()}
      </div>
    </div>
  )
}
