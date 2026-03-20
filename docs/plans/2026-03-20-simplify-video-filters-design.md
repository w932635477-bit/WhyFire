# 视频滤镜系统简化设计

> **目标**: 移除滤镜选择功能，只保留一个安全的默认滤镜，彻底解决 FFmpeg 滤镜语法问题

## 背景

当前项目存在 FFmpeg 滤镜语法问题：
- 滤镜中的特殊字符（如表达式里的 `:`）被误解析为滤镜分隔符
- 错误只在视频合成运行时才发现
- 用户需要等待很久才能看到失败

## 决策

遵循 YAGNI 原则，彻底简化滤镜系统：

| 项目 | 决策 |
|------|------|
| 滤镜数量 | 只保留一种默认滤镜 |
| 默认效果 | 轻微增强（提升对比度和饱和度各 10%） |
| 验证方式 | 开发时通过单元测试验证 |

## 默认滤镜

```ffmpeg
eq=contrast=1.1:saturation=1.1
```

**选择理由**：
- 无特殊字符，零语法风险
- 轻微增强视频效果，适合大多数场景
- FFmpeg.wasm 完全兼容

## 需要修改的文件

### 核心修改

| 文件 | 操作 |
|------|------|
| `src/lib/effects/video-filters.ts` | 只保留一个默认滤镜常量 |
| `src/lib/effects/types.ts` | 简化 `VideoFilterType` 为单一类型 |
| `src/lib/effects/effects-config-engine.ts` | 移除滤镜选择逻辑，使用默认滤镜 |
| `src/components/features/effects/effect-selector.tsx` | 移除滤镜选择 UI 部分 |

### 废弃/删除

| 文件 | 操作 |
|------|------|
| `src/lib/ffmpeg/filters.ts` | 删除（旧滤镜系统） |
| `src/components/features/video/filter-selector.tsx` | 删除（旧滤镜选择器） |

### 相关文件

| 文件 | 操作 |
|------|------|
| `src/lib/effects/effect-presets.ts` | 更新预设，使用默认滤镜 |
| `src/lib/effects/index.ts` | 更新导出 |
| `src/components/features/effects/index.ts` | 更新导出 |

## 新的代码结构

### video-filters.ts（简化后）

```typescript
/**
 * 视频滤镜配置（简化版）
 * 只保留一个安全的默认滤镜
 */

/**
 * 默认视频滤镜
 * 轻微增强对比度和饱和度，适合大多数场景
 */
export const DEFAULT_VIDEO_FILTER = 'eq=contrast=1.1:saturation=1.1'

/**
 * 获取默认滤镜字符串
 */
export function getDefaultVideoFilter(): string {
  return DEFAULT_VIDEO_FILTER
}
```

### types.ts（简化后）

```typescript
/**
 * 视频滤镜类型（简化版）
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
  ffmpegFilter: string
}
```

## 影响范围

- 用户将无法选择滤镜效果
- 视频输出将统一使用轻微增强效果
- 减少代码复杂度和维护成本
- 彻底消除滤镜语法错误风险

## 风险

- 低：用户可能期望更多滤镜选择
- 缓解：未来需要时可以重新添加经过验证的滤镜

## 时间估计

- 实施时间：约 30-60 分钟
- 测试验证：约 15 分钟
