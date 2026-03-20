'use client'

import React, { useState, useCallback } from 'react'
import {
  SubtitleEffectType,
  EffectPresetType,
  UserEffectsConfig,
  getAllSubtitleEffects,
  getAllEffectPresets,
  DEFAULT_SUBTITLE_CONFIG,
  EFFECT_PRESETS,
  DEFAULT_VIDEO_FILTER_CONFIG,
} from '@/lib/effects'

/**
 * 特效选择器 Props
 */
export interface EffectSelectorProps {
  /** 当前配置 */
  config: Partial<UserEffectsConfig>
  /** 配置变更回调 */
  onConfigChange: (config: Partial<UserEffectsConfig>) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示预设选择 */
  showPresets?: boolean
  /** 自定义样式类名 */
  className?: string
}

/**
 * 特效预设选择器
 */
function PresetSelector({
  currentPreset,
  onSelect,
  disabled,
}: {
  currentPreset?: EffectPresetType
  onSelect: (preset: EffectPresetType) => void
  disabled?: boolean
}) {
  const presets = getAllEffectPresets()

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        🎯 特效预设
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            disabled={disabled}
            className={`p-3 rounded-lg text-left transition-all ${
              currentPreset === preset.id
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-lg mb-1">{preset.icon}</div>
            <div className="text-sm font-medium">{preset.name}</div>
            <div className="text-xs text-gray-400 mt-1 line-clamp-1">
              {preset.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * 字幕特效选择器
 */
function SubtitleEffectSelector({
  currentEffect,
  onSelect,
  disabled,
}: {
  currentEffect: SubtitleEffectType
  onSelect: (effect: SubtitleEffectType) => void
  disabled?: boolean
}) {
  const effects = getAllSubtitleEffects()

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        ✨ 字幕特效
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {effects.map((effect) => (
          <button
            key={effect.id}
            onClick={() => onSelect(effect.id)}
            disabled={disabled}
            className={`p-2 rounded-lg text-center transition-all ${
              currentEffect === effect.id
                ? 'bg-pink-600 text-white ring-2 ring-pink-400'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-xl mb-1">{effect.icon}</div>
            <div className="text-xs font-medium">{effect.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * 特效强度调节器
 */
function IntensitySlider({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">
          💪 特效强度
        </label>
        <span className="text-sm text-purple-400">{(value * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min="0.5"
        max="2"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>柔和</span>
        <span>正常</span>
        <span>强烈</span>
      </div>
    </div>
  )
}

/**
 * 主特效选择器组件
 *
 * 注意：滤镜选择已简化为默认滤镜，不再提供选择功能
 */
export function EffectSelector({
  config,
  onConfigChange,
  disabled = false,
  showPresets = true,
  className = '',
}: EffectSelectorProps) {
  // 处理预设选择
  const handlePresetSelect = useCallback((preset: EffectPresetType) => {
    const presetConfig = EFFECT_PRESETS[preset]

    const newConfig: Partial<UserEffectsConfig> = {
      ...config,
      preset,
      subtitleEffect: presetConfig.subtitleEffect,
      videoFilter: 'default', // 使用默认滤镜
    }

    if (presetConfig.subtitleConfig) {
      newConfig.subtitleConfig = {
        ...DEFAULT_SUBTITLE_CONFIG,
        ...presetConfig.subtitleConfig,
      }
    }

    onConfigChange(newConfig)
  }, [config, onConfigChange])

  // 处理字幕特效选择
  const handleSubtitleEffectSelect = useCallback((effect: SubtitleEffectType) => {
    onConfigChange({
      ...config,
      preset: undefined,
      subtitleEffect: effect,
    })
  }, [config, onConfigChange])

  // 处理特效强度变化
  const handleIntensityChange = useCallback((intensity: number) => {
    onConfigChange({
      ...config,
      subtitleConfig: {
        ...DEFAULT_SUBTITLE_CONFIG,
        ...config.subtitleConfig,
        effectIntensity: intensity,
      },
    })
  }, [config, onConfigChange])

  // 当前效果
  const currentSubtitleEffect = config.subtitleEffect || 'karaoke-plus'
  const currentIntensity = config.subtitleConfig?.effectIntensity || 1.0

  return (
    <div className={`bg-gray-900 rounded-xl p-6 space-y-6 ${className}`}>
      {/* 标题 */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">特效设置</h2>
        <p className="text-sm text-gray-400">
          选择字幕特效，让你的视频更酷炫
        </p>
      </div>

      {/* 预设选择器 */}
      {showPresets && (
        <>
          <PresetSelector
            currentPreset={config.preset}
            onSelect={handlePresetSelect}
            disabled={disabled}
          />
          <div className="border-t border-gray-800" />
        </>
      )}

      {/* 字幕特效选择器 */}
      <SubtitleEffectSelector
        currentEffect={currentSubtitleEffect}
        onSelect={handleSubtitleEffectSelect}
        disabled={disabled}
      />

      <div className="border-t border-gray-800" />

      {/* 特效强度 */}
      <IntensitySlider
        value={currentIntensity}
        onChange={handleIntensityChange}
        disabled={disabled}
      />

      {/* 当前选择摘要 */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-2">当前配置</div>
        <div className="flex flex-wrap gap-2">
          {config.preset && (
            <span className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded text-xs">
              预设: {EFFECT_PRESETS[config.preset]?.name || config.preset}
            </span>
          )}
          <span className="px-2 py-1 bg-pink-600/30 text-pink-300 rounded text-xs">
            字幕: {currentSubtitleEffect}
          </span>
          <span className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs">
            滤镜: {DEFAULT_VIDEO_FILTER_CONFIG.name}
          </span>
        </div>
      </div>
    </div>
  )
}

export default EffectSelector
