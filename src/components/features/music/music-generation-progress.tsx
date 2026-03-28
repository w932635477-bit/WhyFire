"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Music, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 音乐生成阶段
 */
export type GenerationStage = "preparing" | "backing_track" | "vocals" | "mixing" | "completed" | "error"

/**
 * 阶段配置
 */
export interface StageConfig {
  id: GenerationStage
  label: string
  progressStart: number
  progressEnd: number
}

/**
 * 音乐生成状态
 */
export interface MusicGenerationState {
  stage: GenerationStage
  progress: number
  error?: string
  musicUrl?: string
}

/**
 * 音乐生成进度组件 Props
 */
export interface MusicGenerationProgressProps {
  /**
   * 任务 ID
   */
  taskId: string
  /**
   * 生成完成回调
   */
  onComplete: (musicUrl: string) => void
  /**
   * 生成失败回调
   */
  onError: (error: string) => void
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 轮询间隔（毫秒），默认 1000ms
   */
  pollInterval?: number
  /**
   * 模拟模式（用于演示和测试）
   */
  simulationMode?: boolean
  /**
   * 模拟数据（用于测试）
   */
  simulationData?: MusicGenerationState
}

// 四个生成阶段的配置
const STAGES: StageConfig[] = [
  { id: "preparing", label: "准备中", progressStart: 0, progressEnd: 10 },
  { id: "backing_track", label: "生成伴奏", progressStart: 10, progressEnd: 40 },
  { id: "vocals", label: "合成人声", progressStart: 40, progressEnd: 80 },
  { id: "mixing", label: "混音处理", progressStart: 80, progressEnd: 100 },
]

/**
 * 获取当前阶段索引
 */
const getCurrentStageIndex = (stage: GenerationStage): number => {
  if (stage === "completed") return STAGES.length
  if (stage === "error") return -1
  return STAGES.findIndex((s) => s.id === stage)
}

/**
 * 阶段指示器组件
 */
const StageIndicator = ({
  stage,
  currentIndex,
  stageIndex,
}: {
  stage: StageConfig
  currentIndex: number
  stageIndex: number
}) => {
  const isActive = stageIndex === currentIndex
  const isCompleted = stageIndex < currentIndex

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={cn(
          "w-3 h-3 rounded-full transition-colors duration-300",
          isCompleted
            ? "bg-primary"
            : isActive
            ? "bg-primary animate-pulse"
            : "bg-muted"
        )}
        animate={isActive ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
      />
      <span
        className={cn(
          "text-xs transition-colors duration-300",
          isActive || isCompleted ? "text-foreground font-medium" : "text-muted"
        )}
      >
        {stage.label}
      </span>
    </div>
  )
}

/**
 * 音乐生成进度组件
 *
 * 显示音乐生成的四个阶段进度，包括：
 * - 旋转的音乐图标
 * - 进度条和百分比
 * - 四个阶段指示器
 * - 预计等待时间提示
 */
export const MusicGenerationProgress = React.forwardRef<
  HTMLDivElement,
  MusicGenerationProgressProps
