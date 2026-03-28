import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { MediaUploader } from "./media-uploader"

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url")
global.URL.revokeObjectURL = vi.fn()

describe("MediaUploader", () => {
  it("renders upload area with correct text", () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    expect(screen.getByText("拖拽文件到这里，或点击上传")).toBeInTheDocument()
    expect(screen.getByText(/支持 mp4\/mov\/jpg\/png\/gif 格式/)).toBeInTheDocument()
  })

  it("shows correct file size limits in description", () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    expect(screen.getByText(/视频最大 100MB，图片最大 20MB/)).toBeInTheDocument()
  })

  it("has hidden file input with correct accept attribute", () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    const input = document.querySelector('input[type="file"]')
    expect(input).toHaveAttribute("accept", ".mp4,.mov,.jpg,.jpeg,.png,.gif")
    expect(input).toHaveAttribute("multiple")
  })

  it("allows custom accept types", () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} accept={[".pdf"]} />)

    const input = document.querySelector('input[type="file"]')
    expect(input).toHaveAttribute("accept", ".pdf")
  })

  it("supports single file mode when multiple is false", () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} multiple={false} />)

    const input = document.querySelector('input[type="file"]')
    expect(input).not.toHaveAttribute("multiple")
  })

  it("shows dragging state when dragging over", () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    const dropZone = screen.getByText("拖拽文件到这里，或点击上传").closest("div")

    fireEvent.dragEnter(dropZone!)

    expect(screen.getByText("松开鼠标上传文件")).toBeInTheDocument()
  })

  it("accepts valid image file and shows progress", async () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    const file = new File(["dummy content"], "test.jpg", { type: "image/jpeg" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    })

    fireEvent.change(input)

    // 等待文件处理
    await waitFor(() => {
      expect(screen.getByText("test.jpg")).toBeInTheDocument()
    })

    // 检查文件大小显示 - 使用更精确的选择器
    const fileSizeElement = screen.getByText("13 B")
    expect(fileSizeElement).toBeInTheDocument()
  })

  it("accepts valid video file", async () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    const file = new File(["dummy video content"], "test.mp4", { type: "video/mp4" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    })

    fireEvent.change(input)

    // 视频预览在测试环境中可能失败，所以只检查文件名
    await waitFor(
      () => {
        expect(screen.getByText("test.mp4")).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // 检查文件大小显示 (19 B)
    expect(screen.getByText("19 B")).toBeInTheDocument()
  })

  it("shows error for unsupported file format", async () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText("test.pdf")).toBeInTheDocument()
    })

    expect(screen.getByText("不支持的文件格式，仅支持 mp4/mov/jpg/png/gif")).toBeInTheDocument()
  })

  it("shows error for oversized video file", async () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    // 创建一个超过 100MB 的文件
    const largeFile = new File(["x".repeat(101 * 1024 * 1024)], "large.mp4", { type: "video/mp4" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [largeFile],
      configurable: true,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText("large.mp4")).toBeInTheDocument()
    })

    expect(screen.getByText(/文件过大.*视频最大支持 100MB/)).toBeInTheDocument()
  })

  it("shows error for oversized image file", async () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    // 创建一个超过 20MB 的图片
    const largeFile = new File(["x".repeat(21 * 1024 * 1024)], "large.jpg", { type: "image/jpeg" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [largeFile],
      configurable: true,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText("large.jpg")).toBeInTheDocument()
    })

    expect(screen.getByText(/文件过大.*图片最大支持 20MB/)).toBeInTheDocument()
  })

  it("respects custom maxVideoSize prop", async () => {
    const onUpload = vi.fn()
    // 设置最大 50MB
    render(<MediaUploader onUpload={onUpload} maxVideoSize={50 * 1024 * 1024} />)

    // 创建一个 60MB 的文件
    const file = new File(["x".repeat(60 * 1024 * 1024)], "test.mp4", { type: "video/mp4" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText("test.mp4")).toBeInTheDocument()
    })

    expect(screen.getByText(/文件过大.*视频最大支持 50MB/)).toBeInTheDocument()
  })

  it("respects custom maxImageSize prop", async () => {
    const onUpload = vi.fn()
    // 设置最大 10MB
    render(<MediaUploader onUpload={onUpload} maxImageSize={10 * 1024 * 1024} />)

    // 创建一个 15MB 的图片
    const file = new File(["x".repeat(15 * 1024 * 1024)], "test.jpg", { type: "image/jpeg" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText("test.jpg")).toBeInTheDocument()
    })

    expect(screen.getByText(/文件过大.*图片最大支持 10MB/)).toBeInTheDocument()
  })

  it("allows removing uploaded file", async () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    const file = new File(["dummy content"], "test.jpg", { type: "image/jpeg" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText("test.jpg")).toBeInTheDocument()
    })

    // 点击删除按钮
    const deleteButton = screen.getByTitle("删除")
    fireEvent.click(deleteButton)

    // 文件应该被移除
    await waitFor(() => {
      expect(screen.queryByText("test.jpg")).not.toBeInTheDocument()
    })
  })

  it("shows upload progress bar during upload", async () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    const file = new File(["dummy content"], "test.jpg", { type: "image/jpeg" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    })

    fireEvent.change(input)

    // 等待上传开始
    await waitFor(() => {
      expect(screen.getByText(/上传中/)).toBeInTheDocument()
    })
  })

  it("calls onUpload callback when upload succeeds", async () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    const file = new File(["dummy content"], "test.jpg", { type: "image/jpeg" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    })

    fireEvent.change(input)

    // 等待上传完成
    await waitFor(
      () => {
        expect(onUpload).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // 检查回调参数
    const uploadedFiles = onUpload.mock.calls[0][0]
    expect(uploadedFiles).toHaveLength(1)
    expect(uploadedFiles[0].file.name).toBe("test.jpg")
    expect(uploadedFiles[0].status).toBe("success")
    expect(uploadedFiles[0].progress).toBe(100)
  })

  it("handles multiple files at once", async () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    const file1 = new File(["content1"], "test1.jpg", { type: "image/jpeg" })
    const file2 = new File(["content2"], "test2.png", { type: "image/png" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    Object.defineProperty(input, "files", {
      value: [file1, file2],
      configurable: true,
    })

    fireEvent.change(input)

    await waitFor(
      () => {
        expect(screen.getByText("test1.jpg")).toBeInTheDocument()
        expect(screen.getByText("test2.png")).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // 检查类型标签 - 使用 getAllByText 因为可能有多个匹配
    const imageLabels = screen.getAllByText("图片")
    expect(imageLabels.length).toBeGreaterThanOrEqual(2)
  })

  it("applies custom className", () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} className="custom-class" />)

    // className 应该应用到最外层的 div 上
    const container = document.querySelector(".custom-class")
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass("space-y-4")
  })

  it("handles drag and drop events", () => {
    const onUpload = vi.fn()
    render(<MediaUploader onUpload={onUpload} />)

    const dropZone = screen.getByText("拖拽文件到这里，或点击上传").closest("div")!

    // Test drag enter
    fireEvent.dragEnter(dropZone)
    expect(screen.getByText("松开鼠标上传文件")).toBeInTheDocument()

    // Test drag leave
    fireEvent.dragLeave(dropZone)
    expect(screen.getByText("拖拽文件到这里，或点击上传")).toBeInTheDocument()
  })
})
