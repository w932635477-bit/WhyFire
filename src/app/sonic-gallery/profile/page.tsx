'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useCredits } from '@/lib/hooks/use-credits'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuthContext()
  const { credits, loading: creditsLoading } = useCredits()
  const [activeTab, setActiveTab] = useState('works')

  // Real data: loading state comes from auth + credits hooks
  const isLoading = authLoading || creditsLoading

  const displayName = profile?.display_name || user?.email?.split('@')[0] || '创作者'
  const avatarLetter = displayName[0].toUpperCase()
  const balance = credits?.balance ?? 0

  return (
    <div className="px-8 lg:px-16 py-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 pb-8 border-b border-white/[0.06]">
        {/* Avatar */}
        <div className="relative">
          {isLoading ? (
            <Skeleton variant="rounded" width={96} height={96} className="rounded-2xl" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">{avatarLetter}</span>
            </div>
          )}
          {!isLoading && (
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          )}
        </div>

        {/* Info */}
        <div className="text-center sm:text-left flex-1">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton width="120px" height={24} className="mx-auto sm:mx-0" />
              <Skeleton width="180px" height={14} className="mx-auto sm:mx-0" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                {displayName}
              </h1>
              <p className="text-white/40 text-sm mb-3 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                {user?.email || ''}
              </p>
            </>
          )}
          <div className="flex items-center justify-center sm:justify-start gap-4">
            {isLoading ? (
              <>
                <Skeleton variant="rounded" width={48} height={32} />
                <Skeleton width="1px" height={32} />
                <Skeleton variant="rounded" width={48} height={32} />
                <Skeleton width="1px" height={32} />
                <Skeleton variant="rounded" width={48} height={32} />
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-white font-bold">0</div>
                  <div className="text-white/30 text-xs">作品</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-white font-bold">0</div>
                  <div className="text-white/30 text-xs">播放</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-white font-bold">{creditsLoading ? '...' : balance}</div>
                  <div className="text-white/30 text-xs">积分</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Settings Button */}
        {!isLoading && (
          <button className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
        )}
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
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
              activeTab === tab.id
                ? 'bg-white text-black'
                : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/70'
            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <>
          {activeTab === 'works' && (
            <div className="space-y-3">
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-white/20 text-5xl mb-4 block">
                  library_music
                </span>
                <p className="text-white/40 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  还没有作品，开始创作吧
                </p>
                <Link
                  href="/sonic-gallery/cover"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#10B981] text-white text-[13px] font-semibold"
                >
                  开始翻唱
                </Link>
              </div>
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
        </>
      )}

      {/* Quick Actions */}
      {!isLoading && (
        <div className="mt-10 grid grid-cols-2 gap-4">
          <Link
            href="/sonic-gallery/pricing"
            className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-violet-400">account_balance_wallet</span>
            </div>
            <div>
              <div className="text-white font-medium text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">积分中心</div>
              <div className="text-white/40 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">{creditsLoading ? '...' : `${balance} 积分可用`}</div>
            </div>
          </Link>
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
      )}
    </div>
  )
}
