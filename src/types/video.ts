export interface Video {
  id: string
  userId: string
  title: string
  thumbnailUrl: string
  videoUrl: string
  duration: number // 秒
  createdAt: string
  status: 'completed' | 'processing' | 'failed'
}

export interface VideoCardProps {
  video: Video
  onDelete: (id: string) => void
  onDownload: (video: Video) => void
}

export interface VideoGridProps {
  videos: Video[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onDelete: (id: string) => void
  onDownload: (video: Video) => void
}
