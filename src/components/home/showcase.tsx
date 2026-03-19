'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Play, ExternalLink } from 'lucide-react'

const showcaseVideos = [
  {
    id: '1',
    title: '产品推广 - 智能手表',
    category: 'Product',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=225&fit=crop',
    plays: '12.5K',
    creator: '创意工作室',
  },
  {
    id: '2',
    title: '搞笑段子 - 办公室日常',
    category: 'Funny',
    thumbnail: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&h=225&fit=crop',
    plays: '45.2K',
    creator: '笑点多',
  },
  {
    id: '3',
    title: 'IP混剪 - 超英集结',
    category: 'IP Mix',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=225&fit=crop',
    plays: '89.1K',
    creator: '影视达人',
  },
  {
    id: '4',
    title: '旅行Vlog - 云南之行',
    category: 'Vlog',
    thumbnail: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=225&fit=crop',
    plays: '23.8K',
    creator: '背包客',
  },
]

const categories = [
  { id: 'all', name: '全部', active: true },
  { id: 'product', name: '产品推广' },
  { id: 'funny', name: '搞笑段子' },
  { id: 'ip', name: 'IP混剪' },
  { id: 'vlog', name: 'Vlog' },
]

export function Showcase() {
  return (
    <section className="relative py-20 px-6 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">精选作品</h2>
            <p className="text-gray-500 text-sm">看看创作者们用 WhyFire 做了什么</p>
          </div>
          <Link
            href="/templates"
            className="text-sm text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1 font-medium"
          >
            查看全部 <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category chips - brutalist style */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                cat.active
                  ? 'bg-white text-black'
                  : 'bg-transparent text-gray-400 border-2 border-white/30 hover:border-white/60 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Video grid - brutalist style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {showcaseVideos.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden mb-2 border-2 border-white/20 group-hover:border-[#8B5CF6]/50 transition-colors">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 bg-white flex items-center justify-center">
                    <Play className="w-5 h-5 text-black fill-black" />
                  </div>
                </div>
                {/* Category tag - brutalist style */}
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black text-xs text-white font-medium">
                  {video.category}
                </div>
              </div>
              {/* Info */}
              <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#8B5CF6] transition-colors">
                {video.title}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">{video.creator}</span>
                <span className="text-xs text-gray-600">{video.plays} 播放</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
