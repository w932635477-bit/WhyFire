# WhyFire 设计系统

本文档定义了 WhyFire 项目的视觉设计规范，确保 UI 一致性。

---

## 设计原则

1. **简约至上** - 避免过度装饰，每个元素都有其目的
2. **8px 网格系统** - 所有间距基于 8px 基准单位
3. **高对比度** - 确保文字可读性和可访问性
4. **平滑过渡** - 使用一致的动画时长（150-300ms）
5. **深色优先** - 以深色模式为默认设计

---

## 颜色系统

### 背景色

| 用途 | 颜色值 | Tailwind Class |
|------|--------|----------------|
| 主背景 | `#0a0a0a` | `bg-[#0a0a0a]` |
| 次背景 | `#080808` | `bg-[#080808]` |
| 卡片背景 | `rgba(255,255,255,0.02)` | `bg-white/[0.02]` |
| 悬浮背景 | `rgba(255,255,255,0.04)` | `bg-white/[0.04]` |
| 遮罩背景 | `rgba(0,0,0,0.7)` | `bg-black/70` |

### 文字颜色

| 用途 | 颜色值 | Tailwind Class |
|------|--------|----------------|
| 主文字 | `#ffffff` | `text-white` |
| 次文字 | `rgba(255,255,255,0.7)` | `text-white/70` |
| 弱文字 | `rgba(255,255,255,0.4)` | `text-white/40` |
| 禁用文字 | `rgba(255,255,255,0.3)` | `text-white/30` |

### 强调色

| 用途 | 颜色值 | Tailwind Class |
|------|--------|----------------|
| 成功/确认 | Emerald | `text-emerald-400`, `bg-emerald-500/10` |
| 主按钮 | White | `bg-white text-black` |
| Violet 强调 | Violet | `text-violet-400`, `bg-violet-500/10` |
| 警告 | Amber | `text-amber-400`, `bg-amber-500/10` |
| 错误 | Red | `text-red-400`, `bg-red-500/10` |

### 边框

| 用途 | 颜色值 | Tailwind Class |
|------|--------|----------------|
| 微边框 | `rgba(255,255,255,0.04)` | `border-white/[0.04]` |
| 标准边框 | `rgba(255,255,255,0.06)` | `border-white/[0.06]` |
| 强调边框 | `rgba(255,255,255,0.08)` | `border-white/[0.08]` |
| 悬浮边框 | `rgba(255,255,255,0.15)` | `border-white/[0.15]` |

---

## 字体系统

### 字体族

```css
font-family: 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif;
```

在 Tailwind 中使用：
```jsx
className="font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
```

### 字体大小

| 用途 | 大小 | Tailwind Class |
|------|------|----------------|
| 大标题 | 30-48px | `text-3xl`, `text-4xl` |
| 标题 | 20-24px | `text-xl`, `text-2xl` |
| 副标题 | 16-18px | `text-base`, `text-lg` |
| 正文 | 14-16px | `text-sm`, `text-base` |
| 小字 | 12-14px | `text-xs`, `text-sm` |
| 微文字 | 10-12px | `text-[10px]`, `text-xs` |

### 字重

| 用途 | 字重 | Tailwind Class |
|------|------|----------------|
| 标题 | 600-700 | `font-semibold`, `font-bold` |
| 正文 | 400-500 | `font-normal`, `font-medium` |
| 强调 | 600 | `font-semibold` |

---

## 间距系统

### 基准单位：8px

所有间距应为 8 的倍数。

### 常用间距

| 间距 | Tailwind Class | 用途 |
|------|----------------|------|
| 8px | `gap-2`, `p-2` | 微间距 |
| 12px | `gap-1.5`, `p-3` | 小间距 |
| 16px | `gap-4`, `p-4` | 标准间距 |
| 20px | `gap-5`, `p-5` | 卡片内边距 |
| 24px | `gap-6`, `p-6` | 大卡片内边距 |
| 32px | `py-8`, `p-8` | 区块间距 |
| 64px | `py-16` | 大区块间距 |
| 96px | `py-24` | 页面区块间距 |
| 128px | `py-32` | 页面主区块间距 |

---

## 圆角系统

### 标准圆角

| 元素 | 圆角 | Tailwind Class |
|------|------|----------------|
| 图标容器 | 8px | `rounded-lg` |
| 按钮 | 12px | `rounded-xl` |
| 药丸按钮 | 9999px | `rounded-full` |
| 卡片 | 16px | `rounded-2xl` |
| 大卡片 | 24px | `rounded-3xl` |

