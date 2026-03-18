import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VideoGrid } from './video-grid'
import { Video } from '@/types/video'

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockUnobserve = vi.fn()
const mockDisconnect = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()

  // Use class syntax for constructor mock
  // @ts-ignore
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe = mockObserve
    unobserve = mockUnobserve
    disconnect = mockDisconnect
  }
})

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

describe('VideoGrid', () => {
  const mockVideos: Video[] = [
    {
      id: 'video-1',
      userId: 'user-1',
      title: 'Video 1',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      videoUrl: 'https://example.com/video1.mp4',
      duration: 120,
      createdAt: '2024-01-01T00:00:00.000Z',
      status: 'completed',
    },
    {
      id: 'video-2',
      userId: 'user-1',
      title: 'Video 2',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      videoUrl: 'https://example.com/video2.mp4',
      duration: 90,
      createdAt: '2024-01-02T00:00:00.000Z',
      status: 'completed',
    },
  ]

  const mockOnDelete = vi.fn()
  const mockOnDownload = vi.fn()
  const mockOnLoadMore = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton when loading and no videos', () => {
    render(
      <VideoGrid
        videos={[]}
        loading={true}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    // Should show skeleton placeholders
    const skeletonCards = screen.getAllByRole('generic').filter(el =>
      el.className.includes('animate-pulse')
    )
    expect(skeletonCards.length).toBeGreaterThan(0)
  })

  it('renders empty state when no videos and not loading', () => {
    render(
      <VideoGrid
        videos={[]}
        loading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.getByText('还没有作品')).toBeInTheDocument()
    expect(screen.getByText(/开始创作你的第一个/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /开始创作/ })).toHaveAttribute('href', '/create')
  })

  it('renders video cards correctly', () => {
    render(
      <VideoGrid
        videos={mockVideos}
        loading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.getByText('Video 1')).toBeInTheDocument()
    expect(screen.getByText('Video 2')).toBeInTheDocument()
  })

  it('shows "end of list" message when hasMore is false', () => {
    render(
      <VideoGrid
        videos={mockVideos}
        loading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.getByText(/已显示全部 2 个作品/)).toBeInTheDocument()
  })

  it('does not show "end of list" when hasMore is true', () => {
    render(
      <VideoGrid
        videos={mockVideos}
        loading={false}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.queryByText(/已显示全部/)).not.toBeInTheDocument()
  })

  it('renders responsive grid layout', () => {
    const { container } = render(
      <VideoGrid
        videos={mockVideos}
        loading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid-cols-1')
    expect(grid).toHaveClass('sm:grid-cols-2')
    expect(grid).toHaveClass('lg:grid-cols-3')
    expect(grid).toHaveClass('xl:grid-cols-4')
  })

  it('passes correct props to VideoCard components', () => {
    render(
      <VideoGrid
        videos={mockVideos}
        loading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    // VideoCard should be rendered with correct video data
    expect(screen.getByText('Video 1')).toBeInTheDocument()
    expect(screen.getByText('Video 2')).toBeInTheDocument()
  })

  it('shows loading indicator when loading and has videos', () => {
    render(
      <VideoGrid
        videos={mockVideos}
        loading={true}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })
})
