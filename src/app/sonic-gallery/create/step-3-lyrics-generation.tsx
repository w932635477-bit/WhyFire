'use client'

import { useState } from 'react'

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
  const [selfDescription, setSelfDescription] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['topic-5'])
  const [selectedMemes, setSelectedMemes] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLyrics, setGeneratedLyrics] = useState(`(前奏)

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
独特的韵味，你值得拥有`)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLyrics, setEditedLyrics] = useState(generatedLyrics)

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    )
  }

  const toggleMeme = (meme: string) => {
    setSelectedMemes(prev =>
      prev.includes(meme)
        ? prev.filter(m => m !== meme)
        : [...prev, meme]
    )
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    // 模拟生成过程
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

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
              value={selfDescription}
              onChange={(e) => setSelfDescription(e.target.value)}
              placeholder="例如：程序员，喜欢打游戏，最近在减肥，想吐槽一下加班生活..."
              className="w-full h-32 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-white/80 text-sm resize-none focus:outline-none focus:border-violet-500/30 placeholder:text-white/20 font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
            />
            <div className="flex items-center justify-between mt-3 text-xs text-white/30">
              <span>越具体，生成的歌词越有个性</span>
              <span>{selfDescription.length}/200</span>
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
                    selectedTopics.includes(topic.id)
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
                    selectedMemes.includes(meme)
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
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button className="p-2 rounded-lg bg-white/[0.03] text-white/40 hover:text-white/60 transition-all">
                  <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedLyrics}
                onChange={(e) => setEditedLyrics(e.target.value)}
                className="w-full h-80 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-white/80 text-sm resize-none focus:outline-none focus:border-violet-500/30 font-['PingFang_SC','Noto_Sans_SC',sans-serif] leading-relaxed"
              />
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 h-80 overflow-y-auto">
                <pre className="text-white/70 text-sm whitespace-pre-wrap font-['PingFang_SC','Noto_Sans_SC',sans-serif] leading-relaxed">
                  {generatedLyrics}
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
                <span>{generatedLyrics.length} 字</span>
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
      <div className="flex justify-between pt-6 border-t border-white/[0.04]">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white/60 hover:text-white hover:bg-white/[0.03] transition-all font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          上一步
        </button>
        <button
          onClick={onNext}
          className="group inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-semibold text-base hover:shadow-lg hover:shadow-white/20 transition-all duration-300 active:scale-95 font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
        >
          下一步：生成音乐
          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  )
}
