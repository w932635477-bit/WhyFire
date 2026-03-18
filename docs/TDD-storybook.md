# WhyFire v2.0 Storybook 组件文档

> 返回 [TDD 主文档](./TDD.md)

---

## 1. Storybook 简介

Storybook 是一个用于独立开发和展示 UI 组件的工具，支持：
- 组件可视化展示
- 交互式文档
- 组件状态测试
- 可访问性检查
- 视觉回归测试

---

## 2. 安装配置

### 2.1 安装

```bash
# 初始化 Storybook
pnpm dlx storybook@latest init

# 或手动安装
pnpm add -D @storybook/react @storybook/react-vite @storybook/addon-essentials
```

### 2.2 配置文件

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': '/src',
        },
      },
    }
  },
}

export default config
```

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111113' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    themes: {
      default: 'dark',
      list: [
        { name: 'dark', class: 'dark', color: '#111113' },
        { name: 'light', class: 'light', color: '#ffffff' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-background text-foreground min-h-screen p-4">
        <Story />
      </div>
    ),
  ],
}

export default preview
```

---

## 3. 组件 Stories 示例

### 3.1 Button 组件

```typescript
// src/components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/xxx/WhyFire-Design-System',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive'],
      description: '按钮样式变体',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: '按钮尺寸',
    },
    loading: {
      control: 'boolean',
      description: '加载状态',
    },
    disabled: {
      control: 'boolean',
      description: '禁用状态',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: '默认按钮',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '次要按钮',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '边框按钮',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: '幽灵按钮',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: '危险按钮',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: '小按钮',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: '大按钮',
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    children: '加载中',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: '禁用按钮',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}
```

### 3.2 Input 组件

```typescript
// src/components/ui/input.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { Mail, Search } from 'lucide-react'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number'],
    },
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    error: {
      control: 'text',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: '请输入内容...',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <label className="text-sm font-medium">用户名</label>
      <Input placeholder="请输入用户名" />
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    placeholder: '搜索...',
    icon: <Search className="h-4 w-4" />,
  },
}

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: '请输入邮箱',
    icon: <Mail className="h-4 w-4" />,
  },
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: '请输入密码',
  },
}

export const WithError: Story = {
  args: {
    placeholder: '请输入邮箱',
    error: '邮箱格式不正确',
    defaultValue: 'invalid-email',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: '禁用状态',
    disabled: true,
  },
}

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">邮箱</label>
        <Input type="email" placeholder="your@email.com" icon={<Mail className="h-4 w-4" />} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">密码</label>
        <Input type="password" placeholder="••••••••" />
      </div>
    </div>
  ),
}
```

### 3.3 SceneSelector 组件

```typescript
// src/components/features/scene-selector.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { SceneSelector } from './scene-selector'

const meta = {
  title: 'Features/SceneSelector',
  component: SceneSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '场景选择器组件，用于选择视频创作场景类型。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'select',
      options: ['product', 'funny', 'ip', 'vlog', null],
      description: '当前选中的场景',
    },
    onChange: {
      action: 'changed',
      description: '场景变更回调',
    },
  },
} satisfies Meta<typeof SceneSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onChange: fn(),
  },
}

export const WithProductSelected: Story = {
  args: {
    value: 'product',
    onChange: fn(),
  },
}

export const WithFunnySelected: Story = {
  args: {
    value: 'funny',
    onChange: fn(),
  },
}

export const Interactive: Story = {
  args: {
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    // 添加交互测试
  },
}
```

### 3.4 DialectSelector 组件

```typescript
// src/components/features/dialect-selector.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { DialectSelector } from './dialect-selector'

const meta = {
  title: 'Features/DialectSelector',
  component: DialectSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '方言选择器组件，支持普通话、粤语、东北话、四川话等方言选择。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'select',
      options: ['mandarin', 'cantonese', 'dongbei', 'sichuan'],
    },
    showPremium: {
      control: 'boolean',
      description: '是否显示 PRO 标签',
    },
  },
} satisfies Meta<typeof DialectSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onChange: fn(),
  },
}

export const WithPremiumBadge: Story = {
  args: {
    showPremium: true,
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '显示 PRO 标签，标记 MVP 阶段不可用的方言选项（东北话、四川话）。',
      },
    },
  },
}

export const CantoneseSelected: Story = {
  args: {
    value: 'cantonese',
    onChange: fn(),
  },
}

export const AllSelected: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-sm font-medium">普通话</h3>
        <DialectSelector value="mandarin" onChange={fn()} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium">粤语</h3>
        <DialectSelector value="cantonese" onChange={fn()} />
      </div>
    </div>
  ),
}
```

### 3.5 ChatPanel 组件

