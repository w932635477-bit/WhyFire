import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChatPanel, type Message } from "./chat-panel"

// Mock scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    button: ({ children, className, onClick, ...props }: any) => (
      <button className={className} onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe("ChatPanel", () => {
  const mockOnSend = vi.fn()
  const mockOnSuggestionClick = vi.fn()

  const mockMessages: Message[] = [
    {
      id: "1",
      role: "user",
      content: "你好，请帮我写一段歌词",
      timestamp: new Date("2024-01-01T10:00:00"),
    },
    {
      id: "2",
      role: "assistant",
      content: "当然可以！请告诉我你想要什么风格的歌词？",
      timestamp: new Date("2024-01-01T10:01:00"),
    },
  ]

  beforeEach(() => {
    mockOnSend.mockClear()
    mockOnSuggestionClick.mockClear()
  })

  it("应该渲染消息列表", () => {
    render(<ChatPanel messages={mockMessages} onSend={mockOnSend} />)

    expect(screen.getByText("你好，请帮我写一段歌词")).toBeInTheDocument()
    expect(screen.getByText("当然可以！请告诉我你想要什么风格的歌词？")).toBeInTheDocument()
  })

  it("用户消息和 AI 消息应该有不同的样式", () => {
    const { container } = render(
      <ChatPanel messages={mockMessages} onSend={mockOnSend} />
    )

    const userMessage = screen.getByText("你好，请帮我写一段歌词").parentElement
    const aiMessage = screen.getByText(
      "当然可以！请告诉我你想要什么风格的歌词？"
    ).parentElement

    expect(userMessage).toHaveClass("bg-primary")
    expect(aiMessage).toHaveClass("bg-card")
  })

  it("应该渲染输入框和发送按钮", () => {
    render(<ChatPanel messages={mockMessages} onSend={mockOnSend} />)

    expect(screen.getByPlaceholderText("输入你的消息...")).toBeInTheDocument()
    expect(screen.getByLabelText("发送消息")).toBeInTheDocument()
  })

  it("应该支持自定义占位符", () => {
    render(
      <ChatPanel
        messages={mockMessages}
        onSend={mockOnSend}
        placeholder="自定义占位符"
      />
    )

    expect(screen.getByPlaceholderText("自定义占位符")).toBeInTheDocument()
  })

  it("点击发送按钮应该调用 onSend", async () => {
    const user = userEvent.setup()
    render(<ChatPanel messages={mockMessages} onSend={mockOnSend} />)

    const input = screen.getByPlaceholderText("输入你的消息...")
    const sendButton = screen.getByLabelText("发送消息")

    await user.type(input, "测试消息")
    await user.click(sendButton)

    expect(mockOnSend).toHaveBeenCalledWith("测试消息")
  })

  it("按 Enter 键应该发送消息", async () => {
    const user = userEvent.setup()
    render(<ChatPanel messages={mockMessages} onSend={mockOnSend} />)

    const input = screen.getByPlaceholderText("输入你的消息...")

    await user.type(input, "测试消息{enter}")

    expect(mockOnSend).toHaveBeenCalledWith("测试消息")
  })

  it("输入为空时不应该发送", async () => {
    const user = userEvent.setup()
    render(<ChatPanel messages={mockMessages} onSend={mockOnSend} />)

    const sendButton = screen.getByLabelText("发送消息")
    await user.click(sendButton)

    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it("发送后应该清空输入框", async () => {
    const user = userEvent.setup()
    render(<ChatPanel messages={mockMessages} onSend={mockOnSend} />)

    const input = screen.getByPlaceholderText("输入你的消息...") as HTMLInputElement

    await user.type(input, "测试消息")
    await user.click(screen.getByLabelText("发送消息"))

    expect(input.value).toBe("")
  })

  it("应该显示 loading 状态（三个跳动的点）", () => {
    const { container } = render(
      <ChatPanel messages={mockMessages} onSend={mockOnSend} isLoading />
    )

    const dots = container.querySelectorAll(".rounded-full.bg-secondary")
    expect(dots).toHaveLength(3)
  })

  it("loading 时应该禁用发送按钮", () => {
    render(<ChatPanel messages={mockMessages} onSend={mockOnSend} isLoading />)

    const sendButton = screen.getByLabelText("发送消息")
    expect(sendButton).toBeDisabled()
  })

  it("应该显示快捷建议按钮", () => {
    const suggestions = ["嘻哈风格", "情歌", "摇滚"]

    render(
      <ChatPanel
        messages={mockMessages}
        onSend={mockOnSend}
        suggestions={suggestions}
      />
    )

    suggestions.forEach((suggestion) => {
      expect(screen.getByText(suggestion)).toBeInTheDocument()
    })
  })

  it("点击建议按钮应该调用 onSend", async () => {
    const user = userEvent.setup()
    const suggestions = ["嘻哈风格", "情歌", "摇滚"]

    render(
      <ChatPanel
        messages={mockMessages}
        onSend={mockOnSend}
        suggestions={suggestions}
      />
    )

    await user.click(screen.getByText("嘻哈风格"))

    expect(mockOnSend).toHaveBeenCalledWith("嘻哈风格")
  })

  it("点击建议按钮应该调用 onSuggestionClick（如果提供）", async () => {
    const user = userEvent.setup()
    const suggestions = ["嘻哈风格", "情歌", "摇滚"]

    render(
      <ChatPanel
        messages={mockMessages}
        onSend={mockOnSend}
        onSuggestionClick={mockOnSuggestionClick}
        suggestions={suggestions}
      />
    )

    await user.click(screen.getByText("嘻哈风格"))

    expect(mockOnSuggestionClick).toHaveBeenCalledWith("嘻哈风格")
    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it("禁用状态下应该禁用输入框和按钮", () => {
    render(<ChatPanel messages={mockMessages} onSend={mockOnSend} disabled />)

    const input = screen.getByPlaceholderText("输入你的消息...")
    const sendButton = screen.getByLabelText("发送消息")

    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it("应该应用自定义 className", () => {
    const { container } = render(
      <ChatPanel
        messages={mockMessages}
        onSend={mockOnSend}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("应该显示消息时间戳", () => {
    render(<ChatPanel messages={mockMessages} onSend={mockOnSend} />)

    // 时间格式为 "10:00" 和 "10:01"
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
    expect(screen.getByText(/10:01/)).toBeInTheDocument()
  })

  it("输入框应该去除首尾空格", async () => {
    const user = userEvent.setup()
    render(<ChatPanel messages={mockMessages} onSend={mockOnSend} />)

    const input = screen.getByPlaceholderText("输入你的消息...")

    await user.type(input, "  测试消息  ")
    await user.click(screen.getByLabelText("发送消息"))

    expect(mockOnSend).toHaveBeenCalledWith("测试消息")
  })
})
