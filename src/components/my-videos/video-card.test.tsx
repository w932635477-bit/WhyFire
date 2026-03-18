import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { VideoCard } from './video-card'
import { Video } from '@/types/video'

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('VideoCard', () => {
  const mockVideo: Video = {
    id: 'test-video-id',
    userId: 'test-user-id',
    title: 'Test Video Title',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    videoUrl: 'https://example.com/video.mp4',
    duration: 120,
    createdAt: '2024-01-01T00:00:00.000Z',
    status: 'completed',
  }

  const mockOnDelete = vi.fn()
  const mockOnDownload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders video card with all information', () => {
    render(
      <VideoCard
        video={mockVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    // Check title
    expect(screen.getByText('Test Video Title')).toBeInTheDocument()

    // Check duration
    expect(screen.getByText('2:00')).toBeInTheDocument()

    // Check status
    expect(screen.getByText('已完成')).toBeInTheDocument()
  })

  it('formats duration correctly', () => {
    const shortVideo = { ...mockVideo, duration: 45 }
    render(
      <VideoCard
        video={shortVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.getByText('0:45')).toBeInTheDocument()
  })

  it('formats date correctly', () => {
    render(
      <VideoCard
        video={mockVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('shows processing status correctly', () => {
    const processingVideo = { ...mockVideo, status: 'processing' as const }
    render(
      <VideoCard
        video={processingVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.getByText('处理中')).toBeInTheDocument()
  })

  it('shows failed status correctly', () => {
    const failedVideo = { ...mockVideo, status: 'failed' as const }
    render(
      <VideoCard
        video={failedVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.getByText('失败')).toBeInTheDocument()
  })

  it('shows delete confirmation modal when delete button is clicked', async () => {
    render(
      <VideoCard
        video={mockVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    // Hover to show buttons
    const card = screen.getByText('Test Video Title').closest('.group')
    if (card) {
      fireEvent.mouseEnter(card)
    }

    // Click delete button
    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(btn => btn.querySelector('.lucide-trash-2'))
    if (deleteButton) {
      fireEvent.click(deleteButton)
    }

    // Check confirmation modal
    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument()
      expect(screen.getByText(/确定要删除视频/)).toBeInTheDocument()
    })
  })

  it('cancels delete when cancel button is clicked', async () => {
    render(
      <VideoCard
        video={mockVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    // Show confirmation modal
    const card = screen.getByText('Test Video Title').closest('.group')
    if (card) {
      fireEvent.mouseEnter(card)
    }

    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(btn => btn.querySelector('.lucide-trash-2'))
    if (deleteButton) {
      fireEvent.click(deleteButton)
    }

    await waitFor(() => {
      expect(screen.getByText('取消')).toBeInTheDocument()
    })

    // Click cancel
    fireEvent.click(screen.getByText('取消'))

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('确认删除')).not.toBeInTheDocument()
    })

    // onDelete should not have been called
    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('calls onDelete when confirm delete is clicked', async () => {
    mockOnDelete.mockResolvedValueOnce(undefined)

    render(
      <VideoCard
        video={mockVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    // Show confirmation modal
    const card = screen.getByText('Test Video Title').closest('.group')
    if (card) {
      fireEvent.mouseEnter(card)
    }

    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(btn => btn.querySelector('.lucide-trash-2'))
    if (deleteButton) {
      fireEvent.click(deleteButton)
    }

    await waitFor(() => {
      expect(screen.getByText('删除', { selector: 'button' })).toBeInTheDocument()
    })

    // Click delete button in modal
    const modalDeleteButtons = screen.getAllByRole('button')
    const modalDeleteButton = modalDeleteButtons.find(btn =>
      btn.textContent?.includes('删除') && !btn.querySelector('.lucide-trash-2')
    )
    if (modalDeleteButton) {
      fireEvent.click(modalDeleteButton)
    }

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('test-video-id')
    })
  })

  it('calls onDownload when download button is clicked', async () => {
    mockOnDownload.mockResolvedValueOnce(undefined)

    render(
      <VideoCard
        video={mockVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    // Hover to show buttons
    const card = screen.getByText('Test Video Title').closest('.group')
    if (card) {
      fireEvent.mouseEnter(card)
    }

    // Click download button
    const downloadButtons = screen.getAllByRole('button')
    const downloadButton = downloadButtons.find(btn => btn.querySelector('.lucide-download'))
    if (downloadButton) {
      fireEvent.click(downloadButton)
    }

    await waitFor(() => {
      expect(mockOnDownload).toHaveBeenCalledWith(mockVideo)
    })
  })

  it('disables download button for non-completed videos', () => {
    const processingVideo = { ...mockVideo, status: 'processing' as const }
    render(
      <VideoCard
        video={processingVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    // Hover to show buttons
    const card = screen.getByText('Test Video Title').closest('.group')
    if (card) {
      fireEvent.mouseEnter(card)
    }

    // Download button should be disabled
    const downloadButtons = screen.getAllByRole('button')
    const downloadButton = downloadButtons.find(btn => btn.querySelector('.lucide-download'))
    expect(downloadButton).toBeDisabled()
  })

  it('renders thumbnail image with correct src', () => {
    render(
      <VideoCard
        video={mockVideo}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    const image = screen.getByRole('img', { name: 'Test Video Title' })
    expect(image).toHaveAttribute('src', 'https://example.com/thumbnail.jpg')
  })
})