---

## 组件模式

### 卡片

```jsx
<div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
  {/* 内容 */}
</div>
```

### 按钮

**主要按钮（白色）：**
```jsx
<button className="px-5 py-2.5 bg-white text-black rounded-xl font-semibold hover:bg-white/90 transition-colors">
  按钮文字
</button>
```

**次要按钮（透明）：**
```jsx
<button className="px-5 py-2.5 bg-white/[0.03] text-white/70 rounded-xl border border-white/[0.06] hover:bg-white/[0.06] transition-all">
  按钮文字
</button>
```

**药丸按钮：**
```jsx
<button className="px-4 py-2 bg-white/[0.03] text-white/60 rounded-full text-sm hover:bg-white/[0.06] transition-all">
  标签文字
</button>
```

### 图标容器

**标准图标容器：**
```jsx
<div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
  <span className="material-symbols-outlined text-white/60 text-lg">
    icon_name
  </span>
</div>
```

**渐变图标容器（慎用）：**
```jsx
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center">
  <span className="material-symbols-outlined text-white/60">icon</span>
</div>
```

### 表单输入

```jsx
<input
  type="text"
  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white/80 text-sm focus:outline-none focus:border-violet-500/30 placeholder:text-white/20"
  placeholder="占位文字"
/>
```

### 标签/徽章

```jsx
<span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 text-xs font-medium">
  标签文字
</span>
```

---

## 动画规范

### 过渡时长

| 动画类型 | 时长 | Tailwind Class |
|----------|------|----------------|
| 微交互 | 150ms | `duration-150` |
| 标准过渡 | 300ms | `duration-300` |
| 页面过渡 | 500ms | `duration-500` |

### 缓动函数

```css
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
```

使用 Tailwind 默认缓动： `transition-all`, `transition-colors`

### 自定义动画

**淡入上移：**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 响应式断点

| 断点 | 最小宽度 | Tailwind Prefix |
|------|----------|-----------------|
| 移动端 | - | (default) |
| 平板 | 768px | `md:` |
| 桌面 | 1024px | `lg:` |
| 大屏 | 1280px | `xl:` |

---

## 可访问性

### Focus 状态

所有交互元素必须有可见的 focus 状态：

```jsx
className="focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:ring-offset-2 focus:ring-offset-black"
```

### 触摸目标

所有可点击元素最小尺寸 44x44px：

```jsx
className="min-w-[44px] min-h-[44px]"
```

### 对比度

- 正文文字对比度 >= 4.5:1
- 大文字对比度 >= 3:1
- UI 组件对比度 >= 3:1

---

## 禁用模式

### 避免使用

1. **Emoji 作为设计元素** - 使用图标代替
2. **渐变图标背景** - 使用纯色背景
3. **3 列对称布局** - 使用不对称布局
4. **统一圆角** - 根据元素类型使用不同圆角
5. **过度装饰** - 保持简约

### 推荐

1. 扁平背景 + 细边框
2. 微妙的透明度层次
3. 有意的留白
4. 清晰的视觉层级

---

## 文件结构

```
src/
├── app/
│   ├── sonic-gallery/create/    # 创作流程
│   │   ├── page.tsx
│   │   ├── create-context.tsx
│   │   ├── step-1-voice-cloning.tsx
│   │   ├── step-2-beat-dialect.tsx
│   │   ├── step-3-lyrics-generation.tsx
│   │   └── step-4-preview.tsx
│   └── api/                     # API Routes
├── components/
│   ├── features/                # 业务组件
│   └── ui/                      # 基础组件
├── lib/
│   ├── ai/                      # Claude 客户端 + Prompts
│   ├── audio/                   # Seed-VC, 音频处理
│   ├── music/                   # SunoAPI, BGM 库
│   ├── oss/                     # 阿里云 OSS
│   ├── services/                # Rap 生成编排
│   └── tts/                     # CosyVoice 声音复刻
└── types/                       # TypeScript 类型
```

---

## 更新日志

| 日期 | 版本 | 更改 |
|------|------|------|
| 2026-03-28 | 1.1 | 更新文件结构，反映当前架构 |
| 2026-03-22 | 1.0 | 初始设计系统文档 |
