'use client'

import { useState } from 'react'

const myWorks = [
  { id: 1, name: '成都漂移', dialect: '四川话', date: '2024-03-20', duration: '3:24', status: 'published' },
  { id: 2, name: '粤夜未眠', dialect: '粤语', date: '2024-03-18', duration: '2:58', status: 'draft' },
  { id: 3, name: '东北故事', dialect: '东北话', date: '2024-03-15', duration: '4:12', status: 'published' },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('works')

  return (
    <div className="px-8 lg:px-16 py-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 pb-8 border-b border-white/[0.06]">
        {/* Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">W</span>
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
        </div>

        {/* Info */}
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-bold text-white mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            创作者
          </h1>
          <p className="text-white/40 text-sm mb-3 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            whyfire_user@email.com
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="text-center">
              <div className="text-white font-bold">12</div>
              <div className="text-white/30 text-xs">作品</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-white font-bold">1.2k</div>
              <div className="text-white/30 text-xs">播放</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-white font-bold">128</div>
              <div className="text-white/30 text-xs">积分</div>
            </div>
          </div>
        </div>

        {/* Settings Button */}
        <button className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'works', label: '我的作品', icon: 'library_music' },
          { id: 'favorites', label: '收藏', icon: 'favorite' },
          { id: 'history', label: '历史', icon: 'history' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
              activeTab === tab.id
                ? 'bg-white text-black'
                : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/70'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'works' && (
        <div className="space-y-3">
          {myWorks.map((work) => (
            <div
              key={work.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all group"
            >
              {/* Cover */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white/40 text-xl">
                  music_note
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif] truncate">
                    {work.name}
                  </h3>
                  {work.status === 'draft' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                      草稿
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">
                    {work.dialect}
                  </span>
                  <span>{work.duration}</span>
                  <span>{work.date}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 rounded-lg bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.1] transition-all">
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                </button>
                <button className="p-2 rounded-lg bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.1] transition-all">
                  <span className="material-symbols-outlined text-lg">more_horiz</span>
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {myWorks.length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-white/20 text-5xl mb-4 block">
                library_music
              </span>
              <p className="text-white/40 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                还没有作品，开始创作吧
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-white/20 text-5xl mb-4 block">
            favorite
          </span>
          <p className="text-white/40 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            还没有收藏，去发现喜欢的节奏吧
          </p>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-white/20 text-5xl mb-4 block">
            history
          </span>
          <p className="text-white/40 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            暂无历史记录
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-10 grid grid-cols-2 gap-4">
        <button className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all text-left">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-violet-400">account_balance_wallet</span>
          </div>
          <div>
            <div className="text-white font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">积分中心</div>
            <div className="text-white/40 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">128 积分可用</div>
          </div>
        </button>
        <button className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all text-left">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400">card_membership</span>
          </div>
          <div>
            <div className="text-white font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">会员订阅</div>
            <div className="text-white/40 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">升级享更多权益</div>
          </div>
        </button>
      </div>
    </div>
  )
}
