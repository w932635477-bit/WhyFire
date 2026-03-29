'use client'

import Link from 'next/link'
import { Step1Upload } from './step-1-upload'
import { Step2DialectLyrics } from './step-2-dialect-lyrics'
import { Step3Preview } from './step-3-preview'
import { CoverProvider, useCoverContext } from './cover-context'

const stepMeta = [
  { id: 1, label: '上传' },
  { id: 2, label: '方言歌词' },
  { id: 3, label: '预览生成' },
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

  const currentMeta = stepMeta[state.currentStep - 1]

  const showBottomBar =
    state.currentStep > 1 &&
    !(state.currentStep === 3 && state.result.status !== 'idle')

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* ── Top Nav Bar ── */}
      <header className="fixed top-0 inset-x-0 z-40 bg-black/70 backdrop-blur-[40px] rounded-b-2xl">
        <div className="max-w-[640px] mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: back + title */}
          <Link
            href="/sonic-gallery"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[15px] font-extrabold tracking-tighter text-white">方言回响</span>
          </Link>

          {/* Center: step indicator bar */}
          <div className="flex items-center gap-2 flex-1 mx-6">
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#10B981] shrink-0" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-white whitespace-nowrap">
              Step {state.currentStep}/3
            </span>
            <span className="h-px flex-grow bg-[#2a2a2a]" />
            <span className="text-[12px] text-white/30 uppercase tracking-widest whitespace-nowrap">
              {currentMeta.label}
            </span>
          </div>

          {/* Right: W logo */}
          <div className="w-5 h-5 rounded bg-white flex items-center justify-center shrink-0">
            <span className="text-black text-[9px] font-black leading-none">W</span>
          </div>
        </div>
      </header>

      {/* ── Content Area ── */}
      <main className="max-w-[640px] mx-auto px-6 pt-24 pb-32">
        <div className="animate-fade-in">{renderStep()}</div>
      </main>

      {/* ── Bottom Action Bar ── */}
      {showBottomBar && (
        <footer className="fixed bottom-0 inset-x-0 z-40 bg-black/70 backdrop-blur-[40px] rounded-t-[32px] shadow-2xl">
          <div className="max-w-[640px] mx-auto px-6 py-5 flex items-center justify-between">
            {/* Previous */}
            <button
              onClick={() => goToStep(state.currentStep - 1)}
              className="inline-flex items-center gap-1.5 bg-[#1C1C1E] text-white rounded-full px-8 py-3 text-[13px] font-semibold transition-all active:scale-[0.97]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Previous
            </button>

            {/* Next */}
            <button
              onClick={() => goToStep(state.currentStep + 1)}
              disabled={!canProceedToStep(state.currentStep + 1)}
              className={`inline-flex items-center gap-1.5 rounded-full px-12 py-3 text-[13px] font-semibold transition-all active:scale-[0.97] ${
                canProceedToStep(state.currentStep + 1)
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white shadow-[0_8px_32px_rgba(139,92,246,0.3)]'
                  : 'bg-white/10 text-white/20 cursor-not-allowed'
              }`}
            >
              下一步
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
