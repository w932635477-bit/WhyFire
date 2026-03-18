import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Input } from "./input"
import { Search } from "lucide-react"

describe("Input", () => {
  it("renders correctly with default props", () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText("Enter text")
    expect(input).toBeInTheDocument()
  })

  it("applies default input classes", () => {
    render(<Input placeholder="Test" />)
    const input = screen.getByPlaceholderText("Test")
    expect(input).toHaveClass("h-10")
    expect(input).toHaveClass("w-full")
    expect(input).toHaveClass("rounded-lg")
    expect(input).toHaveClass("border")
    expect(input).toHaveClass("border-border")
    expect(input).toHaveClass("bg-card")
  })

  it("renders with icon on the left", () => {
    render(<Input icon={Search} placeholder="Search" />)
    const input = screen.getByPlaceholderText("Search")
    expect(input).toHaveClass("pl-10")

    // Check if icon is rendered
    const iconContainer = input.parentElement?.querySelector("svg")
    expect(iconContainer).toBeInTheDocument()
  })

  it("displays error message below input", () => {
    render(<Input error="This field is required" placeholder="Email" />)
    const input = screen.getByPlaceholderText("Email")
    const errorMessage = screen.getByText("This field is required")

    expect(input).toBeInTheDocument()
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveClass("text-error")
    expect(errorMessage).toHaveClass("text-xs")
  })

  it("applies error styles when error prop is provided", () => {
    render(<Input error="Invalid input" placeholder="Test" />)
    const input = screen.getByPlaceholderText("Test")
    expect(input).toHaveClass("border-error")
    expect(input).toHaveClass("focus:ring-error")
  })

  it("does not display error message when error is undefined", () => {
    render(<Input placeholder="Test" />)
    const errorElement = screen.queryByText(/.+/)
    expect(errorElement).toBeNull()
  })

  it("merges custom className", () => {
    render(<Input className="custom-class" placeholder="Test" />)
    const input = screen.getByPlaceholderText("Test")
    expect(input).toHaveClass("custom-class")
    // Should still have default classes
    expect(input).toHaveClass("h-10")
    expect(input).toHaveClass("w-full")
  })

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} placeholder="Test" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it("passes through additional input props", () => {
    render(
      <Input
        type="email"
        name="email"
        id="email-input"
        required
        disabled
        placeholder="Email"
      />
    )
    const input = screen.getByPlaceholderText("Email")
    expect(input).toHaveAttribute("type", "email")
    expect(input).toHaveAttribute("name", "email")
    expect(input).toHaveAttribute("id", "email-input")
    expect(input).toBeRequired()
    expect(input).toBeDisabled()
  })

  it("applies disabled styles when disabled", () => {
    render(<Input disabled placeholder="Test" />)
    const input = screen.getByPlaceholderText("Test")
    expect(input).toBeDisabled()
    expect(input).toHaveClass("disabled:cursor-not-allowed")
    expect(input).toHaveClass("disabled:opacity-50")
  })

  it("renders different input types", () => {
    const { rerender } = render(<Input type="text" placeholder="Text" />)
    expect(screen.getByPlaceholderText("Text")).toHaveAttribute("type", "text")

    rerender(<Input type="email" placeholder="Email" data-testid="email-input" />)
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute("type", "email")

    rerender(<Input type="password" placeholder="Password" data-testid="password-input" />)
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "password")

    rerender(<Input type="number" placeholder="Number" data-testid="number-input" />)
    expect(screen.getByPlaceholderText("Number")).toHaveAttribute("type", "number")
  })

  it("applies focus ring styles", () => {
    render(<Input placeholder="Test" />)
    const input = screen.getByPlaceholderText("Test")
    expect(input).toHaveClass("focus:ring-2")
    expect(input).toHaveClass("focus:ring-primary")
    expect(input).toHaveClass("focus:outline-none")
  })

  it("renders with placeholder text styling", () => {
    render(<Input placeholder="Enter your name" />)
    const input = screen.getByPlaceholderText("Enter your name")
    expect(input).toHaveClass("placeholder:text-muted")
  })

  it("handles value and onChange", async () => {
    let value = ""
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      value = e.target.value
    }
    render(<Input value="test" onChange={handleChange} placeholder="Test" />)
    const input = screen.getByPlaceholderText("Test") as HTMLInputElement
    expect(input.value).toBe("test")
  })

  it("supports maxLength attribute", () => {
    render(<Input maxLength={10} placeholder="Limited" />)
    const input = screen.getByPlaceholderText("Limited")
    expect(input).toHaveAttribute("maxLength", "10")
  })

  it("supports readOnly attribute", () => {
    render(<Input readOnly placeholder="Read only" />)
    const input = screen.getByPlaceholderText("Read only")
    expect(input).toHaveAttribute("readOnly")
  })

  it("renders without icon when icon prop is not provided", () => {
    render(<Input placeholder="No icon" />)
    const input = screen.getByPlaceholderText("No icon")
    expect(input).not.toHaveClass("pl-10")

    const svg = document.querySelector("svg")
    expect(svg).toBeNull()
  })

  it("maintains error state consistency", () => {
    const { rerender } = render(<Input placeholder="Test" />)
    const input = screen.getByPlaceholderText("Test")
    expect(input).not.toHaveClass("border-error")

    rerender(<Input error="New error" placeholder="Test" />)
    expect(input).toHaveClass("border-error")
    expect(screen.getByText("New error")).toBeInTheDocument()

    rerender(<Input placeholder="Test" />)
    expect(input).not.toHaveClass("border-error")
  })

  it("renders with icon and error together", () => {
    render(<Input icon={Search} error="Search is required" placeholder="Search" />)
    const input = screen.getByPlaceholderText("Search")

    // Should have both icon padding and error styles
    expect(input).toHaveClass("pl-10")
    expect(input).toHaveClass("border-error")

    // Both icon and error message should be present
    const icon = input.parentElement?.querySelector("svg")
    expect(icon).toBeInTheDocument()
    expect(screen.getByText("Search is required")).toBeInTheDocument()
  })
})
