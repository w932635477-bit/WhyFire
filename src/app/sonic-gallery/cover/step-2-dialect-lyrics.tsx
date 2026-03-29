'use client'

import { useCoverContext, COVER_DIALECTS } from './cover-context'

const DIALECT_COLORS: Record<string, string> = {
  original: '#f97316', cantonese: '#f59e0b', sichuan: '#ef4444', dongbei: '#38bdf8',
  shaanxi: '#10b981', wu: '#8b5cf6', minnan: '#06b6d4', tianjin: '#ec4899', nanjing: '#a855f7',
}

export function Step2DialectLyrics({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { state, dispatch } = useCoverContext()

  return (
    <div className="space-y-12">
      {/* Dialect */}
      <div>
        <h2 className="text-[32px] font-bold tracking-[-0.02em] font-sans mb-2">选方言</h2>
        <p className="text-white/25 text-[14px] font-sans mb-8">决定翻唱的味道</p>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {COVER_DIALECTS.map((d) => {
            const selected = state.dialect.selected === d.id
            const color = DIALECT_COLORS[d.id] || '#fff'
            return (
              <button
                key={d.id}
                onClick={() => dispatch({ type: 'SET_DIALECT', dialect: d.id })}
                className={`relative py-5 rounded-2xl text-center transition-all duration-300 ${
                  selected ? 'bg-[#2C2C2E]' : 'bg-[#1C1C1E] hover:bg-[#2C2C2E]/60'
                }`}
              >
                {selected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: color }} />
                )}
                <span className={`text-[13px] font-semibold font-sans block ${selected ? 'text-white' : 'text-white/40'}`}>
                  {d.name}
                </span>
                <span className="text-white/15 text-[10px] font-sans mt-0.5 block">{d.region}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lyrics mode */}
      <div>
        <h3 className="text-[20px] font-semibold font-sans mb-2">歌词</h3>
        <p className="text-white/25 text-[13px] font-sans mb-6">选择歌词处理方式</p>

        {/* Apple segmented control */}
        <div className="flex p-1 bg-[#1C1C1E] rounded-xl mb-6">
          {[
            { id: 'original' as const, label: '保留原词' },
            { id: 'custom' as const, label: '自定义' },
            { id: 'ai-generate' as const, label: 'AI 创作' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => dispatch({ type: 'SET_LYRICS_MODE', mode: mode.id })}
              className={`flex-1 py-2.5 rounded-lg text-[12px] font-semibold font-sans transition-all duration-300 ${
                state.lyrics.mode === mode.id
                  ? 'bg-[#2C2C2E] text-white shadow-sm'
                  : 'text-white/25 hover:text-white/40'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {state.lyrics.mode === 'custom' && (
          <div className="space-y-2">
            <textarea
              value={state.lyrics.customLyrics}
              onChange={(e) => dispatch({ type: 'SET_CUSTOM_LYRICS', lyrics: e.target.value })}
              placeholder={"用方言写歌词...\n\n支持 [Verse]、[Chorus] 等标记"}
              rows={8}
              className="w-full bg-[#1C1C1E] border border-white/[0.06] rounded-2xl px-6 py-4 text-white text-[14px] leading-[1.7] placeholder:text-white/10 focus:outline-none focus:border-white/[0.15] resize-none transition-colors font-sans"
            />
            <p className="text-right text-white/10 text-[11px] font-sans">{state.lyrics.customLyrics.length} 字</p>
          </div>
        )}

        {state.lyrics.mode === 'ai-generate' && (
          <div className="space-y-4">
            <textarea
              value={state.lyrics.brandMessage}
              onChange={(e) => dispatch({ type: 'SET_BRAND_MESSAGE', message: e.target.value })}
              placeholder="输入品牌或产品信息，AI 据此生成方言歌词..."
              rows={4}
              className="w-full bg-[#1C1C1E] border border-white/[0.06] rounded-2xl px-6 py-4 text-white text-[14px] leading-[1.7] placeholder:text-white/10 focus:outline-none focus:border-white/[0.15] resize-none transition-colors font-sans"
            />
            <button
              onClick={async () => {
                if (!state.lyrics.brandMessage.trim()) return
                dispatch({ type: 'SET_LYRICS_GENERATING', isGenerating: true })
                try {
                  const res = await fetch('/api/lyrics/generate-v2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scene: 'funny', dialect: state.dialect.selected, selfDescription: state.lyrics.brandMessage }),
                  })
                  const data = await res.json()
                  if (data.code === 0 && data.data?.content) dispatch({ type: 'SET_GENERATED_LYRICS', lyrics: data.data.content })
                } catch {
                  dispatch({ type: 'SET_GENERATED_LYRICS', lyrics: state.lyrics.brandMessage })
                } finally {
                  dispatch({ type: 'SET_LYRICS_GENERATING', isGenerating: false })
                }
              }}
              disabled={!state.lyrics.brandMessage.trim() || state.lyrics.isGenerating}
              className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-[13px] font-sans disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              {state.lyrics.isGenerating ? (
                <><div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />生成中...</>
              ) : (
                'AI 生成歌词'
              )}
            </button>

            {state.lyrics.generatedLyrics && (
              <textarea
                value={state.lyrics.generatedLyrics}
                onChange={(e) => dispatch({ type: 'SET_GENERATED_LYRICS', lyrics: e.target.value })}
                rows={8}
                className="w-full bg-[#1C1C1E] border border-[#8b5cf6]/10 rounded-2xl px-6 py-4 text-white text-[14px] leading-[1.7] focus:outline-none focus:border-white/[0.15] resize-none transition-colors font-sans"
              />
            )}
          </div>
        )}
      </div>

      {/* Vocal gender */}
      <div>
        <h3 className="text-[20px] font-semibold font-sans mb-4">人声</h3>
        <div className="flex gap-3">
          {([
            { id: 'm' as const, label: '男声' },
            { id: 'f' as const, label: '女声' },
          ]).map((g) => (
            <button
              key={g.id}
              onClick={() => dispatch({ type: 'SET_VOCAL_GENDER', gender: g.id })}
              className={`flex-1 py-5 rounded-2xl text-center transition-all duration-300 font-sans ${
                state.vocalGender === g.id ? 'bg-[#2C2C2E] text-white' : 'bg-[#1C1C1E] text-white/30 hover:bg-[#2C2C2E]/60'
              }`}
            >
              <span className="text-[14px] font-semibold">{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full py-[18px] rounded-full bg-white text-black font-semibold text-[15px] font-sans flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
      >
        下一步
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  )
}
