'use client'

import { useState } from 'react'

interface BottomNavBarProps {
  trackName?: string
  trackArtist?: string
  coverUrl?: string
  isPlaying?: boolean
  onPlayPause?: () => void
}

export function BottomNavBar({
  trackName = '等待上传',
  trackArtist = '即将播放',
  coverUrl,
  isPlaying = false,
  onPlayPause,
}: BottomNavBarProps) {
  const [volume, setVolume] = useState(0.66)
  const [progress, setProgress] = useState(0.35)

  return (
    <footer className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-18rem)] h-24 bg-[#0a0a0a]/80 backdrop-blur-2xl border-t border-white/[0.06] flex items-center justify-between px-6 lg:px-10 z-50">
      {/* Track Info */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 overflow-hidden flex items-center justify-center group flex-shrink-0">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt="专辑封面"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-white/40 text-2xl group-hover:scale-110 transition-transform duration-300">
              music_note
            </span>
          )}
          {/* Playing Animation */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-white rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white font-medium text-sm tracking-tight truncate font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            {trackName}
          </span>
          <span className="text-white/40 text-xs truncate font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            {trackArtist}
          </span>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-md mx-4">
        <div className="flex items-center gap-6">
          <button className="text-white/40 hover:text-white/80 transition-colors duration-300">
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>
          <button
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-white/10"
          >
            <span className="material-symbols-outlined text-2xl">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button className="text-white/40 hover:text-white/80 transition-colors duration-300">
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>
        </div>
        {/* Progress Bar */}
        <div className="w-full flex items-center gap-2">
          <span className="text-white/30 text-[10px] font-mono">0:00</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative group cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-white/30 text-[10px] font-mono">0:00</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="hidden md:flex items-center gap-3 w-40">
        <button className="text-white/40 hover:text-white/80 transition-colors duration-300">
          <span className="material-symbols-outlined text-lg">volume_up</span>
        </button>
        <div
          className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setVolume((e.clientX - rect.left) / rect.width)
          }}
        >
          <div
            className="h-full bg-white/60 rounded-full transition-all duration-100"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>
    </footer>
  )
}
