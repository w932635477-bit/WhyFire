import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DialectSelector } from "./dialect-selector"

describe("DialectSelector", () => {
  it("renders all 4 dialect options", () => {
    const onChange = vi.fn()
    render(<DialectSelector onChange={onChange} />)

    expect(screen.getByText("普通话")).toBeInTheDocument()
    expect(screen.getByText("粤语")).toBeInTheDocument()
    expect(screen.getByText("东北话")).toBeInTheDocument()
    expect(screen.getByText("四川话")).toBeInTheDocument()
  })

  it("displays correct flags for each dialect", () => {
    const onChange = vi.fn()
    render(<DialectSelector onChange={onChange} />)

    expect(screen.getByText("🇨🇳")).toBeInTheDocument()
    expect(screen.getByText("🇭🇰")).toBeInTheDocument()
    expect(screen.getByText("⛄")).toBeInTheDocument()
    expect(screen.getByText("🐼")).toBeInTheDocument()
  })

  it("shows PRO tag for unavailable dialects (dongbei and sichuan)", () => {
    const onChange = vi.fn()
    render(<DialectSelector onChange={onChange} />)

    const proTags = screen.getAllByText("PRO")
    expect(proTags).toHaveLength(2)
  })

  it("disables dongbei and sichuan dialect buttons", () => {
    const onChange = vi.fn()
    render(<DialectSelector onChange={onChange} />)

    const dongbeiButton = screen.getByText("东北话").closest("button")
    const sichuanButton = screen.getByText("四川话").closest("button")

    expect(dongbeiButton).toBeDisabled()
    expect(sichuanButton).toBeDisabled()
  })

  it("does not call onChange when clicking disabled dialects", () => {
    const onChange = vi.fn()
    render(<DialectSelector onChange={onChange} />)

    const dongbeiButton = screen.getByText("东北话").closest("button")
    const sichuanButton = screen.getByText("四川话").closest("button")

    fireEvent.click(dongbeiButton!)
    fireEvent.click(sichuanButton!)

    expect(onChange).not.toHaveBeenCalled()
  })

  it("applies selected state styles (bg-primary, text-white) when dialect is selected", () => {
    const onChange = vi.fn()
    render(<DialectSelector value="mandarin" onChange={onChange} />)

    const mandarinButton = screen.getByText("普通话").closest("button")
    expect(mandarinButton).toHaveClass("bg-primary")
    expect(mandarinButton).toHaveClass("text-white")
    expect(mandarinButton).toHaveClass("border-primary")
  })

  it("applies rounded-full class for pill shape", () => {
    const onChange = vi.fn()
    render(<DialectSelector onChange={onChange} />)

    const mandarinButton = screen.getByText("普通话").closest("button")
    expect(mandarinButton).toHaveClass("rounded-full")
  })

  it("calls onChange with correct dialect when clicking available dialect", () => {
    const onChange = vi.fn()
    render(<DialectSelector onChange={onChange} />)

    const mandarinButton = screen.getByText("普通话").closest("button")
    fireEvent.click(mandarinButton!)

    expect(onChange).toHaveBeenCalledWith("mandarin")

    const cantoneseButton = screen.getByText("粤语").closest("button")
    fireEvent.click(cantoneseButton!)

    expect(onChange).toHaveBeenCalledWith("cantonese")
  })

  it("updates selection when value prop changes", () => {
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

  it("hides PRO tag when showPremium is false", () => {
    const onChange = vi.fn()
    render(<DialectSelector onChange={onChange} showPremium={false} />)

    expect(screen.queryByText("PRO")).not.toBeInTheDocument()
  })

  it("applies opacity-50 class to disabled buttons", () => {
    const onChange = vi.fn()
    render(<DialectSelector onChange={onChange} />)

    const dongbeiButton = screen.getByText("东北话").closest("button")
    const sichuanButton = screen.getByText("四川话").closest("button")

    expect(dongbeiButton).toHaveClass("opacity-50")
    expect(sichuanButton).toHaveClass("opacity-50")
  })

  it("applies correct unselected styles", () => {
    const onChange = vi.fn()
    render(<DialectSelector onChange={onChange} />)

    const mandarinButton = screen.getByText("普通话").closest("button")
    expect(mandarinButton).toHaveClass("border-border")
    expect(mandarinButton).toHaveClass("bg-card")
  })
})
