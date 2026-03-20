# 简化视频滤镜系统实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 移除滤镜选择功能，只保留一个安全的默认滤镜，彻底解决 FFmpeg 滤镜语法问题

**Architecture:** 简化滤镜系统为单一默认滤镜 `eq=contrast=1.1:saturation=1.1`，移除滤镜选择 UI，更新类型定义和配置引擎

**Tech Stack:** TypeScript, React, FFmpeg.wasm

---

## Task 1: 简化 video-filters.ts

**Files:**
- Modify: `src/lib/effects/video-filters.ts`

**Step 1: 重写文件内容**

将文件内容替换为简化版本：

```typescript
/**
 * 视频滤镜配置（简化版）
 * 只保留一个安全的默认滤镜，避免 FFmpeg 语法问题
 */

/**
 * 默认视频滤镜
 * 轻微增强对比度和饱和度，适合大多数场景
 *
 * FFmpeg 滤镜说明：
 * - contrast=1.1: 提升对比度 10%
 * - saturation=1.1: 提升饱和度 10%
 *
 * 这个滤镜组合：
 * - 无特殊字符，零语法风险
 * - 效果温和，适合大多数视频
 * - FFmpeg.wasm 完全兼容
 */
export const DEFAULT_VIDEO_FILTER = 'eq=contrast=1.1:saturation=1.1'

/**
 * 默认滤镜配置（用于 UI 显示）
 */
export const DEFAULT_VIDEO_FILTER_CONFIG = {
  id: 'default' as const,
  name: '默认增强',
  description: '轻微提升对比度和饱和度',
  icon: '✨',
  ffmpegFilter: DEFAULT_VIDEO_FILTER,
}

/**
 * 获取默认滤镜字符串
 */
export function getDefaultVideoFilter(): string {
  return DEFAULT_VIDEO_FILTER
}

/**
 * 获取默认滤镜配置
 */
export function getDefaultVideoFilterConfig() {
  return DEFAULT_VIDEO_FILTER_CONFIG
}

// ============================================
// 向后兼容导出（已废弃，但保留以避免破坏性更改）
// ============================================

/**
 * @deprecated 使用 DEFAULT_VIDEO_FILTER 代替
 */
export const VIDEO_FILTERS = {
  default: DEFAULT_VIDEO_FILTER_CONFIG,
}

/**
 * @deprecated 使用 getDefaultVideoFilter() 代替
 */
export type VideoFilterType = 'default'

/**
 * @deprecated 使用 getDefaultVideoFilterConfig() 代替
 */
export function getVideoFilter() {
  return DEFAULT_VIDEO_FILTER_CONFIG
}

/**
 * @deprecated 使用 getDefaultVideoFilterConfig() 代替
 */
export function getAllVideoFilters() {
  return [DEFAULT_VIDEO_FILTER_CONFIG]
}

/**
 * @deprecated 滤镜组合已不再支持，直接使用 DEFAULT_VIDEO_FILTER
 */
export function combineFilters(): string {
  return DEFAULT_VIDEO_FILTER
}

/**
 * @deprecated 滤镜推荐已不再支持
 */
export function getRecommendedFilters(): string[] {
  return ['default']
}
```

**Step 2: 验证文件语法**

Run: `npx tsc --noEmit src/lib/effects/video-filters.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/effects/video-filters.ts
git commit -m "refactor: 简化视频滤镜系统，只保留默认滤镜"
```

---

## Task 2: 简化 types.ts 中的滤镜类型

**Files:**
- Modify: `src/lib/effects/types.ts`

**Step 1: 更新 VideoFilterType 类型**

找到 `VideoFilterType` 类型定义（约第 89-107 行），替换为：

```typescript
// ============================================
// 视频滤镜类型（简化版）
// ============================================

/**
 * 视频滤镜类型
 * 只有一个默认选项
 */
export type VideoFilterType = 'default'

/**
 * 视频滤镜配置（简化版）
 */
export interface VideoFilter {
  id: 'default'
  name: string
  description: string
  icon: string
  /** FFmpeg 滤镜字符串 */
  ffmpegFilter: string
}
```

**Step 2: 验证类型定义**

Run: `npx tsc --noEmit src/lib/effects/types.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/effects/types.ts
git commit -m "refactor: 简化 VideoFilterType 类型定义"
```

---

## Task 3: 更新 effects-config-engine.ts

**Files:**
- Modify: `src/lib/effects/effects-config-engine.ts`

**Step 1: 更新导入和默认配置**

