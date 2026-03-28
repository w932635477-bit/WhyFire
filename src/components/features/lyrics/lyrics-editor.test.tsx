import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { LyricsEditor } from "./lyrics-editor"

describe("LyricsEditor", () => {
  const sampleContent = `第一句歌词
第二句歌词
第三句歌词`

  describe("渲染", () => {
    it("应该正确渲染编辑器", () => {
      render(<LyricsEditor content={sampleContent} />)

      expect(screen.getByText("预览")).toBeInTheDocument()
      expect(screen.getByText("第一句歌词")).toBeInTheDocument()
    })

    it("应该显示工具栏", () => {
      render(<LyricsEditor content={sampleContent} showToolbar />)

      expect(screen.getByText("预览")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /预览/ })).toBeInTheDocument()
    })

    it("当 showToolbar 为 false 时不显示工具栏", () => {
      render(<LyricsEditor content={sampleContent} showToolbar={false} />)

      expect(screen.queryByText("预览")).not.toBeInTheDocument()
    })

    it("应该显示统计信息", () => {
      render(<LyricsEditor content={sampleContent} showToolbar />)

      expect(screen.getByText(/字/)).toBeInTheDocument()
      expect(screen.getByText(/行/)).toBeInTheDocument()
    })
  })

  describe("模式切换", () => {
    it("应该切换到编辑模式", () => {
      render(<LyricsEditor content={sampleContent} />)

      const editButton = screen.getByRole("button", { name: /预览/ })
      fireEvent.click(editButton)

      expect(screen.getByPlaceholderText(/输入歌词内容/)).toBeInTheDocument()
    })

    it("应该在编辑模式显示 textarea", () => {
      render(<LyricsEditor content={sampleContent} />)

      // 切换到编辑模式
      const editButton = screen.getByRole("button", { name: /预览/ })
      fireEvent.click(editButton)

      const textarea = screen.getByPlaceholderText(/输入歌词内容/)
      expect(textarea).toBeInTheDocument()
    })

    it("应该在预览模式显示歌词列表", () => {
      render(<LyricsEditor content={sampleContent} />)

      expect(screen.getByText("第一句歌词")).toBeInTheDocument()
    })
  })

  describe("播放控制", () => {
    it("应该显示播放按钮", () => {
      const handlePlayPause = vi.fn()
      render(<LyricsEditor content={sampleContent} onPlayPause={handlePlayPause} />)

      expect(screen.getByRole("button", { name: /播放/ })).toBeInTheDocument()
    })

    it("应该响应播放/暂停", () => {
      const handlePlayPause = vi.fn()
      render(<LyricsEditor content={sampleContent} onPlayPause={handlePlayPause} />)

      const playButton = screen.getByRole("button", { name: /播放/ })
      fireEvent.click(playButton)

      expect(handlePlayPause).toHaveBeenCalled()
    })

    it("应该在播放时显示暂停按钮", () => {
      const handlePlayPause = vi.fn()
      render(
        <LyricsEditor
          content={sampleContent}
          onPlayPause={handlePlayPause}
          isPlaying
        />
      )

      expect(screen.getByRole("button", { name: /暂停/ })).toBeInTheDocument()
    })

    it("在编辑模式时不显示播放按钮", () => {
      const handlePlayPause = vi.fn()
      render(<LyricsEditor content={sampleContent} onPlayPause={handlePlayPause} />)

      // 切换到编辑模式
      const editButton = screen.getByRole("button", { name: /预览/ })
      fireEvent.click(editButton)

      expect(screen.queryByRole("button", { name: /播放/ })).not.toBeInTheDocument()
    })
  })

  describe("重置功能", () => {
    it("应该显示重置按钮", () => {
      const handleReset = vi.fn()
      render(<LyricsEditor content={sampleContent} onReset={handleReset} />)

      expect(screen.getByRole("button", { name: /重置/ })).toBeInTheDocument()
    })

    it("应该响应重置点击", () => {
      const handleReset = vi.fn()
      render(<LyricsEditor content={sampleContent} onReset={handleReset} />)

      const resetButton = screen.getByRole("button", { name: /重置/ })
      fireEvent.click(resetButton)

      expect(handleReset).toHaveBeenCalled()
    })
  })

  describe("内容编辑", () => {
    it("应该响应内容变化", () => {
      const handleChange = vi.fn()
      render(<LyricsEditor content={sampleContent} onContentChange={handleChange} />)

      // 切换到编辑模式
      const editButton = screen.getByRole("button", { name: /预览/ })
      fireEvent.click(editButton)

      const textarea = screen.getByPlaceholderText(/输入歌词内容/)
      fireEvent.change(textarea, { target: { value: "新的歌词" } })

      expect(handleChange).toHaveBeenCalledWith("新的歌词")
    })
  })

  describe("时间轴跳转", () => {
    const lrcContent = `[00:00.00]第一句歌词
[00:05.00]第二句歌词`

    it("应该响应行点击跳转", () => {
      const handleSeek = vi.fn()
      render(<LyricsEditor content={lrcContent} onSeek={handleSeek} />)

      const firstLine = screen.getByText("第一句歌词")
      fireEvent.click(firstLine)

      expect(handleSeek).toHaveBeenCalledWith(0)
    })
  })

  describe("样式", () => {
    it("应该应用自定义类名", () => {
      const { container } = render(
        <LyricsEditor content={sampleContent} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass("custom-class")
    })
  })

  describe("辅助功能", () => {
    it("所有按钮应该可访问", () => {
      const handlePlayPause = vi.fn()
      const handleReset = vi.fn()

      render(
        <LyricsEditor
          content={sampleContent}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
        />
      )

      expect(screen.getByRole("button", { name: /预览/ })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /播放/ })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /重置/ })).toBeInTheDocument()
    })
  })
})
