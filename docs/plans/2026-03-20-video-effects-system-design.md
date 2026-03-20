# Rap视频特效系统设计方案

## 概述

为 WhyFire 实现完整的 Rap 视频特效系统，包括动态字幕特效、视频滤镜和用户选择界面。

## 技术决策

### 核心架构：FFmpeg + ASS 高级特性

**选择原因：**
- 一次渲染完成，用户等待时间短
- ASS 字幕格式支持丰富的文字动画效果
- FFmpeg 原生滤镜质量高、性能好
- 无需额外的 Canvas 预渲染层

## 系统架构

```
用户界面层
┌─────────────────────────────────────────────┐
│  字幕样式选择  │  视频滤镜选择  │  特效预设   │
└─────────────────────────────────────────────┘
                    │
                    ▼
配置引擎层
┌─────────────────────────────────────────────┐
│  EffectsConfigEngine                         │
│  - 合并用户选择                               │
│  - 生成 ASS 字幕配置                          │
│  - 生成 FFmpeg 滤镜链                         │
└─────────────────────────────────────────────┘
                    │
                    ▼
视频合成层
┌─────────────────────────────────────────────┐
│  VideoSynthesizer (增强版)                    │
│  FFmpeg.wasm 单次渲染:                        │
│  video + audio + subtitles + filters        │
│            ↓                                 │
│         output.mp4                           │
└─────────────────────────────────────────────┘
```

## 特效清单

### 字幕特效 (ASS)

| 特效名称 | 效果描述 | ASS 标签 |
|---------|---------|---------|
| Karaoke Plus | 逐字高亮 + 光泽流动 | `\kf`, `\t` |
| Punch | 每个词"打"出来，带缩放 | `\t(\fscx\fscy)` |
| Bounce 3D | 3D弹跳 + 旋转 | `\frx`, `\fry`, `\t` |
| Glitch Text | 文字抖动 + 色彩分离 | `\fax`, `\fay`, `\1c` |
| Neon Pulse | 霓虹呼吸灯效果 | `\bord`, `\be`, `\t` |
| Wave | 文字波浪起伏 | `\t(\fscx\fscy)` |
| Explosion | 文字爆炸出现 | `\fscx`, `\fscy`, `\fad` |

### 视频滤镜 (FFmpeg)

| 滤镜名称 | FFmpeg 命令 |
|---------|------------|
| VHS | `curves=vintage,noise=alls=8:allf=t,eq=saturation=0.9` |
| Cyberpunk | `colorbalance=rs=.2:gs=-.1:bs=.3,eq=contrast=1.3:saturation=1.2` |
| Glitch | `rgbashift=rh=2:rv=1:gh=-1:gv=2:bh=1:bv=-1,noise=alls=3` |
| Shake | `crop=iw-4:ih-4:2+random(1)*2:2+random(1)*2,scale=iw:ih` |
| Film | `noise=alls=5:allf=t,eq=contrast=1.05:saturation=0.95,vignette` |
| Dramatic | `eq=contrast=1.4:brightness=0.05:saturation=1.2` |
| Noir | `format=gray,colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3` |

### 特效预设 (一键组合)

| 预设名称 | 字幕特效 | 视频滤镜 |
|---------|---------|---------|
| Trap King | Punch | Glitch + Shake |
| Lofi Vibes | Wave | Film |
| Cyber Night | Neon Pulse | Cyberpunk |
| Old School | Karaoke Plus | VHS |
| Hardcore | Explosion | Dramatic + Shake |

## 文件结构

```
src/lib/effects/
├── index.ts                    # 导出入口
├── types.ts                    # 类型定义
├── subtitle-effects.ts         # 字幕特效配置
├── video-filters.ts            # 视频滤镜配置 (扩展现有)
├── effect-presets.ts           # 特效预设配置
└── effects-config-engine.ts    # 配置引擎

src/components/features/effects/
├── effect-selector.tsx         # 特效选择器主组件
├── subtitle-effect-picker.tsx  # 字幕特效选择
├── video-filter-picker.tsx     # 视频滤镜选择
└── preset-selector.tsx         # 预设选择器
```

## 实施阶段

### Phase 1: 核心修复 (优先级最高)
1. 修复字幕自动添加到视频
2. 扩展字幕样式系统
3. 基础特效选择 UI

### Phase 2: 特效增强
1. 添加更多字幕特效
2. 添加视频滤镜到合成流程
3. 实现特效预设系统

### Phase 3: 验证与优化
1. 端到端测试
2. 性能优化
3. 用户体验改进

## 验收标准

1. ✅ 视频生成时自动添加字幕
2. ✅ 用户可选择字幕特效 (至少7种)
3. ✅ 用户可选择视频滤镜 (至少8种)
4. ✅ 用户可选择特效预设 (至少5种)
5. ✅ 特效效果符合预期
6. ✅ 渲染时间在可接受范围内 (30秒视频 < 60秒)

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| FFmpeg.wasm 滤镜兼容性 | 预先测试每个滤镜，记录可用性 |
| 渲染时间过长 | 优化滤镜链，减少不必要的处理 |
| ASS 特效在部分播放器不兼容 | 提供兼容性警告，测试主流播放器 |
