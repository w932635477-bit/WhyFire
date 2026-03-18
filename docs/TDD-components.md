# WhyFire v2.0 组件设计

> 返回 [TDD 主文档](./TDD.md)

---

## 1. 组件架构概览

### 1.1 组件分层

```
components/
├── ui/                    # 基础 UI 组件（通用）
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── features/              # 业务功能组件（领域特定）
│   ├── lyrics/
│   ├── music/
│   ├── video/
│   └── payment/
├── layout/                # 布局组件
│   ├── header.tsx
│   ├── footer.tsx
│   ├── sidebar.tsx
│   └── ...
├── providers/             # Context Providers
│   ├── auth-provider.tsx
│   ├── theme-provider.tsx
│   └── ...
└── shared/                # 共享组件
    ├── loading.tsx
    ├── error-boundary.tsx
    └── ...
```

### 1.2 组件设计原则

| 原则 | 说明 |
|------|------|
| **单一职责** | 每个组件只做一件事 |
| **可组合** | 小组件组合成大组件 |
| **可测试** | 组件易于单元测试 |
| **性能优先** | 使用 memo、useMemo 优化 |
| **类型安全** | 完整的 TypeScript 类型 |

---

## 2. 基础 UI 组件

### 2.1 Button 组件

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/80',
        outline: 'border border-border bg-transparent hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({
  className,
  variant,
  size,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
```

### 2.2 Input 组件

```typescript
// components/ui/input.tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background file:border-0 file:bg-transparent',
            'placeholder:text-muted-foreground focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-10',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
```

### 2.3 Dialog 组件

```typescript
// components/ui/dialog.tsx
'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
        'gap-4 border bg-background p-6 shadow-lg duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        'rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export { Dialog, DialogTrigger, DialogContent, DialogClose }
```

---

## 3. 业务功能组件

### 3.1 场景选择组件

```typescript
// components/features/scene-selector.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { SceneType } from '@/types'

interface Scene {
  id: SceneType
  name: string
  description: string
  icon: React.ReactNode
  preview: string
}

const scenes: Scene[] = [
  {
    id: 'product',
    name: '产品推广',
    description: '为产品创建 Rap 推广视频',
    icon: <PackageIcon />,
    preview: '/previews/product.mp4',
  },
  {
    id: 'funny',
    name: '搞笑洗脑',
    description: '制作搞笑、病毒式传播视频',
    icon: <SmileIcon />,
    preview: '/previews/funny.mp4',
  },
  {
    id: 'ip',
    name: 'IP 混剪',
    description: '结合热门 IP 制作混剪视频',
    icon: <FilmIcon />,
    preview: '/previews/ip.mp4',
  },
  {
    id: 'vlog',
    name: '日常 Vlog',
    description: '为日常生活添加 Rap 元素',
    icon: <CameraIcon />,
    preview: '/previews/vlog.mp4',
  },
]

interface SceneSelectorProps {
  value?: SceneType
  onChange: (scene: SceneType) => void
}

