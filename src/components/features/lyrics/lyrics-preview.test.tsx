import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { LyricsPreview } from "./lyrics-preview"

describe("LyricsPreview", () => {
  const sampleLrcContent = `[00:00.00]第一句歌词
[00:05.00]第二句歌词
[00:10.00]第三句歌词`

  const plainContent = `第一句歌词
第二句歌词
第三句歌词`

  describe("渲染", () => {
    it("应该正确渲染歌词内容", () => {
      render(<LyricsPreview content={plainContent} />)

      expect(screen.getByText("第一句歌词")).toBeInTheDocument()
      expect(screen.getByText("第二句歌词")).toBeInTheDocument()
      expect(screen.getByText("第三句歌词")).toBeInTheDocument()
    })

    it("应该正确解析和显示 LRC 格式歌词", () => {
      render(<LyricsPreview content={sampleLrcContent} showTimeline />)

      expect(screen.getByText("第一句歌词")).toBeInTheDocument()
      expect(screen.getByText("00:00")).toBeInTheDocument()
      expect(screen.getByText("00:05")).toBeInTheDocument()
    })

    it("应该显示空状态提示", () => {
      render(<LyricsPreview content="" />)

      expect(screen.getByText("暂无歌词内容")).toBeInTheDocument()
    })

    it("应该显示统计信息", () => {
      render(<LyricsPreview content={plainContent} showStats />)

      expect(screen.getByText(/字数:/)).toBeInTheDocument()
      expect(screen.getByText(/行数:/)).toBeInTheDocument()
      expect(screen.getByText(/预计时长:/)).toBeInTheDocument()
    })

    it("当 showStats 为 false 时不显示统计信息", () => {
      render(<LyricsPreview content={plainContent} showStats={false} />)

      expect(screen.queryByText(/字数:/)).not.toBeInTheDocument()
    })
  })

  describe("编辑模式", () => {
    it("应该在编辑模式下显示 textarea", () => {
      render(<LyricsPreview content={plainContent} isEditing />)

      const textarea = screen.getByPlaceholderText(/输入歌词内容/)
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveValue(plainContent)
    })

    it("应该响应内容变化", () => {
      const handleChange = vi.fn()
      render(<LyricsPreview content={plainContent} isEditing onContentChange={handleChange} />)

      const textarea = screen.getByPlaceholderText(/输入歌词内容/)
      fireEvent.change(textarea, { target: { value: "新的歌词" } })

      expect(handleChange).toHaveBeenCalledWith("新的歌词")
    })

    it("应该在编辑模式显示统计信息", () => {
      render(<LyricsPreview content={plainContent} isEditing showStats />)

      expect(screen.getByText(/字数:/)).toBeInTheDocument()
    })
  })

  describe("预览模式", () => {
    it("应该高亮当前播放行", () => {
      render(<LyricsPreview content={sampleLrcContent} currentTime={6} />)

      // 第二句歌词应该被高亮（时间 5-10 秒）
      const secondLine = screen.getByText("第二句歌词")
      expect(secondLine.closest("div")).toHaveClass("bg-primary/10")
    })

    it("应该降低已播放行的透明度", () => {
      render(<LyricsPreview content={sampleLrcContent} currentTime={8} />)

      // 第一句应该已经播放过
      const firstLine = screen.getByText("第一句歌词")
      expect(firstLine.closest("div")).toHaveClass("opacity-50")
    })

    it("应该在没有时间轴时不显示高亮", () => {
      render(<LyricsPreview content={plainContent} currentTime={5} />)

      // 纯文本歌词不应该有高亮
      const lines = screen.getAllByText(/歌词/)
      lines.forEach((line) => {
        expect(line.closest("div")).not.toHaveClass("bg-primary/10")
      })
    })
  })

  describe("交互", () => {
    it("应该响应点击行事件", () => {
      const handleLineClick = vi.fn()
      render(
        <LyricsPreview content={sampleLrcContent} onLineClick={handleLineClick} />
      )

      const firstLine = screen.getByText("第一句歌词")
      fireEvent.click(firstLine)

      expect(handleLineClick).toHaveBeenCalledWith(0, 0)
    })

    it("应该在点击无时间行时传递 undefined", () => {
      const handleLineClick = vi.fn()
      render(<LyricsPreview content={plainContent} onLineClick={handleLineClick} />)

      const firstLine = screen.getByText("第一句歌词")
      fireEvent.click(firstLine)

      expect(handleLineClick).toHaveBeenCalledWith(0, undefined)
    })
  })

  describe("样式", () => {
    it("应该应用自定义类名", () => {
      const { container } = render(
        <LyricsPreview content={plainContent} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass("custom-class")
    })

    it("当 showTimeline 为 false 时不显示时间轴", () => {
      render(<LyricsPreview content={sampleLrcContent} showTimeline={false} />)

      expect(screen.queryByText("00:00")).not.toBeInTheDocument()
    })
  })

  describe("辅助功能", () => {
    it("textarea 应该可以被 focus", () => {
      render(<LyricsPreview content={plainContent} isEditing />)

      const textarea = screen.getByPlaceholderText(/输入歌词内容/)
      textarea.focus()
      expect(textarea).toHaveFocus()
    })
  })
})
