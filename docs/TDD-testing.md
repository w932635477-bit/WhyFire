# WhyFire v2.0 组件测试指南

> 返回 [TDD 主文档](./TDD.md)

---

## 1. 测试技术栈

| 工具 | 用途 |
|------|------|
| **Vitest** | 测试运行器 |
| **React Testing Library** | 组件测试工具 |
| **MSW** | API Mock |
| **@testing-library/user-event** | 用户交互模拟 |
| **@vitest/coverage-v8** | 代码覆盖率 |

---

## 2. 测试配置

### 2.1 Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2.2 测试设置文件

```typescript
// tests/setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'

// 每个测试后清理
afterEach(() => {
  cleanup()
})

// MSW 服务器设置
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())
```

### 2.3 MSW Mock 配置

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw'

export const handlers = [
  // 认证接口
  http.post('/api/auth/login', async () => {
    await delay(100)
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          nickname: 'Test User',
          role: 'user',
        },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
      },
    })
  }),

  // 用户信息接口
  http.get('/api/user/profile', async () => {
    await delay(50)
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        nickname: 'Test User',
        points: { balance: 50, totalEarned: 100, totalSpent: 50 },
        subscription: { planType: 'free', status: 'active' },
      },
    })
  }),

  // 歌词生成接口
  http.post('/api/lyrics/generate', async () => {
    await delay(200)
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: {
        lyricsId: 'test-lyrics-id',
        content: '测试歌词内容\n第二行歌词',
        wordCount: 100,
        estimatedDuration: 28,
        dialect: 'mandarin',
      },
    })
  }),

  // 积分余额接口
  http.get('/api/points/balance', async () => {
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { balance: 50, totalEarned: 100, totalSpent: 50 },
    })
  }),
]
```

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

---

## 3. 组件测试示例

### 3.1 Button 组件测试

```typescript
// components/ui/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="default">Default</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-secondary')

    rerender(<Button variant="destructive">Destructive</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  it('applies size styles correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-8')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-10')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-12')
  })

  it('is disabled when disabled prop is true', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

### 3.2 SceneSelector 组件测试

```typescript
// components/features/__tests__/scene-selector.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SceneSelector } from '../scene-selector'
import type { SceneType } from '@/types'

describe('SceneSelector', () => {
  it('renders all scene options', () => {
    const handleChange = vi.fn()
    render(<SceneSelector onChange={handleChange} />)

    expect(screen.getByText('产品推广')).toBeInTheDocument()
    expect(screen.getByText('搞笑洗脑')).toBeInTheDocument()
    expect(screen.getByText('IP 混剪')).toBeInTheDocument()
    expect(screen.getByText('日常 Vlog')).toBeInTheDocument()
  })

  it('calls onChange when scene is selected', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<SceneSelector onChange={handleChange} />)

    await user.click(screen.getByText('产品推广'))
    expect(handleChange).toHaveBeenCalledWith('product')
  })

  it('highlights selected scene', () => {
    const handleChange = vi.fn()

    const { container } = render(
      <SceneSelector value="product" onChange={handleChange} />
    )

    const selectedButton = screen.getByText('产品推广').closest('button')
    expect(selectedButton).toHaveClass('border-primary')
  })

  it('shows preview video on hover', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<SceneSelector onChange={handleChange} />)

    const productButton = screen.getByText('产品推广').closest('button')!
    await user.hover(productButton)

    // 验证视频元素存在（如果有预览视频）
    const video = productButton.querySelector('video')
    // 如果实现了视频预览，这里应该验证
    // expect(video).toBeInTheDocument()
  })
})
```

### 3.3 DialectSelector 组件测试

```typescript
// components/features/__tests__/dialect-selector.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DialectSelector } from '../dialect-selector'

describe('DialectSelector', () => {
  it('renders all dialect options', () => {
    const handleChange = vi.fn()
    render(<DialectSelector onChange={handleChange} />)

    expect(screen.getByText('普通话')).toBeInTheDocument()
    expect(screen.getByText('粤语')).toBeInTheDocument()
    expect(screen.getByText('东北话')).toBeInTheDocument()
    expect(screen.getByText('四川话')).toBeInTheDocument()
  })

  it('calls onChange when dialect is selected', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<DialectSelector onChange={handleChange} />)

    await user.click(screen.getByText('普通话'))
    expect(handleChange).toHaveBeenCalledWith('mandarin')
  })

  it('shows PRO badge for unavailable dialects', () => {
    const handleChange = vi.fn()
    render(<DialectSelector onChange={handleChange} showPremium />)

    // 东北话和四川话在 MVP 不可用
    const dongbeiButton = screen.getByText('东北话').closest('button')
    expect(dongbeiButton).toHaveClass('opacity-50')
    expect(screen.getByText('PRO')).toBeInTheDocument()
  })

  it('highlights selected dialect', () => {
    const handleChange = vi.fn()
    render(<DialectSelector value="cantonese" onChange={handleChange} />)

    const cantoneseButton = screen.getByText('粤语').closest('button')
    expect(cantoneseButton).toHaveClass('bg-primary')
  })
})
```

### 3.4 ChatPanel 组件测试

```typescript
// components/features/lyrics/__tests__/chat-panel.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ChatPanel } from '../chat-panel'

describe('ChatPanel', () => {
  const mockMessages = [
    { id: '1', role: 'assistant' as const, content: '您好！请告诉我您想要什么样的歌词？', timestamp: new Date() },
    { id: '2', role: 'user' as const, content: '帮我写一个产品推广的歌词', timestamp: new Date() },
    { id: '3', role: 'assistant' as const, content: '好的，请告诉我产品名称和特点...', timestamp: new Date() },
  ]

  it('renders messages correctly', () => {
    const handleSend = vi.fn()
    render(<ChatPanel messages={mockMessages} onSend={handleSend} isLoading={false} />)

    expect(screen.getByText('您好！请告诉我您想要什么样的歌词？')).toBeInTheDocument()
    expect(screen.getByText('帮我写一个产品推广的歌词')).toBeInTheDocument()
  })

  it('sends message on form submit', async () => {
    const user = userEvent.setup()
    const handleSend = vi.fn()

    render(<ChatPanel messages={mockMessages} onSend={handleSend} isLoading={false} />)

    const input = screen.getByPlaceholderText(/告诉 AI 你想要的修改/i)
    await user.type(input, '再搞笑一点')
    await user.click(screen.getByText('发送'))

    expect(handleSend).toHaveBeenCalledWith('再搞笑一点')
  })

  it('shows loading indicator when isLoading is true', () => {
    const handleSend = vi.fn()
    render(<ChatPanel messages={mockMessages} onSend={handleSend} isLoading={true} />)

    // 查找加载动画的三个点
    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots.length).toBeGreaterThan(0)
  })

  it('disables send button when input is empty', async () => {
    const user = userEvent.setup()
    const handleSend = vi.fn()

    render(<ChatPanel messages={mockMessages} onSend={handleSend} isLoading={false} />)

    const sendButton = screen.getByText('发送')
    expect(sendButton).toBeDisabled()
  })

  it('renders suggestion buttons when provided', () => {
    const handleSend = vi.fn()
    const suggestions = ['再搞笑一点', '节奏快一点', '换一种风格']

    render(
      <ChatPanel
        messages={mockMessages}
        onSend={handleSend}
        isLoading={false}
        suggestions={suggestions}
      />
    )

    suggestions.forEach(suggestion => {
      expect(screen.getByText(suggestion)).toBeInTheDocument()
    })
  })

  it('fills input when suggestion is clicked', async () => {
    const user = userEvent.setup()
    const handleSend = vi.fn()
    const suggestions = ['再搞笑一点']

    render(
      <ChatPanel
        messages={mockMessages}
        onSend={handleSend}
        isLoading={false}
        suggestions={suggestions}
      />
    )

    await user.click(screen.getByText('再搞笑一点'))

    const input = screen.getByPlaceholderText(/告诉 AI 你想要的修改/i) as HTMLTextAreaElement
    expect(input.value).toBe('再搞笑一点')
  })
})
```

### 3.5 MusicGenerationProgress 组件测试

```typescript
// components/features/music/__tests__/music-generation-progress.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MusicGenerationProgress } from '../music-generation-progress'
import { server } from '@/tests/mocks/server'
import { http, HttpResponse, delay } from 'msw'

describe('MusicGenerationProgress', () => {
  it('renders initial state correctly', () => {
    const onComplete = vi.fn()
    const onError = vi.fn()

    render(
      <MusicGenerationProgress
        taskId="test-task-id"
        onComplete={onComplete}
        onError={onError}
      />
    )

    expect(screen.getByText('正在生成音乐')).toBeInTheDocument()
    expect(screen.getByText(/预计等待时间/)).toBeInTheDocument()
  })

  it('updates progress on status change', async () => {
    const onComplete = vi.fn()
    const onError = vi.fn()

    // Mock 响应
    server.use(
      http.get('/api/music/status/:taskId', async () => {
        await delay(50)
        return HttpResponse.json({
          code: 0,
          data: {
            taskId: 'test-task-id',
            status: 'processing',
            progress: 60,
            message: '正在生成伴奏...',
          },
        })
      })
    )

    render(
      <MusicGenerationProgress
        taskId="test-task-id"
        onComplete={onComplete}
        onError={onError}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('60% 完成')).toBeInTheDocument()
    })
  })

  it('calls onComplete when generation finishes', async () => {
    const onComplete = vi.fn()
    const onError = vi.fn()
    const musicUrl = 'https://example.com/music.mp3'

    server.use(
      http.get('/api/music/status/:taskId', async () => {
        await delay(50)
        return HttpResponse.json({
          code: 0,
          data: {
            taskId: 'test-task-id',
            status: 'completed',
            progress: 100,
            musicUrl,
          },
        })
      })
    )

    render(
      <MusicGenerationProgress
        taskId="test-task-id"
        onComplete={onComplete}
        onError={onError}
      />
    )

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(musicUrl)
    }, { timeout: 5000 })
  })

  it('calls onError when generation fails', async () => {
    const onComplete = vi.fn()
    const onError = vi.fn()
    const errorMessage = '音乐生成失败'

    server.use(
      http.get('/api/music/status/:taskId', async () => {
        await delay(50)
        return HttpResponse.json({
          code: 0,
          data: {
            taskId: 'test-task-id',
            status: 'failed',
            error: errorMessage,
          },
        })
      })
    )

    render(
      <MusicGenerationProgress
        taskId="test-task-id"
        onComplete={onComplete}
        onError={onError}
      />
    )

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(errorMessage)
    }, { timeout: 5000 })
  })
})
```

---

## 4. 自定义 Hook 测试

### 4.1 useAuth Hook 测试

```typescript
// hooks/__tests__/use-auth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '../use-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null user when not authenticated', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('provides login method', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('test@example.com', '123456')
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })
  })
})
```

### 4.2 useVideoCreationStore 测试

```typescript
// stores/__tests__/video-creation-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useVideoCreationStore } from '../video-creation-store'
import { act } from '@testing-library/react'

describe('useVideoCreationStore', () => {
  beforeEach(() => {
    // 重置 store
    useVideoCreationStore.getState().reset()
  })

  it('initializes with correct default values', () => {
    const state = useVideoCreationStore.getState()

    expect(state.currentStep).toBe('scene')
    expect(state.scene).toBeNull()
    expect(state.dialect).toBe('mandarin')
  })

  it('updates scene correctly', () => {
    act(() => {
      useVideoCreationStore.getState().setScene('product')
    })

    expect(useVideoCreationStore.getState().scene).toBe('product')
  })

  it('updates dialect correctly', () => {
    act(() => {
      useVideoCreationStore.getState().setDialect('cantonese')
    })

    expect(useVideoCreationStore.getState().dialect).toBe('cantonese')
  })

  it('updates step correctly', () => {
    act(() => {
      useVideoCreationStore.getState().setStep('lyrics')
    })

    expect(useVideoCreationStore.getState().currentStep).toBe('lyrics')
  })

  it('updates lyrics correctly', () => {
    act(() => {
      useVideoCreationStore.getState().setLyrics('lyrics-id', '歌词内容')
    })

    const state = useVideoCreationStore.getState()
    expect(state.lyricsId).toBe('lyrics-id')
    expect(state.lyricsContent).toBe('歌词内容')
  })

  it('resets to initial state', () => {
    act(() => {
      useVideoCreationStore.getState().setScene('product')
      useVideoCreationStore.getState().setDialect('cantonese')
      useVideoCreationStore.getState().setStep('lyrics')
    })

    act(() => {
      useVideoCreationStore.getState().reset()
    })

    const state = useVideoCreationStore.getState()
    expect(state.currentStep).toBe('scene')
    expect(state.scene).toBeNull()
    expect(state.dialect).toBe('mandarin')
  })
})
```

---

## 5. 集成测试示例

### 5.1 歌词生成流程集成测试

```typescript
// tests/integration/lyrics-generation.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { LyricsCreationFlow } from '@/components/features/lyrics/lyrics-creation-flow'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Lyrics Generation Flow', () => {
  it('completes full lyrics generation flow', async () => {
    const user = userEvent.setup()
    const wrapper = createWrapper()

    render(<LyricsCreationFlow />, { wrapper })

    // Step 1: 选择场景
    await user.click(screen.getByText('产品推广'))

    // Step 2: 选择方言
    await user.click(screen.getByText('普通话'))

    // Step 3: 输入产品信息
    const productNameInput = screen.getByLabelText(/产品名称/i)
    await user.type(productNameInput, '星空手机壳')

    // Step 4: 生成歌词
    await user.click(screen.getByText('生成歌词'))

    // 等待歌词生成完成
    await waitFor(() => {
      expect(screen.getByText(/歌词内容/i)).toBeInTheDocument()
    })
  })
})
```

---

## 6. 测试覆盖率目标

| 模块 | 目标覆盖率 |
|------|------------|
| 工具函数 (lib/) | > 90% |
| UI 组件 (components/ui/) | > 80% |
| 业务组件 (components/features/) | > 70% |
| Hooks (hooks/) | > 85% |
| Stores (stores/) | > 90% |

---

## 7. 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行特定文件测试
pnpm test button.test.tsx

# 监听模式
pnpm test --watch
```

---

*返回 [TDD 主文档](./TDD.md)*
