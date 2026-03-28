"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface LyricsLine {
  time?: number
  text: string
}

export interface LyricsPreviewProps {
  /**
   * 歌词内容（纯文本或 LRC 格式）
   */
  content: string
  /**
   * 当前播放时间（秒）
   */
  currentTime?: number
  /**
   * 是否处于编辑模式
   */
  isEditing?: boolean
  /**
   * 内容变化回调
   */
  onContentChange?: (content: string) => void
  /**
   * 点击歌词行的回调
   */
  onLineClick?: (lineIndex: number, time?: number) => void
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 是否显示时间轴
   */
  showTimeline?: boolean
  /**
   * 是否显示字数统计
   */
  showStats?: boolean
}

/**
 * 解析 LRC 格式歌词
 */
function parseLrc(content: string): LyricsLine[] {
  const lines: LyricsLine[] = []
  const lrcLines = content.split("\n")

  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/

  for (const line of lrcLines) {
    const match = line.match(timeRegex)
    const text = line.replace(timeRegex, "").trim()

    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const milliseconds = parseInt(match[3].padEnd(3, "0"), 10)
      const time = minutes * 60 + seconds + milliseconds / 1000

      lines.push({ time, text })
    } else if (text) {
      lines.push({ text })
    }
  }

  return lines
}

/**
 * 格式化时间为 mm:ss 格式
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

/**
 * 计算预计时长（基于字数，约 3 字/秒）
 */
function estimateDuration(charCount: number): number {
  return Math.ceil(charCount / 3)
}

/**
 * 歌词预览组件
 */
export const LyricsPreview = React.forwardRef<HTMLDivElement, LyricsPreviewProps>(
  (
    {
      content,
      currentTime,
      isEditing = false,
      onContentChange,
      onLineClick,
      className,
      showTimeline = true,
      showStats = true,
    },
    ref
  ) => {
    const lines = React.useMemo(() => parseLrc(content), [content])
    const hasTimeline = lines.some((line) => line.time !== undefined)

    // 找到当前播放行
    const currentLineIndex = React.useMemo(() => {
      if (currentTime === undefined || !hasTimeline) return -1

      let index = -1
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!
        if (line.time !== undefined && line.time <= currentTime) {
          index = i
        }
      }
      return index
    }, [currentTime, lines, hasTimeline])

    // 字数统计
    const charCount = React.useMemo(() => {
      return content.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "").replace(/\s/g, "").length
    }, [content])

    // 预计时长
    const estimatedDuration = React.useMemo(() => estimateDuration(charCount), [charCount])

    // 自动滚动到当前播放行
    const currentLineRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (currentLineIndex >= 0 && currentLineRef.current) {
        currentLineRef.current.scrollIntoView?.({
          behavior: "smooth",
          block: "center",
        })
      }
    }, [currentLineIndex])

    // 编辑模式
    if (isEditing) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col h-full bg-background border border-border rounded-2xl overflow-hidden",
            className
          )}
        >
          <textarea
            value={content}
            onChange={(e) => onContentChange?.(e.target.value)}
            className="flex-1 w-full p-4 bg-transparent border-none resize-none focus:outline-none text-foreground placeholder:text-muted font-mono text-sm leading-relaxed"
            placeholder="输入歌词内容...&#10;&#10;支持 LRC 格式：&#10;[00:00.00]第一句歌词&#10;[00:05.00]第二句歌词"
            spellCheck={false}
          />

          {/* 统计信息 */}
          {showStats && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card/50">
              <div className="flex items-center gap-4 text-xs text-muted">
                <span>字数: {charCount}</span>
                <span>行数: {lines.length}</span>
                <span>预计时长: {formatTime(estimatedDuration)}</span>
              </div>
            </div>
          )}
        </div>
      )
    }

    // 预览模式
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full bg-background border border-border rounded-2xl overflow-hidden",
          className
        )}
      >
        {/* 歌词列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="popLayout">
            {lines.map((line, index) => {
              const isCurrentLine = index === currentLineIndex
              const hasPassed = hasTimeline && currentLineIndex > index

              return (
                <motion.div
                  key={index}
                  ref={isCurrentLine ? currentLineRef : undefined}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  onClick={() => onLineClick?.(index, line.time)}
                  className={cn(
                    "group flex items-start gap-3 py-2 px-3 -mx-3 rounded-lg cursor-pointer transition-all duration-200",
                    isCurrentLine
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-card",
                    hasPassed && "opacity-50"
                  )}
                >
                  {/* 时间轴 */}
                  {showTimeline && hasTimeline && (
                    <span
                      className={cn(
                        "flex-shrink-0 w-12 text-xs font-mono pt-0.5 transition-colors",
                        isCurrentLine ? "text-primary font-semibold" : "text-muted"
                      )}
                    >
                      {line.time !== undefined ? formatTime(line.time) : "--:--"}
                    </span>
                  )}

                  {/* 歌词文本 */}
                  <p
                    className={cn(
                      "flex-1 leading-relaxed transition-all duration-200",
                      isCurrentLine
                        ? "text-primary font-semibold text-lg scale-105 origin-left"
                        : "text-foreground",
                      "group-hover:text-primary/80"
                    )}
                  >
                    {line.text}
                  </p>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {lines.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted">
              <p>暂无歌词内容</p>
            </div>
          )}
        </div>

        {/* 统计信息 */}
        {showStats && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card/50">
            <div className="flex items-center gap-4 text-xs text-muted">
              <span>字数: {charCount}</span>
              <span>行数: {lines.length}</span>
              <span>预计时长: {formatTime(estimatedDuration)}</span>
            </div>
            {hasTimeline && currentTime !== undefined && (
              <span className="text-xs text-primary font-mono">
                {formatTime(currentTime)}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

LyricsPreview.displayName = "LyricsPreview"
