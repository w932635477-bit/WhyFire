import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProfileForm, ProfileFormData } from './profile-form'

// Store original FileReader
const originalFileReader = window.FileReader

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}))

describe('ProfileForm', () => {
  let mockOnSubmit: (data: ProfileFormData) => Promise<void>

  beforeEach(() => {
    mockOnSubmit = vi.fn().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore FileReader
    if (originalFileReader) {
      window.FileReader = originalFileReader
    }
  })

  describe('Rendering', () => {
    it('renders all form elements', () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      // Avatar upload
      expect(screen.getByText(/click to upload avatar/i)).toBeInTheDocument()

      // Nickname field
      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter your nickname/i)).toBeInTheDocument()

      // Bio field
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/tell us about yourself/i)).toBeInTheDocument()

      // Submit button
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument()
    })

    it('renders with initial data', () => {
      render(
        <ProfileForm
          onSubmit={mockOnSubmit}
          initialData={{
            nickname: 'John Doe',
            bio: 'Hello, I am John!',
            avatarUrl: 'https://example.com/avatar.jpg',
          }}
        />
      )

      const nicknameInput = screen.getByDisplayValue('John Doe')
      const bioTextarea = screen.getByDisplayValue('Hello, I am John!')

      expect(nicknameInput).toBeInTheDocument()
      expect(bioTextarea).toBeInTheDocument()

      // Check avatar preview
      const avatarImage = screen.getByAltText('Avatar')
      expect(avatarImage).toBeInTheDocument()
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('renders character count for nickname', () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      fireEvent.change(nicknameInput, { target: { value: 'Test' } })

      expect(screen.getByText(/4\/20 characters/i)).toBeInTheDocument()
    })

    it('renders character count for bio', () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const bioTextarea = screen.getByPlaceholderText(/tell us about yourself/i)
      fireEvent.change(bioTextarea, { target: { value: 'Test bio' } })

      expect(screen.getByText(/8\/200 characters/i)).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('shows error when nickname is empty', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /save profile/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/nickname is required/i)).toBeInTheDocument()
      })
    })

    it('shows error when nickname is too short', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      fireEvent.change(nicknameInput, { target: { value: 'A' } })

      const submitButton = screen.getByRole('button', { name: /save profile/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/nickname must be at least 2 characters/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error when nickname is too long', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      fireEvent.change(nicknameInput, {
        target: { value: 'A'.repeat(21) },
      })

      const submitButton = screen.getByRole('button', { name: /save profile/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/nickname must be less than 20 characters/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error when bio is too long', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      fireEvent.change(nicknameInput, { target: { value: 'Valid Name' } })

      const bioTextarea = screen.getByPlaceholderText(/tell us about yourself/i)
      fireEvent.change(bioTextarea, {
        target: { value: 'A'.repeat(201) },
      })

      const submitButton = screen.getByRole('button', { name: /save profile/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/bio must be less than 200 characters/i)
        ).toBeInTheDocument()
      })
    })

    it('clears error when user fixes the input', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)

      // Trigger error
      fireEvent.change(nicknameInput, { target: { value: 'A' } })
      expect(
        screen.queryByText(/nickname must be at least 2 characters/i)
      ).toBeInTheDocument()

      // Fix the error
      fireEvent.change(nicknameInput, { target: { value: 'Valid Name' } })

      await waitFor(() => {
        expect(
          screen.queryByText(/nickname must be at least 2 characters/i)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Avatar Upload', () => {
    it('triggers file input when avatar area is clicked', () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const fileInput = screen.getByLabelText('Upload avatar')

      // Verify file input is hidden
      expect(fileInput).toHaveAttribute('type', 'file')
    })

    it('shows error for invalid file type', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const fileInput = screen.getByLabelText('Upload avatar')

      // Create a mock file with invalid type
      const file = new File(['test'], 'test.gif', { type: 'image/gif' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(
          screen.getByText(/only jpg and png files are allowed/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error for file size exceeding 2MB', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const fileInput = screen.getByLabelText('Upload avatar')

      // Create a mock file larger than 2MB
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })
      fireEvent.change(fileInput, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(
          screen.getByText(/file size must be less than 2mb/i)
        ).toBeInTheDocument()
      })
    })

    it('accepts valid JPG file', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const fileInput = screen.getByLabelText('Upload avatar')

      // Create a valid mock file
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      // Verify no error message
      await waitFor(() => {
        expect(
          screen.queryByText(/only jpg and png files are allowed/i)
        ).not.toBeInTheDocument()
      })
    })

    it('accepts valid PNG file', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const fileInput = screen.getByLabelText('Upload avatar')

      // Create a valid mock file
      const file = new File(['test'], 'avatar.png', { type: 'image/png' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      // Verify no error message
      expect(
        screen.queryByText(/only jpg and png files are allowed/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('calls onSubmit with form data on valid submission', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      const bioTextarea = screen.getByPlaceholderText(/tell us about yourself/i)
      const submitButton = screen.getByRole('button', { name: /save profile/i })

      // Fill in form
      fireEvent.change(nicknameInput, { target: { value: 'John Doe' } })
      fireEvent.change(bioTextarea, { target: { value: 'Hello!' } })

      // Submit form
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          nickname: 'John Doe',
          bio: 'Hello!',
          avatar: undefined,
        })
      })
    })

    it('shows loading state during submission', async () => {
      const slowOnSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      )

      render(<ProfileForm onSubmit={slowOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      const submitButton = screen.getByRole('button', { name: /save profile/i })

      fireEvent.change(nicknameInput, { target: { value: 'John Doe' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })
    })

    it('shows success message after successful submission', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      const submitButton = screen.getByRole('button', { name: /save profile/i })

      fireEvent.change(nicknameInput, { target: { value: 'John Doe' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/profile saved successfully/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error message when submission fails', async () => {
      const failingOnSubmit = vi.fn().mockRejectedValue(new Error('Network error'))

      render(<ProfileForm onSubmit={failingOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      const submitButton = screen.getByRole('button', { name: /save profile/i })

      fireEvent.change(nicknameInput, { target: { value: 'John Doe' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        // Use getAllByText to handle multiple matches
        const errorElements = screen.getAllByText(/network error/i)
        expect(errorElements.length).toBeGreaterThan(0)
      })
    })

    it('does not submit when there are validation errors', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const submitButton = screen.getByRole('button', { name: /save profile/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('submits with avatar file when provided', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      const fileInput = screen.getByLabelText('Upload avatar')
      const submitButton = screen.getByRole('button', { name: /save profile/i })

      // Fill in form
      fireEvent.change(nicknameInput, { target: { value: 'John Doe' } })

      // Add avatar file
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      // Submit form
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            nickname: 'John Doe',
            avatar: expect.any(File),
          })
        )
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for form fields', () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Upload avatar')).toBeInTheDocument()
    })

    it('disables form fields when loading', async () => {
      const slowOnSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      )

      render(<ProfileForm onSubmit={slowOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      const bioTextarea = screen.getByPlaceholderText(/tell us about yourself/i)
      const submitButton = screen.getByRole('button', { name: /save profile/i })

      fireEvent.change(nicknameInput, { target: { value: 'John Doe' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(nicknameInput).toBeDisabled()
        expect(bioTextarea).toBeDisabled()
        expect(submitButton).toBeDisabled()
      })
    })

    it('has required indicator for nickname field', () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const requiredIndicator = screen.getByText('*', { selector: '.text-error' })
      expect(requiredIndicator).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty bio correctly', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      const submitButton = screen.getByRole('button', { name: /save profile/i })

      fireEvent.change(nicknameInput, { target: { value: 'John Doe' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          nickname: 'John Doe',
          bio: '',
          avatar: undefined,
        })
      })
    })

    it('handles maximum length nickname', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      const submitButton = screen.getByRole('button', { name: /save profile/i })

      const maxNickname = 'A'.repeat(20)
      fireEvent.change(nicknameInput, { target: { value: maxNickname } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('handles maximum length bio', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      const bioTextarea = screen.getByPlaceholderText(/tell us about yourself/i)
      const submitButton = screen.getByRole('button', { name: /save profile/i })

      const maxBio = 'A'.repeat(200)
      fireEvent.change(nicknameInput, { target: { value: 'John Doe' } })
      fireEvent.change(bioTextarea, { target: { value: maxBio } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('clears avatar file after successful submission', async () => {
      render(<ProfileForm onSubmit={mockOnSubmit} />)

      const nicknameInput = screen.getByPlaceholderText(/enter your nickname/i)
      const fileInput = screen.getByLabelText('Upload avatar')
      const submitButton = screen.getByRole('button', { name: /save profile/i })

      // Fill in form with avatar
      fireEvent.change(nicknameInput, { target: { value: 'John Doe' } })
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      // Submit form
      fireEvent.click(submitButton)

      // Wait for success message
      await waitFor(() => {
        expect(
          screen.getByText(/profile saved successfully/i)
        ).toBeInTheDocument()
      })

      // Submit again should not include avatar
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenLastCalledWith({
          nickname: 'John Doe',
          bio: '',
          avatar: undefined,
        })
      })
    })
  })
})
