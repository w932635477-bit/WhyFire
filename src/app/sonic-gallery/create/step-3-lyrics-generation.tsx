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
      // 调用实际 API
      const result = await generateLyrics({
        scene: 'funny',
        dialect: state.dialect.selected as any,
        selfDescription: state.lyrics.selfDescription,
        selectedTopics: state.lyrics.selectedTopics,
        selectedMemes: state.lyrics.selectedMemes,
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
    setTimeout(() => {
      // 这里应该调用 API 生成歌词
      const newLyrics = `(前奏)

老铁们看过来，这产品真带劲
遥遥领先的技术，用完都说行
不管你是啥身份，咱都能搞定
一键生成方言Rap，听完好心情

(副歌)
川渝的调调，带你去飘摇
东北的味儿，老铁杠杠滴
粤语的韵脚，听着真带感
普通话的标准，全国都传遍

(尾奏)
这就是咱们的方言Rap
独特的韵味，你值得拥有`
      setLyrics(newLyrics)
      setEditedLyrics(newLyrics)
      setIsGenerating(false)
    }, 2000)
  }

  const handleSaveEdit = () => {
    setLyrics(editedLyrics)
    setIsEditing(false)
  }

  // 检查是否可以进入下一步
  const canProceed = state.lyrics.generatedLyrics.length > 0

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-purple-400 text-sm font-medium tracking-wider uppercase mb-3 block">
          步骤三
        </span>
        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          创作你的专属歌词
        </h2>
        <p className="text-white/40 text-base leading-relaxed font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          告诉我们你是谁，想表达什么，AI 会为你生成独一无二的方言 Rap 歌词
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Input */}
        <div className="lg:col-span-5 space-y-6">
          {/* Self Description */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-violet-400 text-xl">
                  person
                </span>
              </div>
              <div>
                <h3 className="text-white font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  自我描述
                </h3>
                <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  职业、爱好、想说的...
                </p>
              </div>
            </div>
            <textarea
              value={state.lyrics.selfDescription}
              onChange={(e) => setSelfDescription(e.target.value)}
              placeholder="例如：程序员，喜欢打游戏，最近在减肥，想吐槽一下加班生活..."
              className="w-full h-32 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-white/80 text-sm resize-none focus:outline-none focus:border-violet-500/30 placeholder:text-white/20 font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
            />
            <div className="flex items-center justify-between mt-3 text-xs text-white/30">
              <span>越具体，生成的歌词越有个性</span>
              <span>{state.lyrics.selfDescription.length}/200</span>
            </div>

            {/* 输入引导示例 */}
            <div className="mt-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-violet-400 text-sm">lightbulb</span>
                <span className="text-violet-400 text-xs font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  填写技巧
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-white/40 text-xs mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">你填写：</p>
                  <p className="text-white/60 text-xs italic font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    "程序员，喜欢打游戏，最近在减肥"
                  </p>
                </div>
                <span className="material-symbols-outlined text-white/20 text-lg">arrow_forward</span>
                <div className="flex-1">
                  <p className="text-white/40 text-xs mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">生成歌词：</p>
                  <p className="text-emerald-400/80 text-xs italic font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    "代码敲到凌晨三点半，减肥计划又拖延..."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hot Topics */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-400 text-xl">
                    local_fire_department
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    热点话题
                  </h3>
                  <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    选择话题蹭热度
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
                实时热搜
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
                    state.lyrics.selectedTopics.includes(topic.id)
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-white/[0.03] text-white/50 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/70'
                  }`}
                >
                  {topic.hot && <span className="mr-1">🔥</span>}
                  {topic.name}
                </button>
              ))}
            </div>
          </div>

          {/* Popular Memes */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-400 text-xl">
                  sentiment_very_satisfied
                </span>
              </div>
              <div>
                <h3 className="text-white font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  流行梗
                </h3>
                <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  点选加入歌词
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularMemes.map((meme) => (
                <button
                  key={meme}
                  onClick={() => toggleMeme(meme)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
                    state.lyrics.selectedMemes.includes(meme)
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/[0.03] text-white/50 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/70'
                  }`}
                >
                  #{meme}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Lyrics Output */}
        <div className="lg:col-span-7 space-y-6">
          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-emerald-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-violet-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="relative flex items-center justify-center gap-3">
              <span className={`material-symbols-outlined text-2xl ${isGenerating ? 'animate-spin' : 'text-violet-400'}`}>
                {isGenerating ? 'progress_activity' : 'auto_awesome'}
              </span>
              <span className="text-white font-semibold text-lg font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                {isGenerating ? 'AI 正在创作中...' : '生成歌词'}
              </span>
            </div>
          </button>

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-400 text-lg">error</span>
              <div className="flex-1">
                <p className="text-red-400 text-sm font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  {error}
                </p>
                <button
                  onClick={handleGenerate}
                  className="text-red-400/70 text-xs mt-2 hover:text-red-400 transition-colors font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
                >
                  点击重试
                </button>
              </div>
            </div>
          )}

          {/* Lyrics Display/Edit */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/60 text-xl">
                    lyrics
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    生成歌词
                  </h3>
                  <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    可编辑修改
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-lg transition-all ${
                    isEditing
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-white/[0.03] text-white/40 hover:text-white/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{isEditing ? 'check' : 'edit'}</span>
                </button>
                <button
                  onClick={handleGenerate}
                  className="p-2 rounded-lg bg-white/[0.03] text-white/40 hover:text-white/60 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editedLyrics}
                  onChange={(e) => setEditedLyrics(e.target.value)}
                  className="w-full h-80 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-white/80 text-sm resize-none focus:outline-none focus:border-violet-500/30 font-['PingFang_SC','Noto_Sans_SC',sans-serif] leading-relaxed"
                />
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-2 bg-violet-500/20 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/30 transition-colors font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
                >
                  保存修改
                </button>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 h-80 overflow-y-auto">
                <pre className="text-white/70 text-sm whitespace-pre-wrap font-['PingFang_SC','Noto_Sans_SC',sans-serif] leading-relaxed">
                  {state.lyrics.generatedLyrics || '点击上方「生成歌词」按钮开始创作...'}
                </pre>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.04]">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="material-symbols-outlined text-base">music_note</span>
                <span>约 30 秒</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="material-symbols-outlined text-base">text_fields</span>
                <span>{state.lyrics.generatedLyrics.length} 字</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="material-symbols-outlined text-base">format_list_numbered</span>
                <span>4 段落</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-end pt-6 border-t border-white/[0.04]">
        <div>
          <button
            onClick={onPrev}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white/60 hover:text-white hover:bg-white/[0.03] transition-all font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            上一步
          </button>
        </div>
        {/* 下一步预览 */}
        <div className="hidden md:block text-right">
          <p className="text-white/30 text-xs mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">下一步</p>
          <div className="flex items-center justify-end gap-2">
            <span className="text-white/50 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              生成你的方言 Rap，听到自己的声音！
            </span>
            <span className="material-symbols-outlined text-emerald-400 text-lg">play_circle</span>
          </div>
        </div>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`group inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 active:scale-95 font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
            canProceed
              ? 'bg-white text-black hover:shadow-lg hover:shadow-white/20'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {canProceed ? '下一步：生成音乐' : '请先生成歌词'}
          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  )
}
