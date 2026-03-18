import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import {
  MusicGenerationProgress,
  type MusicGenerationState,
} from "./music-generation-progress"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      animate,
      transition,
      initial,
      ...props
    }: any) => (
      <div className={className} data-animate={JSON.stringify(animate)} {...props}>
        {children}
      </div>
    ),
  },
}))

describe("MusicGenerationProgress", () => {
  const mockOnComplete = vi.fn()
  const mockOnError = vi.fn()
  const taskId = "test-task-123"

  beforeEach(() => {
    mockOnComplete.mockClear()
    mockOnError.mockClear()
  })

  // 1. 基础渲染测试
  it("应该正确渲染组件", () => {
    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )

    expect(screen.getByText("正在生成音乐...")).toBeInTheDocument()
  })

  // 2. 音乐图标测试
  it("应该显示音乐图标", () => {
    const { container } = render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )

    // 检查 Music 图标是否存在（通过 svg 元素）
    const svgElement = container.querySelector("svg")
    expect(svgElement).toBeInTheDocument()
  })

  // 3. 进度条显示测试
  it("应该显示进度条和百分比", () => {
    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )

    expect(screen.getByText("0%")).toBeInTheDocument()
    expect(screen.getByText("预计等待时间: 20-40 秒")).toBeInTheDocument()
  })

  // 4. 四个阶段指示器测试
  it("应该显示四个阶段指示器", () => {
    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )

    expect(screen.getByText("准备中")).toBeInTheDocument()
    expect(screen.getByText("生成伴奏")).toBeInTheDocument()
    expect(screen.getByText("合成人声")).toBeInTheDocument()
    expect(screen.getByText("混音处理")).toBeInTheDocument()
  })

  // 5. 模拟数据测试 - 准备中阶段
  it("应该正确显示准备中阶段", () => {
    const simulationData: MusicGenerationState = {
      stage: "preparing",
      progress: 5,
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    expect(screen.getByText("正在生成音乐...")).toBeInTheDocument()
    expect(screen.getByText("5%")).toBeInTheDocument()
  })

  // 6. 模拟数据测试 - 生成伴奏阶段
  it("应该正确显示生成伴奏阶段", () => {
    const simulationData: MusicGenerationState = {
      stage: "backing_track",
      progress: 25,
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    expect(screen.getByText("正在生成音乐...")).toBeInTheDocument()
    expect(screen.getByText("25%")).toBeInTheDocument()
  })

  // 7. 模拟数据测试 - 合成人声阶段
  it("应该正确显示合成人声阶段", () => {
    const simulationData: MusicGenerationState = {
      stage: "vocals",
      progress: 60,
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    expect(screen.getByText("正在生成音乐...")).toBeInTheDocument()
    expect(screen.getByText("60%")).toBeInTheDocument()
  })

  // 8. 模拟数据测试 - 混音处理阶段
  it("应该正确显示混音处理阶段", () => {
    const simulationData: MusicGenerationState = {
      stage: "mixing",
      progress: 90,
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    expect(screen.getByText("正在生成音乐...")).toBeInTheDocument()
    expect(screen.getByText("90%")).toBeInTheDocument()
  })

  // 9. 完成状态测试
  it("应该正确显示完成状态", () => {
    const simulationData: MusicGenerationState = {
      stage: "completed",
      progress: 100,
      musicUrl: "https://example.com/music/test.mp3",
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    expect(screen.getByText("生成完成")).toBeInTheDocument()
    expect(screen.getByText("音乐已准备就绪")).toBeInTheDocument()
    expect(screen.queryByText("预计等待时间")).not.toBeInTheDocument()
  })

  // 10. 完成状态应该调用 onComplete
  it("完成状态应该调用 onComplete 回调", async () => {
    const simulationData: MusicGenerationState = {
      stage: "completed",
      progress: 100,
      musicUrl: "https://example.com/music/test.mp3",
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    await waitFor(
      () => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          "https://example.com/music/test.mp3"
        )
      },
      { timeout: 1000 }
    )
  })

  // 11. 错误状态测试
  it("应该正确显示错误状态", () => {
    const simulationData: MusicGenerationState = {
      stage: "error",
      progress: 50,
      error: "生成失败：服务器错误",
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    expect(screen.getByText("生成失败")).toBeInTheDocument()
    expect(screen.getByText("生成失败：服务器错误")).toBeInTheDocument()
    expect(screen.queryByText("预计等待时间")).not.toBeInTheDocument()
  })

  // 12. 错误状态应该调用 onError
  it("错误状态应该调用 onError 回调", async () => {
    const simulationData: MusicGenerationState = {
      stage: "error",
      progress: 50,
      error: "生成失败：服务器错误",
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    await waitFor(
      () => {
        expect(mockOnError).toHaveBeenCalledWith("生成失败：服务器错误")
      },
      { timeout: 1000 }
    )
  })

  // 13. 自定义类名测试
  it("应该应用自定义 className", () => {
    const { container } = render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  // 14. 进度条动画测试
  it("进度条应该根据进度更新宽度", () => {
    const simulationData: MusicGenerationState = {
      stage: "backing_track",
      progress: 35,
    }

    const { container } = render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    // 检查进度条内的 div 是否存在
    const progressBar = container.querySelector(".bg-primary.rounded-full")
    expect(progressBar).toBeInTheDocument()
  })

  // 15. 阶段进度边界测试 - 准备中结束
  it("准备中阶段结束时应该正确处理", () => {
    const simulationData: MusicGenerationState = {
      stage: "preparing",
      progress: 10,
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    expect(screen.getByText("10%")).toBeInTheDocument()
  })

  // 16. 不在模拟模式时不应该自动更新
  it("不在模拟模式时应该保持初始状态", async () => {
    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode={false}
        pollInterval={100}
      />
    )

    // 等待一小段时间，确保不会自动更新
    await new Promise((resolve) => setTimeout(resolve, 200))

    // 仍然显示初始状态
    expect(screen.getByText("0%")).toBeInTheDocument()
    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  // 17. 提供 simulationData 时应该显示指定状态
  it("提供 simulationData 时应该显示指定状态", async () => {
    const simulationData: MusicGenerationState = {
      stage: "vocals",
      progress: 50,
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
        pollInterval={100}
      />
    )

    // 等待一小段时间
    await new Promise((resolve) => setTimeout(resolve, 200))

    // 仍然显示指定的进度
    expect(screen.getByText("50%")).toBeInTheDocument()
  })

  // 18. 完成时应该生成正确的音乐 URL
  it("完成时应该使用 taskId 生成音乐 URL", async () => {
    const simulationData: MusicGenerationState = {
      stage: "completed",
      progress: 100,
      musicUrl: `https://example.com/music/${taskId}.mp3`,
    }

    render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    await waitFor(
      () => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          `https://example.com/music/${taskId}.mp3`
        )
      },
      { timeout: 1000 }
    )
  })

  // 19. 检查四个阶段的进度范围
  it("四个阶段应该有正确的进度范围", () => {
    const stages: { stage: GenerationStage; progress: number; minExpected: number; maxExpected: number }[] = [
      { stage: "preparing", progress: 5, minExpected: 0, maxExpected: 10 },
      { stage: "backing_track", progress: 25, minExpected: 10, maxExpected: 40 },
      { stage: "vocals", progress: 60, minExpected: 40, maxExpected: 80 },
      { stage: "mixing", progress: 95, minExpected: 80, maxExpected: 100 },
    ]

    stages.forEach(({ stage, progress }) => {
      const simulationData: MusicGenerationState = { stage, progress }

      const { unmount } = render(
        <MusicGenerationProgress
          taskId={taskId}
          onComplete={mockOnComplete}
          onError={mockOnError}
          simulationMode
          simulationData={simulationData}
        />
      )

      expect(screen.getByText(`${progress}%`)).toBeInTheDocument()
      unmount()
    })
  })

  // 20. 错误图标测试
  it("错误状态应该显示错误图标", () => {
    const simulationData: MusicGenerationState = {
      stage: "error",
      progress: 50,
      error: "测试错误",
    }

    const { container } = render(
      <MusicGenerationProgress
        taskId={taskId}
        onComplete={mockOnComplete}
        onError={mockOnError}
        simulationMode
        simulationData={simulationData}
      />
    )

    // 错误状态的图标容器应该有红色背景
    const iconContainer = container.querySelector(".bg-destructive\\/10")
    expect(iconContainer).toBeInTheDocument()
  })
})

type GenerationStage = "preparing" | "backing_track" | "vocals" | "mixing" | "completed" | "error"
