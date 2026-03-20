# WhyFire UI 重设计方案 - Suno 风格

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**设计参考:** https://suno.com/

## 🎯 设计目标

1. **Hero 区** - 添加 Rap 视频背景，打造沉浸式体验
2. **工作页面** - 借鉴 Suno Create 页面的简洁高效设计

---

## 📐 Suno Create 页面设计分析

### 核心UI组件

| 组件 | Suno 实现 | WhyFire 适配 |
|------|-----------|--------------|
| **创作输入区** | 左侧大文本框 + 风格选择 | 歌词输入 + 方言选择 + 场景选择 |
| **模式切换** | Custom / Simple 模式 | 高级模式 / 快速模式 |
| **风格标签** | 音乐风格芯片选择 | 方言 + Rap 风格芯片 |
| **生成按钮** | 醒目的 Create 按钮 | 开始生成 按钮 |
| **历史记录** | 右侧面板显示历史生成 | 生成历史 + 预览 |
| **积分显示** | 顶部显示剩余积分 | 积分余额显示 |

### 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]          首页  探索  模板库        [🔍 搜索]  [积分] [头像] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────────────────────┐  ┌───────────────────┐   │
│   │                              │  │                   │   │
│   │   创作输入区                  │  │  预览/历史区      │   │
│   │   - 歌词输入框                │  │  - 最新生成       │   │
│   │   - 场景选择                  │  │  - 视频预览       │   │
│   │   - 方言选择                  │  │  - 下载/分享      │   │
│   │   - Rap 风格                  │  │                   │   │
│   │                              │  │                   │   │
│   │   [🎵 开始生成 Rap 视频]      │  │                   │   │
│   │                              │  │                   │   │
│   └──────────────────────────────┘  └───────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Task 1: Hero 区 - 添加 Rap 视频背景

**文件:** `src/components/home/hero.tsx`

### 设计要求
- 全屏视频背景，带有暗色遮罩
- 视频自动播放、静音、循环
- 内容清晰可读，不受视频影响
- 视频加载失败时有优雅的降级处理

### 视频规格
- 格式: MP4 (H.264)
- 分辨率: 1920x1080 或更高
- 时长: 15-30秒循环
- 大小: < 10MB（优化加载）

### 实现要点
```tsx
// 视频背景组件
<video
  autoPlay
  muted
  loop
  playsInline
  className="absolute inset-0 w-full h-full object-cover"
>
  <source src="/videos/hero-rap-bg.mp4" type="video/mp4" />
</video>
// 暗色遮罩保证文字可读性
<div className="absolute inset-0 bg-black/70" />
```

---

## 🎨 Task 2: 工作页面 - 借鉴 Suno Create 设计

**文件:** `src/app/create/page.tsx`

### 布局设计

```
┌─────────────────────────────────────────────────────────────┐
│                      WhyFire 创作                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────┐ ┌───────────────────┐  │
│  │ 📝 歌词输入                      │ │ 🎬 预览           │  │
│  │ ┌─────────────────────────────┐ │ │                   │  │
│  │ │                             │ │ │  [视频预览区]     │  │
│  │ │  在这里输入你的 Rap 歌词...  │ │ │                   │  │
│  │ │                             │ │ │  00:00 / 00:60   │  │
│  │ │                             │ │ │                   │  │
│  │ └─────────────────────────────┘ │ │  [下载] [分享]   │  │
│  │                                 │ └───────────────────┘  │
│  │ 🎭 场景选择                     │                         │
│  │ [产品推广] [搞笑段子] [IP混剪]   │ ┌───────────────────┐  │
│  │                                 │ │ 📜 生成历史        │  │
│  │ 🗣️ 方言选择                     │ │                   │  │
│  │ [普通话] [粤语] [东北话] [四川话] │ │ • 视频1  2分钟前  │  │
│  │                                 │ │ • 视频2  5分钟前  │  │
│  │ 🎵 Rap 风格                     │ │ • 视频3  1小时前  │  │
│  │ [快节奏] [抒情] [搞笑] [硬核]    │ │                   │  │
│  │                                 │ │ [查看全部]        │  │
│  │ ┌─────────────────────────────┐ │ └───────────────────┘  │
│  │ │ 🎵 开始生成 Rap 视频         │ │                         │
│  │ │    消耗 2 积分               │ │                         │
│  │ └─────────────────────────────┘ │                         │
│  └─────────────────────────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 组件设计

#### 输入区组件
- **TextEditor** - 歌词输入框，支持行数统计
- **SceneSelector** - 场景选择芯片组
- **DialectSelector** - 方言选择芯片组
- **StyleSelector** - Rap 风格选择

#### 预览区组件
- **VideoPreview** - 视频播放器
- **ActionButtons** - 下载/分享按钮
- **HistoryList** - 生成历史列表

---

## 🎨 Task 3: 设计系统更新

**文件:** `src/app/globals.css`

### Suno 风格配色

```css
:root {
  /* 背景 - 深色系 */
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #141414;
  --bg-card: #1a1a1a;
  --bg-input: #0d0d0d;

  /* 文字 */
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #52525b;
  --text-accent: #8b5cf6;

  /* 强调色 */
  --accent-purple: #8b5cf6;
  --accent-green: #10b981;
  --accent-blue: #3b82f6;

  /* 边框 */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-medium: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.2);
}
```

### 组件样式

```css
/* 输入框 - Suno 风格 */
.input-area {
  background: var(--bg-input);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  padding: 16px;
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.6;
}

.input-area:focus {
  border-color: var(--accent-purple);
  outline: none;
}

/* 选择芯片 - Suno 风格 */
.chip {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-medium);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.chip:hover {
  background: var(--bg-card);
  border-color: var(--border-strong);
}

.chip.active {
  background: var(--accent-purple);
  border-color: var(--accent-purple);
  color: white;
}

/* 主按钮 - Suno 风格 */
.btn-create {
  width: 100%;
  padding: 16px 24px;
  background: var(--accent-green);
  color: #000;
  font-weight: 600;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create:hover {
  background: #34d399;
  transform: translateY(-1px);
}

.btn-create:disabled {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  cursor: not-allowed;
}
```

---

## 📋 实施任务清单

| # | 任务 | 优先级 | 文件 |
|---|------|--------|------|
| 1 | 准备 Hero 视频资源 | P0 | `/public/videos/hero-rap-bg.mp4` |
| 2 | 更新 Hero 组件添加视频背景 | P0 | `src/components/home/hero.tsx` |
| 3 | 更新 globals.css 设计系统 | P0 | `src/app/globals.css` |
| 4 | 重设计 Create 页面布局 | P0 | `src/app/create/page.tsx` |
| 5 | 创建输入组件 | P1 | `src/components/create/` |
| 6 | 创建预览组件 | P1 | `src/components/create/` |
| 7 | 更新导航栏设计 | P1 | `src/components/layout/` |

---

## ✅ 验证清单

- [ ] Hero 视频正确加载和播放
- [ ] 视频遮罩保证文字可读性
- [ ] Create 页面布局符合 Suno 风格
- [ ] 所有选择芯片交互正常
- [ ] 生成按钮功能正常
- [ ] 响应式设计在移动端正常
