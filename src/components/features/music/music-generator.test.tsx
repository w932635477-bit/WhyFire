/**
 * MusicGenerator 组件测试
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MusicGenerator } from './music-generator'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('MusicGenerator', () => {
  const defaultProps = {
    lyrics: '测试歌词内容',
    dialect: 'mandarin' as const,
    style: 'rap' as const,
    onMusicGenerated: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('渲染测试', () => {
    it('应该正确渲染生成按钮', () => {
      render(<MusicGenerator {...defaultProps} />)

      expect(screen.getByText('生成 Rap 音乐')).toBeInTheDocument()
      expect(screen.getByText('点击生成音乐')).toBeInTheDocument()
      expect(screen.getByText(/AI 将为歌词配上/)).toBeInTheDocument()
    })

    it('没有歌词时应该禁用生成按钮', () => {
      render(<MusicGenerator {...defaultProps} lyrics="" />)

      const button = screen.getByText('点击生成音乐')
      expect(button).toBeDisabled()
      expect(screen.getByText('请先生成歌词')).toBeInTheDocument()
    })

    it('应该显示音乐风格信息', () => {
      render(<MusicGenerator {...defaultProps} style="pop" />)

      expect(screen.getByText(/POP 风格/)).toBeInTheDocument()
    })

    it('应该应用自定义类名', () => {
      const { container } = render(
        <MusicGenerator {...defaultProps} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('生成流程测试', () => {
    it('点击生成按钮应该调用生成 API', async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              code: 0,
              data: { taskId: 'test-task-123', status: 'pending' },
            }),
        })
        .mockResolvedValue({
          json: () =>
            Promise.resolve({
              code: 0,
              data: {
                taskId: 'test-task-123',
                status: 'completed',
                audioUrl: 'https://example.com/music.mp3',
                duration: 30,
              },
            }),
        })

      render(<MusicGenerator {...defaultProps} />)

      const button = screen.getByText('点击生成音乐')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/music/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lyrics: '测试歌词内容',
            dialect: 'mandarin',
            style: 'rap',
            duration: 30,
          }),
        })
      })
    })

    it('API 错误时应该调用 onError 回调', async () => {
      const errorMessage = '生成失败'
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            code: 500,
            message: errorMessage,
            data: { taskId: '', status: 'failed' },
          }),
      })

      render(<MusicGenerator {...defaultProps} />)

      const button = screen.getByText('点击生成音乐')
      fireEvent.click(button)

      await waitFor(
        () => {
          expect(defaultProps.onError).toHaveBeenCalledWith(
            expect.objectContaining({
              message: errorMessage,
            })
          )
        },
        { timeout: 10000 }
      )
    })
  })

  describe('成功状态测试', () => {
    it('完成后应该显示音频播放器', async () => {
      const audioUrl = 'https://example.com/music.mp3'

      // 生成任务 API
      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              code: 0,
              data: { taskId: 'test-task-123', status: 'pending' },
            }),
        })
        // 状态查询 API - 完成
        .mockResolvedValue({
          json: () =>
            Promise.resolve({
              code: 0,
              data: {
                taskId: 'test-task-123',
                status: 'completed',
                audioUrl,
                duration: 30,
              },
            }),
        })

      render(<MusicGenerator {...defaultProps} />)

      const button = screen.getByText('点击生成音乐')
      fireEvent.click(button)

      await waitFor(
        () => {
          const audio = document.querySelector('audio')
          expect(audio).toBeInTheDocument()
          expect(audio).toHaveAttribute('src', audioUrl)
        },
        { timeout: 10000 }
      )
    })

    it('完成后应该显示重新生成和下载按钮', async () => {
      const audioUrl = 'https://example.com/music.mp3'

      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              code: 0,
              data: { taskId: 'test-task-123', status: 'pending' },
            }),
        })
        .mockResolvedValue({
          json: () =>
            Promise.resolve({
              code: 0,
              data: {
                taskId: 'test-task-123',
                status: 'completed',
                audioUrl,
                duration: 30,
              },
            }),
        })

      render(<MusicGenerator {...defaultProps} />)

      const button = screen.getByText('点击生成音乐')
      fireEvent.click(button)

      await waitFor(
        () => {
          expect(screen.getByText('重新生成')).toBeInTheDocument()
          expect(screen.getByText('下载音频')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    })

    it('点击重新生成应该重置状态', async () => {
      const audioUrl = 'https://example.com/music.mp3'

      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              code: 0,
              data: { taskId: 'test-task-123', status: 'pending' },
            }),
        })
        .mockResolvedValue({
          json: () =>
            Promise.resolve({
              code: 0,
              data: {
                taskId: 'test-task-123',
                status: 'completed',
                audioUrl,
                duration: 30,
              },
            }),
        })

      render(<MusicGenerator {...defaultProps} />)

      const button = screen.getByText('点击生成音乐')
      fireEvent.click(button)

      await waitFor(
        () => {
          expect(screen.getByText('重新生成')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )

      const retryButton = screen.getByText('重新生成')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('点击生成音乐')).toBeInTheDocument()
      })
    })
  })

  describe('失败状态测试', () => {
    it('失败后应该显示错误信息和重试按钮', async () => {
      const errorMessage = '服务暂时不可用'

      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              code: 0,
              data: { taskId: 'test-task-123', status: 'pending' },
            }),
        })
        .mockResolvedValue({
          json: () =>
            Promise.resolve({
              code: 0,
              data: {
                taskId: 'test-task-123',
                status: 'failed',
                error: errorMessage,
              },
            }),
        })

      render(<MusicGenerator {...defaultProps} />)

      const button = screen.getByText('点击生成音乐')
      fireEvent.click(button)

      await waitFor(
        () => {
          expect(screen.getByText('生成失败')).toBeInTheDocument()
          expect(screen.getByText(errorMessage)).toBeInTheDocument()
          expect(screen.getByText('重新生成')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    })
  })

  describe('回调测试', () => {
    it('音乐生成成功后应该调用 onMusicGenerated 回调', async () => {
      const audioUrl = 'https://example.com/music.mp3'
      const taskId = 'test-task-123'

      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              code: 0,
              data: { taskId, status: 'pending' },
            }),
        })
        .mockResolvedValue({
          json: () =>
            Promise.resolve({
              code: 0,
              data: {
                taskId,
                status: 'completed',
                audioUrl,
                duration: 30,
              },
            }),
        })

      render(<MusicGenerator {...defaultProps} />)

      const button = screen.getByText('点击生成音乐')
      fireEvent.click(button)

      await waitFor(
        () => {
          expect(defaultProps.onMusicGenerated).toHaveBeenCalledWith(
            audioUrl,
            taskId
          )
        },
        { timeout: 10000 }
      )
    })

    it('应该调用 onNext 回调（如果提供）', async () => {
      const onNext = vi.fn()
      const audioUrl = 'https://example.com/music.mp3'

      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              code: 0,
              data: { taskId: 'test-task-123', status: 'pending' },
            }),
        })
        .mockResolvedValue({
          json: () =>
            Promise.resolve({
              code: 0,
              data: {
                taskId: 'test-task-123',
                status: 'completed',
                audioUrl,
                duration: 30,
              },
            }),
        })

      render(<MusicGenerator {...defaultProps} onNext={onNext} />)

      const button = screen.getByText('点击生成音乐')
      fireEvent.click(button)

      await waitFor(
        () => {
          expect(screen.getByText('下一步：选择视频')).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    })
  })
})
