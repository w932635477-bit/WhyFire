import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './login-form'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Supabase client
const mockSignInWithOtp = vi.fn()
const mockVerifyOtp = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
    },
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email input and send code button initially', () => {
    render(<LoginForm />)

    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /发送验证码/ })).toBeInTheDocument()
  })

  it('shows error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('your@email.com')
    const sendButton = screen.getByRole('button', { name: /发送验证码/ })

    await user.type(emailInput, 'invalid-email')
    await user.click(sendButton)

    expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument()
  })

  it('sends OTP and moves to verification step', async () => {
    const user = userEvent.setup()
    mockSignInWithOtp.mockResolvedValue({ error: null })
    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('your@email.com')
    const sendButton = screen.getByRole('button', { name: /发送验证码/ })

    await user.type(emailInput, 'test@example.com')
    await user.click(sendButton)

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/输入验证码/)).toBeInTheDocument()
    })
  })

  it('shows OTP input after email submission', async () => {
    const user = userEvent.setup()
    mockSignInWithOtp.mockResolvedValue({ error: null })
    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('your@email.com')
    await user.type(emailInput, 'test@example.com')

    const sendButton = screen.getByRole('button', { name: /发送验证码/ })
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument()
    })
  })

  it('verifies OTP and redirects on success', async () => {
    const user = userEvent.setup()
    mockSignInWithOtp.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({ error: null })
    render(<LoginForm />)

    // Enter email and send OTP
    const emailInput = screen.getByPlaceholderText('your@email.com')
    await user.type(emailInput, 'test@example.com')

    const sendButton = screen.getByRole('button', { name: /发送验证码/ })
    await user.click(sendButton)

    // Wait for OTP input
    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument()
    })

    // Enter OTP
    const otpInput = screen.getByPlaceholderText('000000')
    await user.type(otpInput, '123456')

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456',
        type: 'email',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/sonic-gallery')
    })
  })

  it('shows error message when OTP verification fails', async () => {
    const user = userEvent.setup()
    mockSignInWithOtp.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({
      error: { message: 'Invalid OTP' }
    })
    render(<LoginForm />)

    // Enter email and send OTP
    const emailInput = screen.getByPlaceholderText('your@email.com')
    await user.type(emailInput, 'test@example.com')

    const sendButton = screen.getByRole('button', { name: /发送验证码/ })
    await user.click(sendButton)

    // Wait for OTP input
    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument()
    })

    // Enter OTP
    const otpInput = screen.getByPlaceholderText('000000')
    await user.type(otpInput, '000000')

    await waitFor(() => {
      expect(screen.getByText(/操作失败，请重试/)).toBeInTheDocument()
    })
  })

  it('allows going back to email step', async () => {
    const user = userEvent.setup()
    mockSignInWithOtp.mockResolvedValue({ error: null })
    render(<LoginForm />)

    // Enter email and send OTP
    const emailInput = screen.getByPlaceholderText('your@email.com')
    await user.type(emailInput, 'test@example.com')

    const sendButton = screen.getByRole('button', { name: /发送验证码/ })
    await user.click(sendButton)

    // Wait for OTP step
    await waitFor(() => {
      expect(screen.getByText(/更换邮箱/)).toBeInTheDocument()
    })

    // Click back
    const backButton = screen.getByText(/更换邮箱/)
    await user.click(backButton)

    // Should be back to email step
    await waitFor(() => {
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    })
  })

  it('disables send button when email is empty', () => {
    render(<LoginForm />)

    const sendButton = screen.getByRole('button', { name: /发送验证码/ })
    expect(sendButton).toBeDisabled()
  })

  it('enables send button when email is entered', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText('your@email.com')
    const sendButton = screen.getByRole('button', { name: /发送验证码/ })

    await user.type(emailInput, 'test@example.com')

    expect(sendButton).not.toBeDisabled()
  })
})
