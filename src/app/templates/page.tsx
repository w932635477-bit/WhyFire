'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, Clock, Users, Sparkles } from 'lucide-react'
import { TemplateCard } from '@/components/templates/template-card'
import { TemplatePreview } from '@/components/templates/template-preview'
import type { VideoTemplate, TemplateCategory } from '@/types/templates'

const CATEGORIES: { id: TemplateCategory | 'all'; name: string }[] = [
  { id: 'all', name: '全部' },
  { id: 'product', name: '产品推广' },
  { id: 'funny', name: '搞笑段子' },
  { id: 'ip', name: 'IP混剪' },
  { id: 'vlog', name: 'Vlog' },
  { id: 'festival', name: '节日主题' },
  { id: 'seasonal', name: '季节风格' },
]

const MOCK_TEMPLATES: VideoTemplate[] = [
  { id: '1', name: '产品展示 - 现代简约', description: '简洁现代的产品展示模板，流畅转场和动态文字动画', category: 'product', style: 'modern', thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=225&fit=crop', previewVideoUrl: '', templateFileUrl: '', duration: 30, aspectRatio: '16:9', customizableFields: [], useCount: 1234, rating: 4.8, ratingCount: 156, premium: false, active: true, sortOrder: 1, createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '2', name: '搞笑段子模板', description: '适合搞笑瞬间和喜剧短片，内置音效和节奏', category: 'funny', style: 'dynamic', thumbnailUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&h=225&fit=crop', previewVideoUrl: '', templateFileUrl: '', duration: 15, aspectRatio: '9:16', customizableFields: [], useCount: 5678, rating: 4.9, ratingCount: 423, premium: false, active: true, sortOrder: 2, createdAt: '2024-01-10', updatedAt: '2024-01-10' },
  { id: '3', name: '电影角色混剪', description: '创建史诗级IP混剪视频，电影级转场和宏大音乐', category: 'ip', style: 'elegant', thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=225&fit=crop', previewVideoUrl: '', templateFileUrl: '', duration: 45, aspectRatio: '16:9', customizableFields: [], useCount: 892, rating: 4.7, ratingCount: 67, premium: true, price: 100, active: true, sortOrder: 3, createdAt: '2024-01-08', updatedAt: '2024-01-08' },
  { id: '4', name: '日常Vlog - 极简', description: '简洁的Vlog模板，极简设计，适合生活日常内容', category: 'vlog', style: 'minimalist', thumbnailUrl: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=225&fit=crop', previewVideoUrl: '', templateFileUrl: '', duration: 60, aspectRatio: '16:9', customizableFields: [], useCount: 3456, rating: 4.6, ratingCount: 234, premium: false, active: true, sortOrder: 4, createdAt: '2024-01-05', updatedAt: '2024-01-05' },
  { id: '5', name: '春日氛围', description: '清新多彩的春季主题模板，绽放转场效果', category: 'seasonal', style: 'modern', thumbnailUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=225&fit=crop', previewVideoUrl: '', templateFileUrl: '', duration: 30, aspectRatio: '1:1', customizableFields: [], useCount: 2134, rating: 4.5, ratingCount: 189, premium: false, active: true, sortOrder: 5, createdAt: '2024-01-03', updatedAt: '2024-01-03' },
  { id: '6', name: '新年庆典', description: '节日模板，烟花特效和庆祝动画', category: 'festival', style: 'dynamic', thumbnailUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400&h=225&fit=crop', previewVideoUrl: '', templateFileUrl: '', duration: 20, aspectRatio: '9:16', customizableFields: [], useCount: 9876, rating: 4.9, ratingCount: 567, premium: true, price: 150, active: true, sortOrder: 6, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '7', name: '复古产品广告', description: '复古风格产品广告，怀旧滤镜和经典排版', category: 'product', style: 'retro', thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=225&fit=crop', previewVideoUrl: '', templateFileUrl: '', duration: 25, aspectRatio: '1:1', customizableFields: [], useCount: 756, rating: 4.4, ratingCount: 45, premium: false, active: true, sortOrder: 7, createdAt: '2023-12-28', updatedAt: '2023-12-28' },
  { id: '8', name: '旅行Vlog - 动感', description: '高能量旅行Vlog模板，快节奏剪辑和冒险氛围', category: 'vlog', style: 'dynamic', thumbnailUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=225&fit=crop', previewVideoUrl: '', templateFileUrl: '', duration: 45, aspectRatio: '16:9', customizableFields: [], useCount: 4532, rating: 4.7, ratingCount: 312, premium: true, price: 80, active: true, sortOrder: 8, createdAt: '2023-12-25', updatedAt: '2023-12-25' },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<VideoTemplate | null>(null)

  useEffect(() => { fetchTemplates() }, [selectedCategory])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      let filtered = [...MOCK_TEMPLATES]
      if (selectedCategory !== 'all') filtered = filtered.filter((t) => t.category === selectedCategory)
      filtered.sort((a, b) => b.useCount - a.useCount)
      setTemplates(filtered)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates
    const query = searchQuery.toLowerCase()
    return templates.filter((t) => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query))
  }, [templates, searchQuery])

  const handleUseTemplate = (template: VideoTemplate) => router.push(`/create?template=${template.id}`)

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-semibold mb-2">
              <span className="gradient-text">模板库</span>
            </h1>
            <p className="text-gray-500">选择一个模板开始创作你的 AI Rap 视频</p>
          </motion.div>

          {/* Search - Suno style */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Category chips - Suno horizontal scroll */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid - Suno style 4-column */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-white/5 rounded-lg mb-3" />
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">没有找到模板</p>
            <p className="text-gray-600 text-sm mt-2">尝试调整搜索条件</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="group cursor-pointer"
                  onClick={() => handleUseTemplate(template)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-white/5">
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    {/* Premium badge */}
                    {template.premium && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-gradient-to-r from-purple-500 to-green-500 text-xs font-medium text-white">
                        PRO
                      </div>
                    )}
                    {/* Duration tag - Suno style */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-xs text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {template.duration}s
                    </div>
                  </div>
                  {/* Info */}
                  <h3 className="text-sm font-medium text-white truncate group-hover:text-purple-400 transition-colors mb-1">
                    {template.name}
                  </h3>
                  {/* Stats - Suno style */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {template.useCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      ★ {template.rating}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Stats */}
        {!loading && filteredTemplates.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            显示 {filteredTemplates.length} 个模板
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <TemplatePreview template={previewTemplate} onClose={() => setPreviewTemplate(null)} onUse={() => handleUseTemplate(previewTemplate)} />
        )}
      </AnimatePresence>
    </main>
  )
}