```typescript
// src/components/features/lyrics/chat-panel.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { ChatPanel } from './chat-panel'

const meta = {
  title: 'Features/Lyrics/ChatPanel',
  component: ChatPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'AI 对话面板组件，用于与 AI 进行歌词创作对话。',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[500px] w-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatPanel>

export default meta
type Story = StoryObj<typeof meta>

const sampleMessages = [
  {
    id: '1',
    role: 'assistant' as const,
    content: '您好！我是您的歌词创作助手。请告诉我您想要什么样的歌词？',
    timestamp: new Date('2024-01-01T10:00:00'),
  },
  {
    id: '2',
    role: 'user' as const,
    content: '帮我写一个产品推广的歌词，产品是手机壳',
    timestamp: new Date('2024-01-01T10:01:00'),
  },
  {
    id: '3',
    role: 'assistant' as const,
    content: `好的！为您创作一段手机壳推广歌词：

"手机壳 真带劲
保护手机第一名
轻薄又时尚
颜色多彩任你挑

星空图案最亮眼
拿在手里像神仙
防摔耐磨品质好
价格实惠人人爱"`,
    timestamp: new Date('2024-01-01T10:02:00'),
  },
]

export const Default: Story = {
  args: {
    messages: [],
    onSend: fn(),
    isLoading: false,
  },
}

export const WithConversation: Story = {
  args: {
    messages: sampleMessages,
    onSend: fn(),
    isLoading: false,
  },
}

export const WithSuggestions: Story = {
  args: {
    messages: sampleMessages,
    onSend: fn(),
    isLoading: false,
    suggestions: ['再搞笑一点', '节奏快一点', '换一种风格', '加入押韵'],
  },
}

export const Loading: Story = {
  args: {
    messages: sampleMessages,
    onSend: fn(),
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'AI 正在生成回复时的加载状态。',
      },
    },
  },
}

export const EmptyState: Story = {
  args: {
    messages: [],
    onSend: fn(),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: '空状态，用户开始新的对话。',
      },
    },
  },
}
```

---

## 4. 文档页面

### 4.1 Introduction 文档

```mdx
<!-- src/stories/Introduction.mdx -->
import { Meta } from '@storybook/blocks'

<Meta title="Documentation/Introduction" />

# WhyFire 组件库

欢迎来到 WhyFire 设计系统组件库文档。

## 设计原则

### 深色主题优先

WhyFire 采用深色主题作为默认设计，营造科技感与创意氛围。

- 背景色: `#111113`
- 主色: `#8B5CF6` (紫色)
- 辅色: `#10B981` (绿色)

### 组件分类

| 分类 | 说明 |
|------|------|
| **UI** | 基础 UI 组件（Button, Input, Dialog 等） |
| **Features** | 业务功能组件（SceneSelector, ChatPanel 等） |
| **Layout** | 布局组件（Header, Footer 等） |

## 技术栈

- React 18
- TypeScript 5
- Tailwind CSS 3
- Framer Motion 11
```

### 4.2 颜色系统文档

```mdx
<!-- src/stories/Colors.mdx -->
import { Meta, ColorPalette } from '@storybook/blocks'

<Meta title="Design/Colors" />

# 颜色系统

## 主色调

<ColorPalette>
  <ColorPalette.Item name="Primary" value="#8B5CF6">
    主要按钮、链接、强调元素
  </ColorPalette.Item>
  <ColorPalette.Item name="Secondary" value="#10B981">
    成功状态、辅助强调
  </ColorPalette.Item>
</ColorPalette>

## 语义色

<ColorPalette>
  <ColorPalette.Item name="Success" value="#22C55E">
    成功操作、完成状态
  </ColorPalette.Item>
  <ColorPalette.Item name="Warning" value="#F59E0B">
    警告提示、注意信息
  </ColorPalette.Item>
  <ColorPalette.Item name="Error" value="#EF4444">
    错误提示、危险操作
  </ColorPalette.Item>
  <ColorPalette.Item name="Info" value="#3B82F6">
    信息提示、帮助说明
  </ColorPalette.Item>
</ColorPalette>

## 中性色

<ColorPalette>
  <ColorPalette.Item name="Background" value="#111113">
    页面背景
  </ColorPalette.Item>
  <ColorPalette.Item name="Card" value="#1A1A1C">
    卡片背景
  </ColorPalette.Item>
  <ColorPalette.Item name="Border" value="#2A2A2E">
    边框颜色
  </ColorPalette.Item>
  <ColorPalette.Item name="Muted" value="#71717A">
    次要文字
  </ColorPalette.Item>
  <ColorPalette.Item name="Foreground" value="#FAFAFA">
    主要文字
  </ColorPalette.Item>
</ColorPalette>
```

---

## 5. 运行 Storybook

```bash
# 启动开发服务器
pnpm storybook

# 构建静态版本
pnpm build-storybook

# 运行 Chromatic 测试
pnpm chromatic
```

---

*返回 [TDD 主文档](./TDD.md)*
