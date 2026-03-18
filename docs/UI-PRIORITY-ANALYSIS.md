# WhyFire v2.0 UI 设计开发优先级分析

> 分析日期: 2026-03-18
> 分析范围: PRD + TDD UI 相关需求

---

## 1. UI 设计需求总结

### 1.1 设计风格要求

| 元素 | 规格 | 来源 |
|------|------|------|
| **主题** | 深色主题 (#111113) | PRD 3.3.1 |
| **主色** | #8B5CF6 (紫色) + #10B981 (绿色) | PRD 3.3.1 |
| **字体** | Inter / Geist | PRD 3.3.1 |
| **风格** | 科技感与创意感结合，参考 Neural Frames | PRD 3.3.1 |

### 1.2 Hero 区设计要求

| 元素 | 要求 | 是否可提前开发 |
|------|------|----------------|
| 动态视频背景 | 展示 Rap 视频生成过程 | ❌ 需要产品 Demo |
| 主标题 | 大字号渐变文字 | ✅ 可提前 |
| 副标题 | 简洁描述核心价值 | ✅ 可提前 |
| CTA 按钮 | 醒目的白色按钮 | ✅ 可提前 |
| 社会证明 | "Trusted by 10,000+ creators" | ⚠️ 占位数据 |
| 动态效果 | 背景视频循环播放 | ⚠️ 需要占位视频 |

**关键发现**：Hero 动态背景需要产品 Demo 视频，在产品未完成前无法制作。

### 1.3 AI 对话界面设计要求

| 元素 | 要求 | 是否可提前开发 |
|------|------|----------------|
| 布局 | 右侧固定对话框，左侧歌词预览区 | ✅ 可提前 |
| 输入框 | 底部固定，支持多行输入 | ✅ 可提前 |
| 快捷指令 | 输入框上方，常用操作按钮 | ✅ 可提前 |
| 对话气泡 | 区分用户/AI，不同颜色 | ✅ 可提前 |
| 歌词预览 | 实时更新，高亮最新修改 | ⚠️ 需要数据 |

### 1.4 TDD 组件清单

| 组件类型 | 组件列表 | MVP 优先级 |
|----------|----------|------------|
| **基础 UI** | Button, Input, Dialog, Textarea, Spinner, Avatar, DropdownMenu | **高** |
| **业务组件** | SceneSelector, DialectSelector, ChatPanel, LyricsPreview | **高** |
| **音乐模块** | MusicGenerationProgress | 中 |
| **视频模块** | VideoSynthesizer | 中 |
| **布局组件** | Header, Footer, Sidebar | **高** |

---

## 2. 是否需要提前开发 UI？

### 2.1 结论

**部分需要，但不建议完全提前开发**

| 类别 | 是否提前开发 | 理由 |
|------|--------------|------|
| **Design Tokens** | ✅ **建议提前** | 定义颜色、字体、间距等基础变量 |
| **基础 UI 组件** | ⚠️ **按需开发** | 不要过度设计，根据实际需求逐步添加 |
| **Hero 动态背景** | ❌ **不建议提前** | 需要产品 Demo 视频，使用占位图 |
| **业务组件** | ❌ **不建议提前** | 根据功能开发顺序实现 |
| **布局框架** | ✅ **建议提前** | Header、Footer 等通用布局 |

### 2.2 推荐的开发顺序

```
阶段 0: 设计基础 (可提前)
├── Design Tokens (颜色、字体、间距)
├── Tailwind 配置
└── 全局样式 (globals.css)

阶段 1: 布局框架 (MVP Week 1)
├── Header 组件
├── Footer 组件
└── 页面布局结构

阶段 2: 基础组件 (MVP Week 1-2)
├── Button 组件
├── Input 组件
├── Dialog 组件
└── 其他按需添加

阶段 3: 首页 UI (MVP Week 1)
├── Hero 区（使用占位视频/图片）
├── 功能介绍区
└── CTA 区域

阶段 4: 业务组件 (MVP Week 1-3)
├── SceneSelector
├── DialectSelector
├── ChatPanel
├── LyricsPreview
└── MusicGenerationProgress

阶段 5: Hero 动态背景 (MVP 完成后)
├── 使用产品生成 2-3 个精彩视频
├── 录屏并制作循环视频
└── 替换占位内容
```

---

## 3. 可以提前准备的内容

### 3.1 Design Tokens (推荐 ✅)

创建 `src/styles/tokens.css`:

```css
:root {
  /* Colors - Brand */
  --color-primary: #8B5CF6;
  --color-primary-hover: #7C3AED;
  --color-secondary: #10B981;
  --color-secondary-hover: #059669;

  /* Colors - Background */
  --color-background: #111113;
  --color-card: #1A1A1C;
  --color-card-hover: #222224;

  /* Colors - Border */
  --color-border: #2A2A2E;
  --color-border-hover: #3A3A3E;

  /* Colors - Text */
  --color-foreground: #FAFAFA;
  --color-muted: #71717A;

  /* Colors - Semantic */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Typography */
  --font-family: 'Inter', -apple-system, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-hero: 3.5rem;

  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 3.2 Tailwind 配置 (推荐 ✅)

更新 `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#111113",
        foreground: "#FAFAFA",
        card: "#1A1A1C",
        border: "#2A2A2E",
        muted: {
          DEFAULT: "#71717A",
          foreground: "#FAFAFA",
        },
        primary: {
          DEFAULT: "#8B5CF6",
          foreground: "#FFFFFF",
          hover: "#7C3AED",
        },
        secondary: {
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
          hover: "#059669",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 3.3 Hero 占位方案 (推荐 ✅)

在产品 Demo 完成前，使用以下占位方案：

**方案 1: 渐变背景 + 粒子效果**
```tsx
// components/home/hero-placeholder.tsx
export function HeroPlaceholder() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-primary/10 to-secondary/10">
      {/* 粒子效果 */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* 内容 */}
      <div className="relative z-10">
        {/* Hero 内容 */}
      </div>
    </div>
  )
}
```

**方案 2: 使用免费视频素材**
- Pexels: https://www.pexels.com/video/
- Videvo: https://www.videvo.net/
- 搜索关键词: "abstract", "technology", "music"

---

## 4. 不建议提前开发的内容

| 内容 | 理由 | 替代方案 |
|------|------|----------|
| **Hero 动态背景视频** | 需要产品 Demo，提前制作不真实 | 使用渐变背景 + 粒子效果 |
| **完整组件库** | 过度设计，增加维护成本 | 按需开发，使用 shadcn/ui |
| **业务组件** | 需求可能变化，过早投入浪费 | 根据功能开发顺序实现 |
| **复杂动画** | 开发成本高，MVP 优先级低 | 使用简单过渡动画 |

---

## 5. 最终建议

### 5.1 立即可做 (1-2 小时)

1. ✅ 定义 Design Tokens
2. ✅ 更新 Tailwind 配置
3. ✅ 设置字体 (Inter)
4. ✅ 创建基础全局样式

### 5.2 MVP Week 1 (2-3 天)

1. ✅ 创建 Header/Footer 布局
2. ✅ 实现 Hero 区（占位背景）
3. ✅ 开发 Button、Input 基础组件
4. ✅ 实现场景选择组件

### 5.3 MVP Week 2-3 (按需)

1. ✅ AI 对话界面
2. ✅ 方言选择组件
3. ✅ 其他业务组件
4. ✅ Hero 动态背景（产品 Demo 后）

### 5.4 不要做

1. ❌ 提前制作完整组件库
2. ❌ 过度设计动画效果
3. ❌ 在没有产品 Demo 前制作 Hero 视频
4. ❌ 开发暂时用不到的组件

---

## 6. 工具推荐

| 工具 | 用途 | 链接 |
|------|------|------|
| **shadcn/ui** | React 组件库（按需复制） | https://ui.shadcn.com/ |
| **CVA** | 组件变体管理 | https://cva.style/ |
| **Tailwind CSS** | 样式框架 | https://tailwindcss.com/ |
| **Framer Motion** | 动画库 | https://www.framer.com/motion/ |
| **Lucide Icons** | 图标库 | https://lucide.dev/ |

---

## 7. 下一步行动

### 立即执行 (推荐)

```bash
# 1. 安装依赖
pnpm add class-variance-authority clsx tailwind-merge framer-motion lucide-react

# 2. 创建 Design Tokens 文件
# 见上文 3.1

# 3. 更新 Tailwind 配置
# 见上文 3.2

# 4. 创建基础工具函数
# lib/utils.ts - cn() 函数
```

### 按需开发

- 根据 TDD-components.md 中的代码示例逐步实现
- 遵循 YAGNI 原则：只开发当前需要的组件
- 使用 shadcn/ui 作为基础，避免重复造轮子

---

**总结**：UI 设计需要提前定义 Design Tokens 和 Tailwind 配置，但不建议完全提前开发所有组件。应该采用渐进式开发，根据 MVP 功能需求逐步实现，避免过度设计。
