import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { Header } from "./header"

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  },
}))

describe("Header", () => {
  const mockUser = {
    id: "1",
    name: "Test User",
    email: "test@example.com",
    avatar: "https://example.com/avatar.jpg",
  }

  it("renders logo with WhyFire text", () => {
    render(<Header />)
    const logo = screen.getByText("WhyFire")
    expect(logo).toBeInTheDocument()
  })

  it("renders navigation links", () => {
    render(<Header />)
    expect(screen.getByText("创作视频")).toBeInTheDocument()
    expect(screen.getByText("定价")).toBeInTheDocument()
  })

  it("navigation links have correct hrefs", () => {
    render(<Header />)
    expect(screen.getByText("创作视频").closest("a")).toHaveAttribute("href", "/create")
    expect(screen.getByText("定价"). closest("a")).toHaveAttribute("href", "/pricing")
  })

  it("shows login button when user is not logged in", () => {
    render(<Header />)
    const loginButton = screen.getByRole("button", { name: /登录/i })
    expect(loginButton).toBeInTheDocument()
  })

  it("calls onLogin when login button is clicked", () => {
    const onLogin = vi.fn()
    render(<Header onLogin={onLogin} />)
    const loginButton = screen.getByRole("button", { name: /登录/i })
    fireEvent.click(loginButton)
    expect(onLogin).toHaveBeenCalledTimes(1)
  })

  it("shows user avatar when user is logged in with avatar", () => {
    render(<Header user={mockUser} />)
    const avatar = screen.getByAltText(mockUser.name)
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute("src", mockUser.avatar)
  })

  it("shows user icon when user is logged in without avatar", () => {
    const userWithoutAvatar = { ...mockUser, avatar: undefined }
    render(<Header user={userWithoutAvatar} />)
    const userButton = screen.getByLabelText("User menu")
    expect(userButton).toBeInTheDocument()
  })

  it("shows dropdown when avatar is clicked", () => {
    render(<Header user={mockUser} />)
    const userButton = screen.getByLabelText("User menu")
    fireEvent.click(userButton)

    expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    expect(screen.getByText("退出登录")).toBeInTheDocument()
  })

  it("calls onLogout when logout button is clicked", () => {
    const onLogout = vi.fn()
    render(<Header user={mockUser} onLogout={onLogout} />)

    const userButton = screen.getByLabelText("User menu")
    fireEvent.click(userButton)

    const logoutButton = screen.getByText("退出登录")
    fireEvent.click(logoutButton)

    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it("closes dropdown when clicking outside", () => {
    render(<Header user={mockUser} />)

    const userButton = screen.getByLabelText("User menu")
    fireEvent.click(userButton)
    expect(screen.getByText("退出登录")).toBeInTheDocument()

    // Click outside
    fireEvent.mouseDown(document.body)

    // Dropdown should be closed
    expect(screen.queryByText("退出登录")).not.toBeInTheDocument()
  })

  it("applies sticky positioning", () => {
    render(<Header />)
    const header = screen.getByRole("banner")
    expect(header).toHaveClass("sticky")
    expect(header).toHaveClass("top-0")
  })

  it("applies semi-transparent background", () => {
    render(<Header />)
    const header = screen.getByRole("banner")
    expect(header).toHaveClass("backdrop-blur-md")
    expect(header).toHaveClass("bg-background/80")
  })

  it("applies custom className", () => {
    render(<Header className="custom-header" />)
    const header = screen.getByRole("banner")
    expect(header).toHaveClass("custom-header")
  })

  it("hides navigation on mobile (md breakpoint)", () => {
    render(<Header />)
    const nav = screen.getByText("创作视频").closest("nav")
    expect(nav).toHaveClass("hidden")
    expect(nav).toHaveClass("md:flex")
  })
})
