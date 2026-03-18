import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Button } from "./button"

describe("Button", () => {
  it("renders correctly with default props", () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it("applies default variant and size classes", () => {
    render(<Button>Default Button</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("bg-primary")
    expect(button).toHaveClass("text-white")
    expect(button).toHaveClass("h-10")
    expect(button).toHaveClass("px-4")
  })

  it("applies secondary variant classes", () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("bg-secondary")
    expect(button).toHaveClass("text-white")
  })

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("border")
    expect(button).toHaveClass("border-border")
    expect(button).toHaveClass("bg-transparent")
  })

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("hover:bg-accent")
  })

  it("applies destructive variant classes", () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("bg-destructive")
    expect(button).toHaveClass("text-white")
  })

  it("applies small size classes", () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("h-8")
    expect(button).toHaveClass("px-3")
    expect(button).toHaveClass("text-sm")
  })

  it("applies medium size classes", () => {
    render(<Button size="md">Medium</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("h-10")
    expect(button).toHaveClass("px-4")
    expect(button).toHaveClass("text-base")
  })

  it("applies large size classes", () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("h-12")
    expect(button).toHaveClass("px-6")
    expect(button).toHaveClass("text-lg")
  })

  it("applies icon size classes", () => {
    render(<Button size="icon">🎨</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("h-10")
    expect(button).toHaveClass("w-10")
  })

  it("shows loading spinner when loading is true", () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
    // Check for spinner element
    const spinner = button.querySelector(".animate-spin")
    expect(spinner).toBeInTheDocument()
  })

  it("disables button when loading", () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("disables button when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("applies disabled styles", () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("disabled:opacity-50")
    expect(button).toHaveClass("disabled:pointer-events-none")
  })

  it("merges custom className", () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-class")
    // Should still have default classes
    expect(button).toHaveClass("bg-primary")
  })

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref Test</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it("passes through additional button props", () => {
    render(
      <Button type="submit" form="test-form" aria-label="Submit form">
        Submit
      </Button>
    )
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("type", "submit")
    expect(button).toHaveAttribute("form", "test-form")
    expect(button).toHaveAttribute("aria-label", "Submit form")
  })

  it("handles click events", async () => {
    let clicked = false
    render(<Button onClick={() => (clicked = true)}>Click</Button>)
    const button = screen.getByRole("button")
    button.click()
    expect(clicked).toBe(true)
  })
})
