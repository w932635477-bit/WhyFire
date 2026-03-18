/**
 * Video Synthesizer Component Tests
 * Tests for FFmpeg loading, synthesis progress, and success/failure states
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { VideoSynthesizerComponent } from './video-synthesizer'
import type { LyricLine } from '@/lib/subtitle/subtitle-styles'

// Mock the VideoSynthesizer class
vi.mock('@/lib/ffmpeg/video-synthesizer', () => ({
  VideoSynthesizer: vi.fn().mockImplementation(() => ({
    synthesize: vi.fn(),
    setSubtitleConfig: vi.fn(),
    getSubtitleConfig: vi.fn(),
    getStage: vi.fn(),
    getStageProgress: vi.fn(),
  })),
  downloadVideoBlob: vi.fn(),
  revokeVideoUrl: vi.fn(),
}))

// Mock useFFmpeg hook
vi.mock('@/hooks/use-ffmpeg', () => ({
  useFFmpeg: vi.fn(() => ({
    loaded: true,
    loading: false,
    error: null,
    progress: 1,
    client: null,
    multiThread: false,
    sharedArrayBufferSupport: { supported: true },
    load: vi.fn(),
    terminate: vi.fn(),
  })),
}))

// Sample test data
const mockLyrics: LyricLine[] = [
  { id: '1', text: 'First line', startTime: 0, endTime: 3000 },
  { id: '2', text: 'Second line', startTime: 3000, endTime: 6000 },
  { id: '3', text: 'Third line', startTime: 6000, endTime: 9000 },
]

const mockVideoFile = new File(['video content'], 'test-video.mp4', {
  type: 'video/mp4',
})

const mockAudioFile = new File(['audio content'], 'test-audio.mp3', {
  type: 'audio/mp3',
})

describe('VideoSynthesizerComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Render', () => {
    it('renders without crashing', () => {
      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
        />
      )

      expect(screen.getByText('Video Synthesizer')).toBeInTheDocument()
    })

    it('displays input file information', () => {
      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
        />
      )

      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      expect(screen.getByText('test-audio.mp3')).toBeInTheDocument()
    })

    it('displays lyrics count', () => {
      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
        />
      )

      expect(screen.getByText('3 lines')).toBeInTheDocument()
    })

    it('displays start synthesis button', () => {
      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
        />
      )

      expect(screen.getByText('Start Synthesis')).toBeInTheDocument()
    })
  })

  describe('Subtitle Style Selection', () => {
    it('displays all style options', () => {
      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
        />
      )

      expect(screen.getByText('Karaoke')).toBeInTheDocument()
      expect(screen.getByText('Bounce')).toBeInTheDocument()
      expect(screen.getByText('Gradient')).toBeInTheDocument()
      expect(screen.getByText('Neon')).toBeInTheDocument()
    })

    it('changes style when clicked', async () => {
      const user = userEvent.setup()

      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
        />
      )

      // Initial style should be Karaoke (default)
      const karaokeButton = screen.getByText('Karaoke')
      expect(karaokeButton).toHaveClass('bg-purple-600')

      // Click Bounce style
      const bounceButton = screen.getByText('Bounce')
      await user.click(bounceButton)

      expect(bounceButton).toHaveClass('bg-purple-600')
      expect(karaokeButton).not.toHaveClass('bg-purple-600')
    })
  })

  describe('FFmpeg Loading State', () => {
    it('shows loading state when FFmpeg is loading', () => {
      const { useFFmpeg } = require('@/hooks/use-ffmpeg')
      useFFmpeg.mockReturnValueOnce({
        loaded: false,
        loading: true,
        error: null,
        progress: 0.5,
        client: null,
        multiThread: false,
        sharedArrayBufferSupport: { supported: true },
        load: vi.fn(),
        terminate: vi.fn(),
      })

      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
        />
      )

      const button = screen.getByText('Start Synthesis')
      expect(button).toBeDisabled()
    })
  })

  describe('Synthesis Progress', () => {
    it('shows progress bar during synthesis', async () => {
      const { VideoSynthesizer } = require('@/lib/ffmpeg/video-synthesizer')

      // Mock synthesize to call progress callback
      const mockSynthesize = vi.fn().mockImplementation(async (options) => {
        // Simulate progress updates
        const { onProgress } = options
        if (onProgress) {
          onProgress({ stage: 'loading-ffmpeg', progress: 0.5, overallProgress: 0.1, message: 'Loading...' })
          await new Promise(resolve => setTimeout(resolve, 100))
          onProgress({ stage: 'synthesizing', progress: 0.5, overallProgress: 0.5, message: 'Synthesizing...' })
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        return {
          blob: new Blob(['video'], { type: 'video/mp4' }),
          url: 'blob:test',
          filename: 'output.mp4',
          size: 1024,
          duration: 1000,
        }
      })

      VideoSynthesizer.mockImplementation(() => ({
        synthesize: mockSynthesize,
        setSubtitleConfig: vi.fn(),
        getSubtitleConfig: vi.fn(),
      }))

      const onComplete = vi.fn()

      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={onComplete}
          onError={vi.fn()}
          showPreview={false}
        />
      )

      // Start synthesis
      const startButton = screen.getByText('Start Synthesis')
      fireEvent.click(startButton)

      // Wait for synthesis to complete
      await waitFor(() => {
        expect(mockSynthesize).toHaveBeenCalled()
      }, { timeout: 5000 })
    })

    it('disables button during synthesis', async () => {
      const { VideoSynthesizer } = require('@/lib/ffmpeg/video-synthesizer')

      // Mock synthesize to take some time
      const mockSynthesize = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return {
          blob: new Blob(['video'], { type: 'video/mp4' }),
          url: 'blob:test',
          filename: 'output.mp4',
          size: 1024,
          duration: 1000,
        }
      })

      VideoSynthesizer.mockImplementation(() => ({
        synthesize: mockSynthesize,
        setSubtitleConfig: vi.fn(),
        getSubtitleConfig: vi.fn(),
      }))

      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
          showPreview={false}
        />
      )

      // Start synthesis
      const startButton = screen.getByText('Start Synthesis')
      fireEvent.click(startButton)

      // Button should be disabled and show loading state
      await waitFor(() => {
        const buttonText = screen.getByText('Synthesizing...')
        expect(buttonText).toBeInTheDocument()
      })
    })
  })

  describe('Success State', () => {
    it('shows success message on completion', async () => {
      const { VideoSynthesizer } = require('@/lib/ffmpeg/video-synthesizer')

      const mockSynthesize = vi.fn().mockResolvedValue({
        blob: new Blob(['video'], { type: 'video/mp4' }),
        url: 'blob:test',
        filename: 'output.mp4',
        size: 1024,
        duration: 1000,
      })

      VideoSynthesizer.mockImplementation(() => ({
        synthesize: mockSynthesize,
        setSubtitleConfig: vi.fn(),
        getSubtitleConfig: vi.fn(),
      }))

      const onComplete = vi.fn()

      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={onComplete}
          onError={vi.fn()}
          showPreview={false}
        />
      )

      // Start synthesis
      const startButton = screen.getByText('Start Synthesis')
      fireEvent.click(startButton)

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Synthesis Complete!')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(onComplete).toHaveBeenCalled()
    })

    it('shows download button on completion', async () => {
      const { VideoSynthesizer } = require('@/lib/ffmpeg/video-synthesizer')

      const mockSynthesize = vi.fn().mockResolvedValue({
        blob: new Blob(['video'], { type: 'video/mp4' }),
        url: 'blob:test',
        filename: 'output.mp4',
        size: 1024,
        duration: 1000,
      })

      VideoSynthesizer.mockImplementation(() => ({
        synthesize: mockSynthesize,
        setSubtitleConfig: vi.fn(),
        getSubtitleConfig: vi.fn(),
      }))

      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
          showPreview={false}
        />
      )

      // Start synthesis
      const startButton = screen.getByText('Start Synthesis')
      fireEvent.click(startButton)

      // Wait for download button
      await waitFor(() => {
        expect(screen.getByText('Download')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Failure State', () => {
    it('shows error message on failure', async () => {
      const { VideoSynthesizer } = require('@/lib/ffmpeg/video-synthesizer')

      const mockError = new Error('FFmpeg synthesis failed')
      const mockSynthesize = vi.fn().mockRejectedValue(mockError)

      VideoSynthesizer.mockImplementation(() => ({
        synthesize: mockSynthesize,
        setSubtitleConfig: vi.fn(),
        getSubtitleConfig: vi.fn(),
      }))

      const onError = vi.fn()

      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={onError}
          showPreview={false}
        />
      )

      // Start synthesis
      const startButton = screen.getByText('Start Synthesis')
      fireEvent.click(startButton)

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Synthesis Failed')).toBeInTheDocument()
        expect(screen.getByText('FFmpeg synthesis failed')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(onError).toHaveBeenCalledWith(mockError)
    })

    it('allows retry after error', async () => {
      const { VideoSynthesizer } = require('@/lib/ffmpeg/video-synthesizer')

      // First call fails, second succeeds
      const mockSynthesize = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({
          blob: new Blob(['video'], { type: 'video/mp4' }),
          url: 'blob:test',
          filename: 'output.mp4',
          size: 1024,
          duration: 1000,
        })

      VideoSynthesizer.mockImplementation(() => ({
        synthesize: mockSynthesize,
        setSubtitleConfig: vi.fn(),
        getSubtitleConfig: vi.fn(),
      }))

      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
          showPreview={false}
        />
      )

      // First attempt
      const startButton = screen.getByText('Start Synthesis')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Synthesis Failed')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Second attempt (retry)
      const retryButton = screen.getByText('Start Synthesis')
      expect(retryButton).not.toBeDisabled()
    })
  })

  describe('Auto Start', () => {
    it('automatically starts synthesis when autoStart is true', async () => {
      const { VideoSynthesizer } = require('@/lib/ffmpeg/video-synthesizer')

      const mockSynthesize = vi.fn().mockResolvedValue({
        blob: new Blob(['video'], { type: 'video/mp4' }),
        url: 'blob:test',
        filename: 'output.mp4',
        size: 1024,
        duration: 1000,
      })

      VideoSynthesizer.mockImplementation(() => ({
        synthesize: mockSynthesize,
        setSubtitleConfig: vi.fn(),
        getSubtitleConfig: vi.fn(),
      }))

      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
          autoStart={true}
          showPreview={false}
        />
      )

      await waitFor(() => {
        expect(mockSynthesize).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('Progress Callbacks', () => {
    it('calls onProgress callback during synthesis', async () => {
      const { VideoSynthesizer } = require('@/lib/ffmpeg/video-synthesizer')

      const onProgress = vi.fn()

      const mockSynthesize = vi.fn().mockImplementation(async (options) => {
        const { onProgress: progressCallback } = options
        if (progressCallback) {
          progressCallback({ stage: 'synthesizing', progress: 0.5, overallProgress: 0.5, message: 'Processing...' })
        }
        return {
          blob: new Blob(['video'], { type: 'video/mp4' }),
          url: 'blob:test',
          filename: 'output.mp4',
          size: 1024,
          duration: 1000,
        }
      })

      VideoSynthesizer.mockImplementation(() => ({
        synthesize: mockSynthesize,
        setSubtitleConfig: vi.fn(),
        getSubtitleConfig: vi.fn(),
      }))

      render(
        <VideoSynthesizerComponent
          videoFile={mockVideoFile}
          audioFile={mockAudioFile}
          lyrics={mockLyrics}
          onComplete={vi.fn()}
          onError={vi.fn()}
          onProgress={onProgress}
          showPreview={false}
        />
      )

      // Start synthesis
      const startButton = screen.getByText('Start Synthesis')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalledWith(0.5)
      }, { timeout: 3000 })
    })
  })
})