修改文件开头的导入和默认配置：

```typescript
/**
 * 特效配置引擎
 * 将用户选择的特效配置转换为实际渲染所需的格式
 */

import {
  UserEffectsConfig,
  RenderedEffectsConfig,
  SubtitleEffectType,
  EffectPresetType,
  LyricLineWithWords,
  SubtitleEffectConfig,
} from './types'
import { generateASSSubtitle, DEFAULT_SUBTITLE_CONFIG, SUBTITLE_EFFECTS } from './subtitle-effects'
import { DEFAULT_VIDEO_FILTER } from './video-filters'
import { EFFECT_PRESETS } from './effect-presets'

/**
 * 默认用户特效配置
 */
export const DEFAULT_USER_EFFECTS_CONFIG: UserEffectsConfig = {
  subtitleEffect: 'karaoke-plus',
  videoFilter: 'default', // 使用默认滤镜
  subtitleConfig: DEFAULT_SUBTITLE_CONFIG,
}
```

**Step 2: 更新 render 方法**

找到 `render` 方法（约第 118-139 行），修改为：

```typescript
  /**
   * 渲染特效配置（生成实际的渲染数据）
   */
  render(lyrics: LyricLineWithWords[], subtitleFilename: string = 'subs.ass'): RenderedEffectsConfig {
    // 生成 ASS 字幕内容
    const assContent = generateASSSubtitle(
      lyrics,
      this.config.subtitleEffect,
      this.config.subtitleConfig
    )

    // 使用默认滤镜（不再支持滤镜选择）
    const ffmpegFilterChain = DEFAULT_VIDEO_FILTER

    return {
      assContent,
      ffmpegFilterChain,
      subtitleFilename,
    }
  }
```

**Step 3: 简化 setVideoFilter 方法**

找到 `setVideoFilter` 方法，添加注释说明：

```typescript
  /**
   * 设置视频滤镜
   * @deprecated 滤镜选择已移除，此方法不再有效果
   */
  setVideoFilter(filter: VideoFilterType): void {
    this.config.preset = undefined // 清除预设
    // 滤镜设置已简化，忽略用户选择
    console.log('[EffectsConfigEngine] 滤镜选择已简化，使用默认滤镜')
  }
```

**Step 4: 更新 validate 方法**

找到 `validate` 方法（约第 163-189 行），简化滤镜验证：

```typescript
  /**
   * 验证配置是否有效
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 验证字幕特效
    if (!SUBTITLE_EFFECTS[this.config.subtitleEffect]) {
      errors.push(`无效的字幕特效: ${this.config.subtitleEffect}`)
    }

    // 滤镜验证已简化，始终使用默认滤镜

    return {
      valid: errors.length === 0,
      errors,
    }
  }
```

**Step 5: 验证更改**

Run: `npx tsc --noEmit src/lib/effects/effects-config-engine.ts`
Expected: No errors

**Step 6: Commit**

```bash
git add src/lib/effects/effects-config-engine.ts
git commit -m "refactor: 简化 EffectsConfigEngine，移除滤镜选择逻辑"
```

---

## Task 4: 更新 effect-presets.ts

**Files:**
- Modify: `src/lib/effects/effect-presets.ts`

**Step 1: 更新所有预设使用默认滤镜**

将所有预设的 `videoFilter` 改为 `'default'`，移除 `additionalFilters`：

