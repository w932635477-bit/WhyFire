'use client'

import Link from 'next/link'
import { Step1Upload } from './step-1-upload'
import { Step2DialectLyrics } from './step-2-dialect-lyrics'
import { Step3Preview } from './step-3-preview'
import { CoverProvider, useCoverContext } from './cover-context'

const steps = [
  { id: 1, title: '上传' },
  { id: 2, title: '方言' },
  { id: 3, title: '生成' },
]

export default function CoverPage() {
  return (
    <CoverProvider>
      <CoverPageContent />
    </CoverProvider>
  )
}

function CoverPageContent() {
  const { state, goToStep } = useCoverContext()

  const canProceedToStep = (step: number): boolean => {
    if (step === 2) return state.song.uploadStatus === 'completed' && !!state.song.url
    if (step === 3) return true
    return step <= state.currentStep
  }

  const renderStep = () => {
    switch (state.currentStep) {
      case 1: return <Step1Upload onNext={() => goToStep(2)} />
      case 2: return <Step2DialectLyrics onNext={() => goToStep(3)} onPrev={() => goToStep(1)} />
      case 3: return <Step3Preview onPrev={() => goToStep(2)} />
      default: return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[640px] mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/sonic-gallery" className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>

          {/* Step dots — minimal Apple style */}
          <div className="flex items-center gap-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => canProceedToStep(step.id) && goToStep(step.id)}
                className="flex items-center gap-1.5"
              >
                {state.currentStep > step.id ? (
                  <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                ) : (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-sans transition-colors ${
                    state.currentStep === step.id ? 'bg-white text-black' : 'bg-white/10 text-white/30'
                  }`}>{step.id}</div>
                )}
                <span className={`text-[11px] font-sans hidden sm:inline ${state.currentStep === step.id ? 'text-white font-medium' : 'text-white/25'}`}>{step.title}</span>
              </button>
            ))}
          </div>

          <div className="w-5 h-5 rounded bg-white flex items-center justify-center">
            <span className="text-black text-[9px] font-black">W</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-[640px] mx-auto px-6 py-12 sm:py-16 pb-32">
          <div className="animate-fade-in">{renderStep()}</div>
        </div>
      </main>

      {/* Bottom nav */}
      {state.currentStep > 1 && state.currentStep < 3 && state.result.status === 'idle' && (
        <footer className="fixed bottom-0 inset-x-0 z-40 bg-black/80 backdrop-blur-2xl border-t border-white/[0.04]">
          <div className="max-w-[640px] mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => goToStep(state.currentStep - 1)} className="text-white/30 hover:text-white/60 text-[13px] font-sans transition-colors">
              上一步
            </button>
            <button
              onClick={() => goToStep(state.currentStep + 1)}
              disabled={!canProceedToStep(state.currentStep + 1)}
              className={`inline-flex items-center gap-2 px-8 py-3 rounded-full text-[13px] font-semibold font-sans transition-all active:scale-[0.98] ${
                canProceedToStep(state.currentStep + 1)
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-white/10 text-white/20 cursor-not-allowed'
              }`}
            >
              下一步
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
