'use client'

import { motion } from 'framer-motion'
import type { MiniMaxDialect, MiniMaxMusicStyle } from '@/lib/minimax/types'

interface ChipProps {
  label: string
  icon?: string
  active?: boolean
  onClick?: () => void
  disabled?: boolean
}

export function Chip({ label, icon, active, onClick, disabled }: ChipProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`suno-chip ${active ? 'active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </motion.button>
  )
}

interface ChipGroupProps {
  children: React.ReactNode
  label?: string
}

export function ChipGroup({ children, label }: ChipGroupProps) {
  return (
    <div>
      {label && <label className="suno-label">{label}</label>}
      <div className="suno-chip-group">{children}</div>
    </div>
  )
}

interface SceneCardProps {
  icon: string
  name: string
  description: string
  active?: boolean
  onClick?: () => void
}

export function SceneCard({ icon, name, description, active, onClick }: SceneCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`suno-scene-card ${active ? 'active' : ''}`}
    >
      <span className="suno-scene-icon">{icon}</span>
      <div className="suno-scene-name">{name}</div>
      <div className="suno-scene-desc">{description}</div>
    </motion.div>
  )
}

// 方言/语言选择 - 匹配 MiniMaxDialect 类型
const DIALECTS: { id: MiniMaxDialect; label: string; icon: string }[] = [
  { id: 'mandarin', label: '普通话', icon: '🇨🇳' },
  { id: 'cantonese', label: '粤语', icon: '🇭🇰' },
  { id: 'english', label: 'English', icon: '🇺🇸' },
]

interface DialectSelectorProps {
  value: MiniMaxDialect
  onChange: (dialect: MiniMaxDialect) => void
}

export function DialectSelector({ value, onChange }: DialectSelectorProps) {
  return (
    <ChipGroup label="方言选择">
      {DIALECTS.map((dialect) => (
        <Chip
          key={dialect.id}
          label={dialect.label}
          icon={dialect.icon}
          active={value === dialect.id}
          onClick={() => onChange(dialect.id)}
        />
      ))}
    </ChipGroup>
  )
}

// 音乐风格选择 - 匹配 MiniMaxMusicStyle 类型
const MUSIC_STYLES: { id: MiniMaxMusicStyle; label: string; icon: string }[] = [
  { id: 'rap', label: 'Rap', icon: '🎤' },
  { id: 'pop', label: '流行', icon: '🎵' },
  { id: 'electronic', label: '电子', icon: '🎹' },
]

interface MusicStyleSelectorProps {
  value: MiniMaxMusicStyle
  onChange: (style: MiniMaxMusicStyle) => void
}

export function MusicStyleSelector({ value, onChange }: MusicStyleSelectorProps) {
  return (
    <ChipGroup label="音乐风格">
      {MUSIC_STYLES.map((style) => (
        <Chip
          key={style.id}
          label={style.label}
          icon={style.icon}
          active={value === style.id}
          onClick={() => onChange(style.id)}
        />
      ))}
    </ChipGroup>
  )
}

// 保留 RapStyleSelector 作为别名，内部使用 MusicStyleSelector
export const RapStyleSelector = MusicStyleSelector
