'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Video } from '@/types/video'
import { VideoGrid } from '@/components/my-videos/video-grid'
import { useAuthContext } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'

const ITEMS_PER_PAGE = 12

export default function MyVideosPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthContext()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Fetch videos
  const fetchVideos = useCallback(async (pageNum: number) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1)

      if (fetchError) throw fetchError

      const newVideos = data || []

      setVideos((prev) => (pageNum === 0 ? newVideos : [...prev, ...newVideos]))
      setHasMore(newVideos.length === ITEMS_PER_PAGE)
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError('加载视频失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchVideos(0)
    }
  }, [user, fetchVideos])

  // Load more
  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchVideos(nextPage)
  }

  // Delete video
  const handleDelete = async (id: string) => {
    try {
      // Delete from storage
      const video = videos.find((v) => v.id === id)
      if (video) {
        // Extract file path from URL
        const videoPath = video.videoUrl.split('/').pop()
        const thumbnailPath = video.thumbnailUrl.split('/').pop()

        if (videoPath) {
          await supabase.storage.from('videos').remove([`videos/${videoPath}`])
        }
        if (thumbnailPath) {
          await supabase.storage.from('videos').remove([`thumbnails/${thumbnailPath}`])
        }
      }

      // Delete from database
      const { error } = await supabase.from('videos').delete().eq('id', id)
      if (error) throw error

      // Update local state
      setVideos((prev) => prev.filter((v) => v.id !== id))
    } catch (err) {
      console.error('Error deleting video:', err)
      alert('删除失败，请稍后重试')
    }
  }

  // Download video
  const handleDownload = async (video: Video) => {
    try {
      const response = await fetch(video.videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${video.title}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading video:', err)
      alert('下载失败，请稍后重试')
    }
  }

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">我的作品</h1>
          <p className="text-[var(--color-muted)] mt-1">管理你创建的所有 AI Rap 视频</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Video Grid */}
        <VideoGrid
          videos={videos}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onDelete={handleDelete}
          onDownload={handleDownload}
        />
      </div>
    </div>
  )
}
