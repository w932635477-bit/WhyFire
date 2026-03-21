import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DialectSelector, DialectSelectorCompact } from "./dialect-selector"

describe("DialectSelector", () => {
  describe("默认模式", () => {
    it("默认渲染推荐的方言选项", () => {
      const onChange = vi.fn()
      render(<DialectSelector onChange={onChange} />)

      // 推荐方言应该显示
      expect(screen.getByText("普通话")).toBeInTheDocument()
      expect(screen.getByText("粤语")).toBeInTheDocument()
      expect(screen.getByText("四川话")).toBeInTheDocument()
      expect(screen.getByText("东北话")).toBeInTheDocument()
      expect(screen.getByText("English")).toBeInTheDocument()
    })

    it("点击方言按钮调用 onChange", () => {
      const onChange = vi.fn()
      render(<DialectSelector onChange={onChange} />)

      const mandarinButton = screen.getByText("普通话").closest("button")
      fireEvent.click(mandarinButton!)

      expect(onChange).toHaveBeenCalledWith("mandarin")

      const cantoneseButton = screen.getByText("粤语").closest("button")
      fireEvent.click(cantoneseButton!)

      expect(onChange).toHaveBeenCalledWith("cantonese")
    })

    it("选中状态应用正确的样式", () => {
      const onChange = vi.fn()
      render(<DialectSelector value="mandarin" onChange={onChange} />)

      const mandarinButton = screen.getByText("普通话").closest("button")
      expect(mandarinButton).toHaveClass("bg-primary")
      expect(mandarinButton).toHaveClass("text-white")
      expect(mandarinButton).toHaveClass("border-primary")
    })

    it("未选中状态应用正确的样式", () => {
      const onChange = vi.fn()
      render(<DialectSelector onChange={onChange} />)

      const mandarinButton = screen.getByText("普通话").closest("button")
      expect(mandarinButton).toHaveClass("border-2")
      expect(mandarinButton).toHaveClass("rounded-full")
    })

    it("更新选中状态当 value prop 变化时", () => {
      const onChange = vi.fn()
      const { rerender } = render(<DialectSelector value="mandarin" onChange={onChange} />)

      let mandarinButton = screen.getByText("普通话").closest("button")
      expect(mandarinButton).toHaveClass("bg-primary")

      rerender(<DialectSelector value="cantonese" onChange={onChange} />)

      mandarinButton = screen.getByText("普通话").closest("button")
      const cantoneseButton = screen.getByText("粤语").closest("button")

      expect(mandarinButton).not.toHaveClass("bg-primary")
      expect(cantoneseButton).toHaveClass("bg-primary")
    })

    it("显示展开全部按钮", () => {
      const onChange = vi.fn()
      render(<DialectSelector onChange={onChange} />)

      expect(screen.getByText(/展开全部/)).toBeInTheDocument()
    })
  })

  describe("展开模式 (showAll)", () => {
    it("显示分组标题", () => {
      const onChange = vi.fn()
      render(<DialectSelector onChange={onChange} showAll={true} />)

      expect(screen.getByText("热门方言")).toBeInTheDocument()
      expect(screen.getByText("官话方言")).toBeInTheDocument()
      expect(screen.getByText("非官话方言")).toBeInTheDocument()
    })

    it("显示所有 19 种方言", () => {
      const onChange = vi.fn()
      render(<DialectSelector onChange={onChange} showAll={true} />)

      // 检查各分组的方言
      expect(screen.getByText("普通话")).toBeInTheDocument()
      expect(screen.getByText("粤语")).toBeInTheDocument()
      expect(screen.getByText("四川话")).toBeInTheDocument()
      expect(screen.getByText("东北话")).toBeInTheDocument()
      expect(screen.getByText("山东话")).toBeInTheDocument()
      expect(screen.getByText("河南话")).toBeInTheDocument()
      expect(screen.getByText("陕西话")).toBeInTheDocument()
      expect(screen.getByText("吴语")).toBeInTheDocument()
      expect(screen.getByText("闽南语")).toBeInTheDocument()
      expect(screen.getByText("English")).toBeInTheDocument()
    })

    it("点击切换按钮收起", () => {
      const onChange = vi.fn()
      render(<DialectSelector onChange={onChange} showAll={true} />)

      const collapseButton = screen.getByText(/收起/)
      fireEvent.click(collapseButton!)

      expect(screen.queryByText("热门方言")).not.toBeInTheDocument()
    })
  })

  describe("紧凑模式 (compact)", () => {
    it("仅显示推荐的方言", () => {
      const onChange = vi.fn()
      render(<DialectSelector onChange={onChange} compact />)

      expect(screen.getByText("普通话")).toBeInTheDocument()
      expect(screen.getByText("粤语")).toBeInTheDocument()
      expect(screen.queryByText("展开全部")).not.toBeInTheDocument()
    })
  })
})

describe("DialectSelectorCompact", () => {
  it("渲染下拉选择器", () => {
    const onChange = vi.fn()
    render(<DialectSelectorCompact onChange={onChange} />)

    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("包含推荐方言选项", () => {
    const onChange = vi.fn()
    render(<DialectSelectorCompact onChange={onChange} />)

    expect(screen.getByText("普通话")).toBeInTheDocument()
    expect(screen.getByText("粤语")).toBeInTheDocument()
    expect(screen.getByText("四川话")).toBeInTheDocument()
    expect(screen.getByText("东北话")).toBeInTheDocument()
    expect(screen.getByText("English")).toBeInTheDocument()
  })

  it("选择方言调用 onChange", () => {
    const onChange = vi.fn()
    render(<DialectSelectorCompact onChange={onChange} />)

    const select = screen.getByRole("combobox")
    fireEvent.change(select, { target: { value: "cantonese" } })

    expect(onChange).toHaveBeenCalledWith("cantonese")
  })

  it("显示当前选中的值", () => {
    const onChange = vi.fn()
    render(<DialectSelectorCompact value="sichuan" onChange={onChange} />)

    const select = screen.getByRole("combobox") as HTMLSelectElement
    expect(select.value).toBe("sichuan")
  })
})
