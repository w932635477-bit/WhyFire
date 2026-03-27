'use client'

import { useState } from 'react'
import { useCreateContext } from './create-context'
import { generateLyrics, ApiError } from '@/lib/services/create-api'

interface Step3LyricsGenerationProps {
  onNext: () => void
  onPrev: () => void
}

// 热点话题数据
const hotTopics = [
  { id: 'topic-1', name: '二月初二龙抬头', category: '节日', hot: true },
  { id: 'topic-2', name: '996工作制', category: '社会', hot: true },
  { id: 'topic-3', name: '春暖花开', category: '季节', hot: false },
  { id: 'topic-4', name: 'AI改变生活', category: '科技', hot: true },
  { id: 'topic-5', name: '遥遥领先', category: '热梗', hot: true },
  { id: 'topic-6', name: '绝绝子', category: '热梗', hot: false },
  { id: 'topic-7', name: '泰酷辣', category: '热梗', hot: false },
  { id: 'topic-8', name: 'yyds', category: '热梗', hot: true },
]

// 热梗快捷选择
const popularMemes = ['yyds', '绝绝子', '遥遥领先', '泰酷辣', '栓Q', '芭比Q了', '摆烂', '内卷']

export function Step3LyricsGeneration({ onNext, onPrev }: Step3LyricsGenerationProps) {
  const { state, setSelfDescription, setTopics, setMemes, setLyrics } = useCreateContext()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLyrics, setEditedLyrics] = useState(state.lyrics.generatedLyrics)
  const [error, setError] = useState<string | null>(null)
  const [showTopics, setShowTopics] = useState(false)

  const toggleTopic = (topicId: string) => {
    setTopics(
      state.lyrics.selectedTopics.includes(topicId)
        ? state.lyrics.selectedTopics.filter(id => id !== topicId)
        : [...state.lyrics.selectedTopics, topicId]
    )
  }

  const toggleMeme = (meme: string) => {
    setMemes(
      state.lyrics.selectedMemes.includes(meme)
        ? state.lyrics.selectedMemes.filter(m => m !== meme)
        : [...state.lyrics.selectedMemes, meme]
    )
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateLyrics({
        scene: 'funny',
        dialect: state.dialect.selected,
        selfDescription: state.lyrics.selfDescription,
        selectedTopics: state.lyrics.selectedTopics,
        selectedMemes: state.lyrics.selectedMemes,
        bgmId: state.beat.selected || undefined,
        timeOptions: {
          includeFestival: true,
          includeTrending: true,
          includeMemes: state.lyrics.selectedMemes.length > 0,
        },
      })

      setLyrics(result.content)
      setEditedLyrics(result.content)
    } catch (err) {
      console.error('歌词生成失败:', err)
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('歌词生成失败，请稍后重试')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveEdit = () => {
    setLyrics(editedLyrics)
    setIsEditing(false)
  }

  const canProceed = state.lyrics.generatedLyrics.length > 0

  return (
    <div className="space-y-6">
      {/* Header - 简洁 */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1 font-sans">
          创作你的专属歌词
        </h2>
        <p className="text-white/40 text-sm font-sans">
          描述你自己，AI 会为你生成独一无二的方言 Rap 歌词
        </p>
      </div>

      {/* 自我描述输入 */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-violet-400 text-lg">person</span>
          <span className="text-white font-medium text-sm font-sans">自我描述</span>
          <span className="text-white/30 text-xs">职业、爱好、想吐槽的...</span>
        </div>
        <textarea
          value={state.lyrics.selfDescription}
          onChange={(e) => setSelfDescription(e.target.value)}
          placeholder="例如：程序员，喜欢打游戏，最近在减肥，想吐槽一下加班生活..."
          className="w-full h-24 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-white/80 text-sm resize-none focus:outline-none focus:border-violet-500/30 placeholder:text-white/20 font-sans"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-white/30 text-xs font-sans">越具体，歌词越有个性</span>
          <span className="text-white/25 text-xs font-mono">{state.lyrics.selfDescription.length}/200</span>
        </div>
      </div>

      {/* 可折叠的热点/热梗选择 */}
      <div>
        <button
          onClick={() => setShowTopics(!showTopics)}
          className="flex items-center gap-2 text-white/50 hover:text-white/70 text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-base">local_fire_department</span>
          <span className="font-sans">热点话题 & 流行梗</span>
          <span className="text-white/25 text-xs">（可选）</span>
          {(state.lyrics.selectedTopics.length + state.lyrics.selectedMemes.length) > 0 && (
            <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center">
              {state.lyrics.selectedTopics.length + state.lyrics.selectedMemes.length}
            </span>
          )}
          <span className={`material-symbols-outlined text-base transition-transform ${showTopics ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {showTopics && (
          <div className="mt-3 space-y-3 animate-fade-in">
            {/* 热点话题 */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-white/40 text-xs font-sans mb-2 block">热点话题</span>
              <div className="flex flex-wrap gap-2">
                {hotTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all font-sans ${
                      state.lyrics.selectedTopics.includes(topic.id)
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-white/[0.03] text-white/50 border border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {topic.hot && <span className="mr-1">🔥</span>}
                    {topic.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 流行梗 */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-white/40 text-xs font-sans mb-2 block">流行梗</span>
              <div className="flex flex-wrap gap-2">
                {popularMemes.map((meme) => (
                  <button
                    key={meme}
                    onClick={() => toggleMeme(meme)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all font-sans ${
                      state.lyrics.selectedMemes.includes(meme)
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/[0.03] text-white/50 border border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    #{meme}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 生成歌词按钮 - 始终可见 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full group relative overflow-hidden p-5 rounded-2xl border-2 border-dashed transition-all duration-300 btn-press ${
          isGenerating
            ? 'bg-violet-500/10 border-violet-500/30'
            : 'bg-white/[0.02] border-white/[0.1] hover:bg-white/[0.04] hover:border-violet-500/30'
        }`}
      >
        <div className="relative flex items-center justify-center gap-3">
          <span className={`material-symbols-outlined text-2xl ${isGenerating ? 'animate-spin text-violet-400' : 'text-violet-400'}`}>
            {isGenerating ? 'progress_activity' : 'auto_awesome'}
          </span>
          <span className="text-white font-semibold text-base font-sans">
            {isGenerating ? 'AI 正在创作中...' : '生成歌词'}
          </span>
        </div>
      </button>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-400 text-base">error</span>
          <p className="text-red-400 text-sm font-sans flex-1">{error}</p>
          <button onClick={handleGenerate} className="text-red-400/70 text-xs hover:text-red-400 font-sans">重试</button>
        </div>
      )}

      {/* 生成的歌词 - 紧跟生成按钮 */}
      {state.lyrics.generatedLyrics.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400 text-lg">lyrics</span>
              <span className="text-white font-medium text-sm font-sans">生成歌词</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-1.5 rounded-lg transition-all text-xs ${
                  isEditing ? 'bg-violet-500/20 text-violet-400' : 'bg-white/[0.03] text-white/40 hover:text-white/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">{isEditing ? 'check' : 'edit'}</span>
              </button>
              <button
                onClick={handleGenerate}
                className="p-1.5 rounded-lg bg-white/[0.03] text-white/40 hover:text-white/60 transition-all text-xs"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
              </button>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedLyrics}
                onChange={(e) => setEditedLyrics(e.target.value)}
                className="w-full h-60 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-white/80 text-sm resize-none focus:outline-none focus:border-violet-500/30 font-sans leading-relaxed"
              />
              <button
                onClick={handleSaveEdit}
                className="w-full py-2 bg-violet-500/20 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/30 transition-colors font-sans"
              >
                保存修改
              </button>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 h-60 overflow-y-auto">
              <pre className="text-white/70 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {state.lyrics.generatedLyrics}
              </pre>
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="material-symbols-outlined text-sm">music_note</span>
              约 30 秒
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="material-symbols-outlined text-sm">text_fields</span>
              {state.lyrics.generatedLyrics.length} 字
            </span>
          </div>
        </div>
      )}

      {/* 输入引导示例 - 歌词未生成时 */}
      {!state.lyrics.generatedLyrics && (
        <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-violet-400 text-sm">lightbulb</span>
            <span className="text-violet-400 text-xs font-medium font-sans">填写技巧</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-white/40 text-xs mb-0.5 font-sans">你填写：</p>
              <p className="text-white/50 text-xs italic font-sans">"程序员，喜欢打游戏，最近在减肥"</p>
            </div>
            <span className="material-symbols-outlined text-white/20 text-lg">arrow_forward</span>
            <div className="flex-1">
              <p className="text-white/40 text-xs mb-0.5 font-sans">生成歌词：</p>
              <p className="text-emerald-400/70 text-xs italic font-sans">"代码敲到凌晨三点半，减肥计划又拖延..."</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
