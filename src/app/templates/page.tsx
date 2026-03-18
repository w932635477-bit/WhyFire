'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Grid, List, Loader2 } from 'lucide-react'
import { TemplateCard } from '@/components/templates/template-card'
import { TemplatePreview } from '@/components/templates/template-preview'
import type { VideoTemplate, TemplateCategory } from '@/types/templates'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES: { id: TemplateCategory | 'all'; name: string; icon: string }[] = [
  { id: 'all', name: 'All', icon: '🎬' },
  { id: 'product', name: 'Product', icon: '📦' },
  { id: 'funny', name: 'Funny', icon: '😂' },
  { id: 'ip', name: 'IP Mix', icon: '🎭' },
  { id: 'vlog', name: 'Vlog', icon: '📹' },
  { id: 'festival', name: 'Festival', icon: '🎉' },
  { id: 'seasonal', name: 'Seasonal', icon: '🌸' },
]

// Mock data for templates
const MOCK_TEMPLATES: VideoTemplate[] = [
  {
    id: '1',
    name: 'Product Showcase - Modern',
    description: 'Clean and modern product showcase template with smooth transitions and dynamic text animations',
    category: 'product',
    style: 'modern',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=450&fit=crop',
    previewVideoUrl: '',
    templateFileUrl: '',
    duration: 30,
    aspectRatio: '16:9',
    customizableFields: [
      { key: 'productName', type: 'text', label: 'Product Name', required: true },
      { key: 'productImage', type: 'image', label: 'Product Image', required: true },
      { key: 'tagline', type: 'text', label: 'Tagline', required: false },
      { key: 'brandColor', type: 'color', label: 'Brand Color', required: false },
    ],
    useCount: 1234,
    rating: 4.8,
    ratingCount: 156,
    premium: false,
    active: true,
    sortOrder: 1,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Comedy Skit Template',
    description: 'Perfect for funny moments and comedy sketches with built-in sound effects and timing',
    category: 'funny',
    style: 'dynamic',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&h=450&fit=crop',
    previewVideoUrl: '',
    templateFileUrl: '',
    duration: 15,
    aspectRatio: '9:16',
    customizableFields: [
      { key: 'mainVideo', type: 'video', label: 'Main Video', required: true },
      { key: 'soundEffect', type: 'music', label: 'Sound Effect', required: false },
    ],
    useCount: 5678,
    rating: 4.9,
    ratingCount: 423,
    premium: false,
    active: true,
    sortOrder: 2,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'Movie Character Mashup',
    description: 'Create epic IP crossover videos with cinematic transitions and epic music',
    category: 'ip',
    style: 'elegant',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop',
    previewVideoUrl: '',
    templateFileUrl: '',
    duration: 45,
    aspectRatio: '16:9',
    customizableFields: [
      { key: 'clips', type: 'video', label: 'Video Clips', required: true },
      { key: 'backgroundMusic', type: 'music', label: 'Background Music', required: true },
      { key: 'title', type: 'text', label: 'Title', required: false },
    ],
    useCount: 892,
    rating: 4.7,
    ratingCount: 67,
    premium: true,
    price: 100,
    active: true,
    sortOrder: 3,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-08',
  },
  {
    id: '4',
    name: 'Daily Vlog - Minimal',
    description: 'Clean vlog template with minimal design, perfect for lifestyle and daily content',
    category: 'vlog',
    style: 'minimalist',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=800&h=450&fit=crop',
    previewVideoUrl: '',
    templateFileUrl: '',
    duration: 60,
    aspectRatio: '16:9',
    customizableFields: [
      { key: 'clips', type: 'video', label: 'Video Clips', required: true },
      { key: 'captions', type: 'text', label: 'Captions', required: false },
    ],
    useCount: 3456,
    rating: 4.6,
    ratingCount: 234,
    premium: false,
    active: true,
    sortOrder: 4,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-05',
  },
  {
    id: '5',
    name: 'Spring Vibes',
    description: 'Fresh and colorful spring-themed template with blooming transitions',
    category: 'seasonal',
    style: 'modern',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=450&fit=crop',
    previewVideoUrl: '',
    templateFileUrl: '',
    duration: 30,
    aspectRatio: '1:1',
    customizableFields: [
      { key: 'photos', type: 'image', label: 'Photos', required: true },
      { key: 'message', type: 'text', label: 'Message', required: false },
    ],
    useCount: 2134,
    rating: 4.5,
    ratingCount: 189,
    premium: false,
    active: true,
    sortOrder: 5,
    createdAt: '2024-01-03',
    updatedAt: '2024-01-03',
  },
  {
    id: '6',
    name: 'New Year Celebration',
    description: 'Festive template with fireworks effects and celebration animations',
    category: 'festival',
    style: 'dynamic',
    thumbnailUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&h=450&fit=crop',
    previewVideoUrl: '',
    templateFileUrl: '',
    duration: 20,
    aspectRatio: '9:16',
    customizableFields: [
      { key: 'message', type: 'text', label: 'New Year Message', required: true },
      { key: 'logo', type: 'image', label: 'Logo', required: false },
    ],
    useCount: 9876,
    rating: 4.9,
    ratingCount: 567,
    premium: true,
    price: 150,
    active: true,
    sortOrder: 6,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '7',
    name: 'Retro Product Ad',
    description: 'Vintage-style product advertisement with retro filters and classic typography',
    category: 'product',
    style: 'retro',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=450&fit=crop',
    previewVideoUrl: '',
    templateFileUrl: '',
    duration: 25,
    aspectRatio: '1:1',
    customizableFields: [
      { key: 'productImage', type: 'image', label: 'Product Image', required: true },
      { key: 'headline', type: 'text', label: 'Headline', required: true },
      { key: 'price', type: 'text', label: 'Price', required: false },
    ],
    useCount: 756,
    rating: 4.4,
    ratingCount: 45,
    premium: false,
    active: true,
    sortOrder: 7,
    createdAt: '2023-12-28',
    updatedAt: '2023-12-28',
  },
  {
    id: '8',
    name: 'Travel Vlog - Dynamic',
    description: 'High-energy travel vlog template with fast cuts and adventure vibes',
    category: 'vlog',
    style: 'dynamic',
    thumbnailUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=450&fit=crop',
    previewVideoUrl: '',
    templateFileUrl: '',
    duration: 45,
    aspectRatio: '16:9',
    customizableFields: [
      { key: 'clips', type: 'video', label: 'Travel Clips', required: true },
      { key: 'location', type: 'text', label: 'Location Name', required: false },
      { key: 'music', type: 'music', label: 'Background Music', required: false },
    ],
    useCount: 4532,
    rating: 4.7,
    ratingCount: 312,
    premium: true,
    price: 80,
    active: true,
    sortOrder: 8,
    createdAt: '2023-12-25',
    updatedAt: '2023-12-25',
  },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewTemplate, setPreviewTemplate] = useState<VideoTemplate | null>(null)
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular')

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, sortBy])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual Supabase query
      // const supabase = createClient()
      // let query = supabase
      //   .from('templates')
      //   .select('*')
      //   .eq('active', true)
      //
      // if (selectedCategory !== 'all') {
      //   query = query.eq('category', selectedCategory)
      // }
      //
      // // Apply sorting
      // switch (sortBy) {
      //   case 'popular':
      //     query = query.order('useCount', { ascending: false })
      //     break
      //   case 'rating':
      //     query = query.order('rating', { ascending: false })
      //     break
      //   case 'newest':
      //     query = query.order('createdAt', { ascending: false })
      //     break
      // }
      //
      // const { data, error } = await query
      // if (!error && data) {
      //   setTemplates(data)
      // }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Use mock data for now
      let filteredTemplates = [...MOCK_TEMPLATES]

      if (selectedCategory !== 'all') {
        filteredTemplates = filteredTemplates.filter((t) => t.category === selectedCategory)
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          filteredTemplates.sort((a, b) => b.useCount - a.useCount)
          break
        case 'rating':
          filteredTemplates.sort((a, b) => b.rating - a.rating)
          break
        case 'newest':
          filteredTemplates.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          break
      }

      setTemplates(filteredTemplates)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates

    const query = searchQuery.toLowerCase()
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
    )
  }, [templates, searchQuery])

  const handleUseTemplate = (template: VideoTemplate) => {
    // Navigate to create page with template ID
    router.push(`/create?template=${template.id}`)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold gradient-text mb-2">Template Library</h1>
            <p className="text-muted">Choose a template to start creating your AI Rap video</p>
          </motion.div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'rating' | 'newest')}
              className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-white' : 'bg-card hover:bg-card-hover'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-white' : 'bg-card hover:bg-card-hover'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border hover:border-primary'
              }`}
            >
              <span className="mr-1">{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="aspect-video bg-card animate-pulse" />
                <div className="p-4 bg-card">
                  <div className="h-4 bg-border rounded animate-pulse mb-2" />
                  <div className="h-3 bg-border rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-lg">No templates found</p>
            <p className="text-muted/60 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <motion.div
            layout
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'flex flex-col gap-4'
            }
          >
            <AnimatePresence>
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TemplateCard
                    template={template}
                    onPreview={() => setPreviewTemplate(template)}
                    onUse={() => handleUseTemplate(template)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Stats */}
        {!loading && filteredTemplates.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted">
            Showing {filteredTemplates.length} template
            {filteredTemplates.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <TemplatePreview
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onUse={() => handleUseTemplate(previewTemplate)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