```typescript
/**
 * 特效预设系统
 * 一键应用适合不同 Rap 风格的特效组合
 *
 * 注意：滤镜系统已简化，所有预设都使用默认滤镜
 */

import { EffectPresetType, EffectPreset, SubtitleEffectType, SubtitleEffectConfig } from './types'

/**
 * 特效预设配置
 */
export const EFFECT_PRESETS: Record<EffectPresetType, EffectPreset> = {
  'trap-king': {
    id: 'trap-king',
    name: 'Trap King',
    description: '硬核 Trap 风格，冲击力强',
    icon: '👑',
    subtitleEffect: 'punch',
    videoFilter: 'default', // 简化为默认滤镜
    subtitleConfig: {
      primaryColor: '#FFFFFF',
      secondaryColor: '#FFD700',
      accentColor: '#FF0000',
      fontSize: 56,
      outlineWidth: 4,
      effectIntensity: 1.2,
    },
  },
  'lofi-vibes': {
    id: 'lofi-vibes',
    name: 'Lofi Vibes',
    description: '轻松 Lofi 风格，怀旧温暖',
    icon: '🎧',
    subtitleEffect: 'wave',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#FFF5E6',
      secondaryColor: '#FFB347',
      fontSize: 48,
      outlineWidth: 2,
      animationSpeed: 0.8,
      effectIntensity: 0.7,
    },
  },
  'cyber-night': {
    id: 'cyber-night',
    name: 'Cyber Night',
    description: '赛博朋克夜景风格',
    icon: '🌙',
    subtitleEffect: 'neon-pulse',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#00FFFF',
      secondaryColor: '#FF00FF',
      accentColor: '#00FF00',
      fontSize: 52,
      outlineWidth: 3,
      effectIntensity: 1.3,
    },
  },
  'old-school': {
    id: 'old-school',
    name: 'Old School',
    description: '经典 Hip-Hop 老派风格',
    icon: '🎤',
    subtitleEffect: 'karaoke-plus',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#FFFFFF',
      secondaryColor: '#FFA500',
      fontSize: 50,
      outlineWidth: 3,
      animationSpeed: 0.9,
    },
  },
  'hardcore': {
    id: 'hardcore',
    name: 'Hardcore',
    description: '极限硬核风格，爆炸冲击',
    icon: '💣',
    subtitleEffect: 'explosion',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#FF0000',
      secondaryColor: '#FFFF00',
      accentColor: '#FF4500',
      fontSize: 60,
      outlineWidth: 5,
      effectIntensity: 1.5,
    },
  },
  'melodic-flow': {
    id: 'melodic-flow',
    name: 'Melodic Flow',
    description: '旋律流动，柔和优美',
    icon: '🌊',
    subtitleEffect: 'bounce-3d',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#E0E7FF',
      secondaryColor: '#818CF8',
      fontSize: 48,
      outlineWidth: 2,
      animationSpeed: 1.1,
      effectIntensity: 0.8,
    },
  },
  'underground': {
    id: 'underground',
    name: 'Underground',
    description: '地下暗黑风格',
    icon: '🖤',
    subtitleEffect: 'glitch-text',
    videoFilter: 'default',
    subtitleConfig: {
      primaryColor: '#CCCCCC',
      secondaryColor: '#333333',
      accentColor: '#666666',
      fontSize: 54,
      outlineWidth: 2,
      effectIntensity: 1.0,
    },
  },
}

/**
 * 获取特效预设
 */
export function getEffectPreset(type: EffectPresetType): EffectPreset {
  return EFFECT_PRESETS[type]
}

/**
 * 获取所有特效预设列表
 */
export function getAllEffectPresets(): EffectPreset[] {
  return Object.values(EFFECT_PRESETS)
}

/**
 * 获取推荐的预设
 */
export function getRecommendedPresets(style: string): EffectPresetType[] {
  const styleMapping: Record<string, EffectPresetType[]> = {
    'trap': ['trap-king', 'cyber-night', 'hardcore'],
    'lofi': ['lofi-vibes', 'old-school'],
    'melodic': ['melodic-flow', 'lofi-vibes'],
    'hardcore': ['hardcore', 'trap-king'],
    'cyberpunk': ['cyber-night', 'trap-king'],
    'old-school': ['old-school', 'underground'],
    'drill': ['hardcore', 'trap-king', 'underground'],
    'rnb': ['melodic-flow', 'lofi-vibes'],
    'default': ['old-school', 'trap-king', 'melodic-flow'],
  }

  return styleMapping[style] || styleMapping['default']
}
```

**Step 2: 验证更改**

Run: `npx tsc --noEmit src/lib/effects/effect-presets.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/effects/effect-presets.ts
git commit -m "refactor: 简化特效预设，全部使用默认滤镜"
```

---

## Task 5: 更新 effects/index.ts 导出

**Files:**
- Modify: `src/lib/effects/index.ts`

**Step 1: 更新导出**

```typescript
/**
 * 视频特效系统
 * 导出所有特效相关模块
 */

// Types
export * from './types'

// Subtitle Effects
export {
  SUBTITLE_EFFECTS,
  DEFAULT_SUBTITLE_CONFIG,
  getSubtitleEffect,
  getAllSubtitleEffects,
  generateASSSubtitle,
} from './subtitle-effects'

// Video Filters (简化版)
export {
  DEFAULT_VIDEO_FILTER,
  DEFAULT_VIDEO_FILTER_CONFIG,
  getDefaultVideoFilter,
  getDefaultVideoFilterConfig,
  // 向后兼容（已废弃）
  VIDEO_FILTERS,
  getVideoFilter,
  getAllVideoFilters,
  combineFilters,
  getRecommendedFilters,
} from './video-filters'

// Effect Presets
export {
  EFFECT_PRESETS,
  getEffectPreset,
  getAllEffectPresets,
  getRecommendedPresets,
} from './effect-presets'

// Effects Config Engine
export {
  EffectsConfigEngine,
  DEFAULT_USER_EFFECTS_CONFIG,
  createEffectsEngine,
  renderEffects,
} from './effects-config-engine'
```

