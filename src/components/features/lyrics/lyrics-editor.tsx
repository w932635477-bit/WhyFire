"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Edit3, Eye, Play, Pause, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LyricsPreview } from "./lyrics-preview"

export interface LyricsEditorProps {
  /**
   * 歌词内容
   */
  content: string
  /**
   * 内容变化回调
   */
  onContentChange?: (content: string) => void
  /**
   * 当前播放时间（秒）
   */
  currentTime?: number
  /**
   * 播放状态
   */
  isPlaying?: boolean
  /**
   * 播放/暂停回调
   */
  onPlayPause?: () => void
  /**
   * 重置回调
   */
  onReset?: () => void
  /**
   * 点击歌词行跳转的回调
   */
  onSeek?: (time: number) => void
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 是否显示时间轴
   */
  showTimeline?: boolean
  /**
   * 是否显示工具栏
   */
  showToolbar?: boolean
}

/**
 * 歌词编辑器组件
 * 集成预览和编辑模式，支持切换
 */
export const LyricsEditor = React.forwardRef<HTMLDivElement, LyricsEditorProps>(
  (
    {
      content,
      onContentChange,
      currentTime,
      isPlaying = false,
      onPlayPause,
      onReset,
      onSeek,
      className,
      showTimeline = true,
      showToolbar = true,
    },
    ref
  ) => {
    const [isEditing, setIsEditing] = React.useState(false)

    // 计算统计信息
    const stats = React.useMemo(() => {
      const cleanContent = content.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "")
      const charCount = cleanContent.replace(/\s/g, "").length
      const lineCount = cleanContent.split("\n").filter((line) => line.trim()).length
      const estimatedDuration = Math.ceil(charCount / 3)

      return {
        charCount,
        lineCount,
        estimatedDuration,
      }
    }, [content])

    // 格式化时间
    const formatTime = (seconds: number): string => {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    const handleLineClick = (lineIndex: number, time?: number) => {
      if (time !== undefined && onSeek) {
        onSeek(time)
      }
    }

    const handleToggleMode = () => {
      setIsEditing((prev) => !prev)
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col h-full bg-background", className)}
      >
        {/* 工具栏 */}
        {showToolbar && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/30">
            <div className="flex items-center gap-2">
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={handleToggleMode}
                leftIcon={isEditing ? <Edit3 className="h-4 w-4" /> : undefined}
                rightIcon={!isEditing ? <Eye className="h-4 w-4" /> : undefined}
              >
                {isEditing ? "编辑中" : "预览"}
              </Button>

              {!isEditing && onPlayPause && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPlayPause}
                  leftIcon={isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                >
                  {isPlaying ? "暂停" : "播放"}
                </Button>
              )}

              {onReset && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                >
                  重置
                </Button>
              )}
            </div>

            {/* 统计信息 */}
            <div className="flex items-center gap-4 text-xs text-muted">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isEditing ? "editing" : "preview"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-4"
                >
                  <span>{stats.charCount} 字</span>
                  <span>{stats.lineCount} 行</span>
                  <span>约 {formatTime(stats.estimatedDuration)}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* 主内容区域 */}
        <div className="flex-1 overflow-hidden">
          <LyricsPreview
            content={content}
            currentTime={currentTime}
            isEditing={isEditing}
            onContentChange={onContentChange}
            onLineClick={handleLineClick}
            showTimeline={showTimeline}
            showStats={false}
            className="h-full border-0 rounded-none"
          />
        </div>

        {/* 底部统计栏（在非工具栏模式时显示） */}
        {!showToolbar && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card/50">
            <div className="flex items-center gap-4 text-xs text-muted">
              <span>字数: {stats.charCount}</span>
              <span>行数: {stats.lineCount}</span>
              <span>预计时长: {formatTime(stats.estimatedDuration)}</span>
            </div>
          </div>
        )}
      </div>
    )
  }
)

LyricsEditor.displayName = "LyricsEditor"