export function SceneSelector({ value, onChange }: SceneSelectorProps) {
  const [hoveredScene, setHoveredScene] = useState<SceneType | null>(null)

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {scenes.map((scene) => (
        <motion.button
          key={scene.id}
          onClick={() => onChange(scene.id)}
          onMouseEnter={() => setHoveredScene(scene.id)}
          onMouseLeave={() => setHoveredScene(null)}
          className={cn(
            'relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all',
            'hover:border-primary/50 hover:shadow-lg',
            value === scene.id
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* 背景预览 */}
          {(hoveredScene === scene.id || value === scene.id) && (
            <video
              src={scene.preview}
              autoPlay
              loop
              muted
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
          )}

          {/* 内容 */}
          <div className="relative z-10">
            <div className="mb-2 text-3xl">{scene.icon}</div>
            <h3 className="font-semibold">{scene.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {scene.description}
            </p>
          </div>

          {/* 选中指示器 */}
          {value === scene.id && (
            <motion.div
              layoutId="scene-selector"
              className="absolute right-2 top-2 h-6 w-6 rounded-full bg-primary"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <CheckIcon className="h-full w-full p-1 text-white" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  )
}
```

### 3.2 方言选择组件

```typescript
// components/features/dialect-selector.tsx
'use client'

import { cn } from '@/lib/utils'
import type { DialectType } from '@/types'

interface DialectOption {
  id: DialectType
  name: string
  nativeName: string
  flag: string
  available: boolean
}

const dialects: DialectOption[] = [
  { id: 'mandarin', name: '普通话', nativeName: '普通話', flag: '🇨🇳', available: true },
  { id: 'cantonese', name: '粤语', nativeName: '粵語', flag: '🇭🇰', available: true },
  { id: 'dongbei', name: '东北话', nativeName: '東北話', flag: '⛄', available: false },
  { id: 'sichuan', name: '四川话', nativeName: '四川話', flag: '🐼', available: false },
]

interface DialectSelectorProps {
  value?: DialectType
  onChange: (dialect: DialectType) => void
  showPremium?: boolean
}

export function DialectSelector({
  value,
  onChange,
  showPremium = false
}: DialectSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {dialects.map((dialect) => (
        <button
          key={dialect.id}
          onClick={() => dialect.available && onChange(dialect.id)}
          disabled={!dialect.available}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
            'border-2',
            value === dialect.id
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-card hover:border-primary/50',
            !dialect.available && 'cursor-not-allowed opacity-50'
          )}
        >
          <span>{dialect.flag}</span>
          <span>{dialect.name}</span>
          {!dialect.available && showPremium && (
            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
              PRO
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
```

### 3.3 AI 对话组件

```typescript
// components/features/lyrics/chat-panel.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  messages: Message[]
  onSend: (message: string) => void
  isLoading: boolean
  suggestions?: string[]
}

export function ChatPanel({
  messages,
  onSend,
  isLoading,
  suggestions = [],
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSend(input.trim())
      setInput('')
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'mb-4 flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-muted'
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 快捷建议 */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t px-4 py-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/80"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="告诉 AI 你想要的修改..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            发送
          </Button>
        </div>
      </form>
    </div>
  )
}
```

### 3.4 歌词预览组件

```typescript
// components/features/lyrics/lyrics-preview.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface LyricLine {
  text: string
  startTime: number
  endTime: number
}

interface LyricsPreviewProps {
  lyrics: LyricLine[]
  currentTime: number
  isPlaying: boolean
}

export function LyricsPreview({ lyrics, currentTime, isPlaying }: LyricsPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 找到当前播放的行
  const currentLineIndex = lyrics.findIndex(
    (line) => currentTime >= line.startTime && currentTime < line.endTime
  )

  // 自动滚动到当前行
  useEffect(() => {
    if (currentLineIndex >= 0 && containerRef.current) {
      const lineElement = containerRef.current.children[currentLineIndex] as HTMLElement
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentLineIndex])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto p-4"
    >
      {lyrics.map((line, index) => {
        const isActive = index === currentLineIndex
        const isPast = currentTime >= line.endTime

        return (
          <motion.p
            key={index}
            className={cn(
              'mb-4 cursor-pointer text-lg transition-all',
              isActive && 'text-2xl font-bold text-primary',
              isPast && 'text-muted-foreground',
              !isActive && !isPast && 'text-foreground'
            )}
            animate={{
              scale: isActive ? 1.05 : 1,
            }}
            onClick={() => {
              // 点击跳转到该行
              // onSeek(line.startTime)
            }}
          >
            {line.text}
          </motion.p>
        )
      })}
    </div>
  )
}
```

### 3.5 音乐生成进度组件

```typescript
// components/features/music/music-generation-progress.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface MusicGenerationProgressProps {
  taskId: string
  onComplete: (musicUrl: string) => void
  onError: (error: string) => void
}

export function MusicGenerationProgress({
  taskId,
  onComplete,
  onError,
}: MusicGenerationProgressProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('正在准备...')

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/music/status/${taskId}`)
        const data = await response.json()

        setStatus(data.data.status)
        setProgress(data.data.progress)
        setMessage(data.data.message || '处理中...')

        if (data.data.status === 'completed') {
          clearInterval(pollInterval)
          onComplete(data.data.musicUrl)
        } else if (data.data.status === 'failed') {
          clearInterval(pollInterval)
          onError(data.data.error || '音乐生成失败')
        }
      } catch (error) {
        console.error('Poll error:', error)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [taskId, onComplete, onError])

  const stages = [
    { name: '准备中', progress: 0 },
    { name: '生成伴奏', progress: 30 },
    { name: '合成人声', progress: 60 },
    { name: '混音处理', progress: 90 },
    { name: '完成', progress: 100 },
  ]

  const currentStage = stages.find((s) => progress <= s.progress) || stages[stages.length - 1]

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="inline-block"
        >
          <MusicIcon className="h-12 w-12 text-primary" />
        </motion.div>
        <h3 className="mt-4 text-lg font-semibold">正在生成音乐</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {progress}% 完成
        </p>
      </div>

      {/* 阶段指示器 */}
      <div className="flex justify-between">
        {stages.map((stage, index) => (
          <div
            key={stage.name}
            className={cn(
              'flex flex-col items-center',
              progress >= stage.progress - 10
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                progress >= stage.progress - 10
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
            />
            <span className="mt-1 text-xs">{stage.name}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        预计等待时间：20-40 秒
      </p>
    </div>
  )
}
```

### 3.6 视频合成组件 (FFmpeg.wasm)

```typescript
// components/features/video/video-synthesizer.tsx
'use client'

import { useState, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface VideoSynthesizerProps {
  config: VideoConfig
  onComplete: (videoBlob: Blob) => void
  onError: (error: string) => void
}

interface VideoConfig {
  musicUrl: string
  mediaFiles: MediaFile[]
  lyrics: LyricsWithTimestamp
  subtitleStyle: SubtitleStyle
  effects: Effects
  output: OutputConfig
}

export function VideoSynthesizer({
  config,
  onComplete,
  onError,
}: VideoSynthesizerProps) {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  // 加载 FFmpeg
  const loadFFmpeg = useCallback(async () => {
    const ffmpegInstance = new FFmpeg()
    ffmpegInstance.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100))
    })
    ffmpegInstance.on('log', ({ message }) => {
      setMessage(message)
    })

    await ffmpegInstance.load({
      coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
    })

    setFfmpeg(ffmpegInstance)
  }, [])

  // 合成视频
  const synthesize = useCallback(async () => {
    if (!ffmpeg) {
      await loadFFmpeg()
    }

    setLoading(true)
    setProgress(0)

    try {
      // 1. 下载所有素材
      setMessage('下载素材中...')
      for (const file of config.mediaFiles) {
        ffmpeg!.writeFile(
          file.name,
          await fetchFile(file.url)
        )
      }
      ffmpeg!.writeFile('music.mp3', await fetchFile(config.musicUrl))

      // 2. 生成字幕帧
      setMessage('生成字幕帧...')
      await generateSubtitleFrames(ffmpeg!, config.lyrics, config.subtitleStyle)

      // 3. 合成视频
      setMessage('合成视频中...')
      const outputFileName = 'output.mp4'

      await ffmpeg!.exec([
        '-i', 'input.mp4',
        '-i', 'music.mp3',
        '-i', 'subtitle_%04d.png',
        '-filter_complex',
        '[0:v][2:v]overlay=0:0[outv]',
        '-map', '[outv]',
        '-map', '1:a',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-shortest',
        outputFileName,
      ])

      // 4. 读取输出
      const data = await ffmpeg!.readFile(outputFileName)
      const blob = new Blob([data], { type: 'video/mp4' })

      onComplete(blob)
    } catch (error) {
      onError(error instanceof Error ? error.message : '合成失败')
    } finally {
      setLoading(false)
    }
  }, [ffmpeg, config, onComplete, onError, loadFFmpeg])

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">视频合成</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>

      <div className="mb-6">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {progress}% 完成
        </p>
      </div>

      <Button
        onClick={synthesize}
        disabled={loading}
        className="w-full"
      >
        {loading ? '合成中...' : '开始合成'}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        预计等待时间：1-2 分钟，请勿关闭页面
      </p>
    </div>
  )
}

// 生成字幕帧
async function generateSubtitleFrames(
  ffmpeg: FFmpeg,
  lyrics: LyricsWithTimestamp,
  style: SubtitleStyle
) {
  const fps = 30
  const totalFrames = lyrics.duration * fps

  for (let frame = 0; frame < totalFrames; frame++) {
    const currentTime = frame / fps
    const currentWord = getCurrentWord(lyrics, currentTime)

    if (currentWord) {
      // 使用 Canvas 生成字幕图片
      const canvas = document.createElement('canvas')
      canvas.width = 1280
      canvas.height = 720
      const ctx = canvas.getContext('2d')!

      // 绘制字幕
      ctx.font = `${style.fontSize}px ${style.font}`
      ctx.fillStyle = style.color
      ctx.textAlign = 'center'
      ctx.fillText(currentWord, canvas.width / 2, canvas.height - 100)

      // 导出为 PNG
      const dataUrl = canvas.toDataURL('image/png')
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
      await ffmpeg.writeFile(
        `subtitle_${frame.toString().padStart(4, '0')}.png`,
        base64Data
      )
    }
  }
}
```

---

## 4. 布局组件

### 4.1 Header 组件

```typescript
// components/layout/header.tsx
'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Logo className="h-8 w-8" />
          <span className="text-xl font-bold">WhyFire</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/create" className="text-sm font-medium hover:text-primary">
            创作视频
          </Link>
          <Link href="/pricing" className="text-sm font-medium hover:text-primary">
            定价
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link href="/my-videos">
                <Button variant="ghost">我的作品</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8" src={user.avatarUrl} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">个人中心</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">设置</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button>登录</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
```

---

## 5. 状态管理

### 5.1 Zustand Store 结构

```typescript
// stores/video-creation-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CreationStep = 'scene' | 'dialect' | 'lyrics' | 'music' | 'video' | 'complete'

interface VideoCreationState {
  // 当前步骤
  currentStep: CreationStep

  // 表单数据
  scene: SceneType | null
  dialect: DialectType
  productInfo: {
    name: string
    sellingPoints: string[]
    customPrompt: string
  }

  // 生成结果
  lyricsId: string | null
  lyricsContent: string
  musicTaskId: string | null
  musicUrl: string | null
  videoId: string | null

  // Actions
  setStep: (step: CreationStep) => void
  setScene: (scene: SceneType) => void
  setDialect: (dialect: DialectType) => void
  setProductInfo: (info: Partial<ProductInfo>) => void
  setLyrics: (id: string, content: string) => void
  setMusic: (taskId: string, url?: string) => void
  setVideo: (id: string) => void
  reset: () => void
}

const initialState = {
  currentStep: 'scene' as CreationStep,
  scene: null,
  dialect: 'mandarin' as DialectType,
  productInfo: {
    name: '',
    sellingPoints: [],
    customPrompt: '',
  },
  lyricsId: null,
  lyricsContent: '',
  musicTaskId: null,
  musicUrl: null,
  videoId: null,
}

export const useVideoCreationStore = create<VideoCreationState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      setScene: (scene) => set({ scene }),
      setDialect: (dialect) => set({ dialect }),
      setProductInfo: (info) =>
        set((state) => ({
          productInfo: { ...state.productInfo, ...info },
        })),
      setLyrics: (id, content) =>
        set({ lyricsId: id, lyricsContent: content }),
      setMusic: (taskId, url) =>
        set({ musicTaskId: taskId, musicUrl: url ?? null }),
      setVideo: (id) => set({ videoId: id }),

      reset: () => set(initialState),
    }),
    {
      name: 'video-creation-storage',
      partialize: (state) => ({
        scene: state.scene,
        dialect: state.dialect,
        productInfo: state.productInfo,
      }),
    }
  )
)
```

### 5.2 React Query 配置

```typescript
// lib/react-query.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟
      gcTime: 10 * 60 * 1000, // 10 分钟
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

// Query Keys
export const queryKeys = {
  user: ['user'] as const,
  profile: () => [...queryKeys.user, 'profile'] as const,
  points: () => [...queryKeys.user, 'points'] as const,
  subscription: () => [...queryKeys.user, 'subscription'] as const,

  videos: ['videos'] as const,
  videoList: (page: number, status?: string) =>
    [...queryKeys.videos, 'list', page, status] as const,
  video: (id: string) => [...queryKeys.videos, id] as const,

  templates: ['templates'] as const,
  templateList: (category?: string) =>
    [...queryKeys.templates, category] as const,
}
```

---

*返回 [TDD 主文档](./TDD.md)*