>(
  (
    {
      taskId,
      onComplete,
      onError,
      className,
      pollInterval = 1000,
      simulationMode = false,
      simulationData,
    },
    ref
  ) => {
    // 当前生成状态
    const [state, setState] = React.useState<MusicGenerationState>(
      simulationData || {
        stage: "preparing",
        progress: 0,
      }
    )

    // 是否已完成或出错
    const isFinished = state.stage === "completed" || state.stage === "error"

    // 模拟生成过程
    React.useEffect(() => {
      if (!simulationMode || simulationData || isFinished) return

      const simulateProgress = () => {
        setState((prev) => {
          if (prev.stage === "completed" || prev.stage === "error") {
            return prev
          }

          // 查找当前阶段配置
          const currentStageConfig = STAGES.find((s) => s.id === prev.stage)
          if (!currentStageConfig) return prev

          // 增加进度
          const increment = Math.random() * 5 + 2 // 2-7% 的随机增量
          let newProgress = Math.min(
            prev.progress + increment,
            currentStageConfig.progressEnd
          )

          // 检查是否需要切换到下一阶段
          let newStage: GenerationStage = prev.stage
          if (newProgress >= currentStageConfig.progressEnd) {
            const currentStageIndex = STAGES.findIndex(
              (s) => s.id === prev.stage
            )
            if (currentStageIndex < STAGES.length - 1) {
              newStage = STAGES[currentStageIndex + 1].id
            } else {
              // 所有阶段完成
              newStage = "completed"
              newProgress = 100
            }
          }

          return {
            ...prev,
            stage: newStage,
            progress: newProgress,
          }
        })
      }

      const interval = setInterval(simulateProgress, pollInterval)
      return () => clearInterval(interval)
    }, [simulationMode, simulationData, pollInterval, isFinished])

    // 完成和错误回调
    React.useEffect(() => {
      if (state.stage === "completed" && state.musicUrl) {
        onComplete(state.musicUrl)
      } else if (state.stage === "error" && state.error) {
        onError(state.error)
      }
    }, [state.stage, state.musicUrl, state.error, onComplete, onError])

    // 模拟完成时设置 musicUrl
    React.useEffect(() => {
      if (simulationMode && state.stage === "completed" && !state.musicUrl) {
        setState((prev) => ({
          ...prev,
          musicUrl: `https://example.com/music/${taskId}.mp3`,
        }))
      }
    }, [simulationMode, state.stage, state.musicUrl, taskId])

    const currentStageIndex = getCurrentStageIndex(state.stage)
    const progressPercent = Math.round(state.progress)

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center p-8 bg-card border border-border rounded-2xl",
          className
        )}
      >
        {/* 音乐图标 */}
        <div className="relative mb-6">
          <motion.div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center",
              state.stage === "error"
                ? "bg-destructive/10"
                : "bg-primary/10"
            )}
            animate={
              state.stage === "error"
                ? {}
                : { rotate: 360 }
            }
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {state.stage === "error" ? (
              <X className="w-10 h-10 text-destructive" />
            ) : state.stage === "completed" ? (
              <Check className="w-10 h-10 text-primary" />
            ) : (
              <Music className="w-10 h-10 text-primary" />
            )}
          </motion.div>
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {state.stage === "error"
            ? "生成失败"
            : state.stage === "completed"
            ? "生成完成"
            : "正在生成音乐..."}
        </h3>

        {/* 错误信息 */}
        {state.stage === "error" && state.error && (
          <p className="text-sm text-destructive mb-4">{state.error}</p>
        )}

        {/* 进度条 */}
        {state.stage !== "error" && state.stage !== "completed" && (
          <>
            <div className="w-full max-w-xs mb-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <span className="text-sm text-muted mb-4">{progressPercent}%</span>
          </>
        )}

        {/* 完成提示 */}
        {state.stage === "completed" && state.musicUrl && (
          <p className="text-sm text-muted mb-4">
            音乐已准备就绪
          </p>
        )}

        {/* 阶段指示器 */}
        {state.stage !== "error" && state.stage !== "completed" && (
          <div className="flex items-center justify-between w-full max-w-xs mb-4">
            {STAGES.map((stage, index) => (
              <React.Fragment key={stage.id}>
                <StageIndicator
                  stage={stage}
                  currentIndex={currentStageIndex}
                  stageIndex={index}
                />
                {index < STAGES.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      index < currentStageIndex ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* 预计等待时间 */}
        {state.stage !== "error" && state.stage !== "completed" && (
          <p className="text-xs text-muted">
            预计等待时间: 20-40 秒
          </p>
        )}
      </div>
    )
  }
)

MusicGenerationProgress.displayName = "MusicGenerationProgress"