**Step 2: 验证更改**

Run: `npx tsc --noEmit src/lib/effects/index.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/effects/index.ts
git commit -m "refactor: 更新 effects 模块导出"
```

---

## Task 6: 移除滤镜选择 UI

**Files:**
- Modify: `src/components/features/effects/effect-selector.tsx`

**Step 1: 移除 VideoFilterSelector 组件**

删除 `VideoFilterSelector` 函数组件（约第 121-190 行）

**Step 2: 更新主组件，移除滤镜选择部分**

在 `EffectSelector` 组件中：
1. 移除 `VideoFilterSelector` 的导入（如果有）
2. 移除 `currentVideoFilter` 和 `handleVideoFilterSelect`
3. 删除渲染滤镜选择器的 JSX 部分
4. 删除当前配置摘要中的滤镜显示

**Step 3: 简化后的 EffectSelector 组件**

主要修改点：
- 移除 `VideoFilterSelector` 函数
- 移除 `handleVideoFilterSelect` 回调
- 移除渲染滤镜选择器的 JSX
- 更新当前配置摘要，移除滤镜显示

**Step 4: 验证更改**

Run: `npx tsc --noEmit src/components/features/effects/effect-selector.tsx`
Expected: No errors

**Step 5: Commit**

```bash
git add src/components/features/effects/effect-selector.tsx
git commit -m "refactor: 移除滤镜选择 UI"
```

---

## Task 7: 删除旧的滤镜文件

**Files:**
- Delete: `src/lib/ffmpeg/filters.ts`
- Delete: `src/components/features/video/filter-selector.tsx`

**Step 1: 删除旧滤镜系统文件**

```bash
rm src/lib/ffmpeg/filters.ts
rm src/components/features/video/filter-selector.tsx
```

**Step 2: 检查是否有其他文件引用这些文件**

Run: `grep -r "from '@/lib/ffmpeg/filters'" src/`
Run: `grep -r "from '@/components/features/video/filter-selector'" src/`
Expected: No matches (如果有引用，需要更新这些文件)

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: 删除旧的滤镜系统和选择器组件"
```

---

## Task 8: 更新 video-synthesizer.ts

**Files:**
- Modify: `src/lib/ffmpeg/video-synthesizer.ts`

**Step 1: 检查并更新滤镜相关导入**

确保使用 `DEFAULT_VIDEO_FILTER` 而不是从滤镜选择器获取。

**Step 2: 验证滤镜链构建逻辑**

确保 `synthesizeWithEffects` 方法使用默认滤镜。

**Step 3: Commit**

```bash
git add src/lib/ffmpeg/video-synthesizer.ts
git commit -m "refactor: 更新 video-synthesizer 使用默认滤镜"
```

---

## Task 9: 运行完整测试

**Step 1: 运行 TypeScript 编译检查**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: 运行测试**

Run: `npm test`
Expected: All tests pass

**Step 3: 运行开发服务器测试**

Run: `npm run dev`
Expected: Server starts without errors

**Step 4: 手动测试视频合成**

1. 打开 http://localhost:3002/create
2. 上传视频和音频
3. 生成视频
4. 验证视频合成成功，无滤镜语法错误

---

## Task 10: 最终提交

**Step 1: 检查所有更改**

Run: `git status`
Run: `git diff`

**Step 2: 创建最终提交**

```bash
git add -A
git commit -m "refactor: 简化视频滤镜系统

- 移除滤镜选择功能，只保留默认滤镜
- 默认滤镜: eq=contrast=1.1:saturation=1.1
- 删除旧的滤镜系统和选择器组件
- 更新类型定义和配置引擎
- 解决 FFmpeg 滤镜语法问题

BREAKING CHANGE: 用户无法再选择滤镜效果"
```

---

## 验证清单

- [ ] TypeScript 编译无错误
- [ ] 所有测试通过
- [ ] 开发服务器启动正常
- [ ] 视频合成功能正常
- [ ] 无 FFmpeg 滤镜语法错误
