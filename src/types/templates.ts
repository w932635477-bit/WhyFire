export type TemplateCategory =
  | 'product'     // 产品推广
  | 'funny'       // 搞笑
  | 'ip'          // IP混剪
  | 'vlog'        // 日常Vlog
  | 'festival'    // 节日主题
  | 'seasonal'    // 季节主题

export type TemplateStyle =
  | 'modern'      // 现代
  | 'retro'       // 复古
  | 'minimalist'  // 极简
  | 'dynamic'     // 动感
  | 'elegant'     // 优雅

export interface TemplateField {
  key: string
  type: 'text' | 'image' | 'video' | 'color' | 'music'
  label: string
  placeholder?: string
  required: boolean
  defaultValue?: string
  validation?: {
    minLength?: number
    maxLength?: number
    fileTypes?: string[]
    maxSize?: number
  }
}

export interface VideoTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  style: TemplateStyle
  thumbnailUrl: string      // 缩略图
  previewVideoUrl: string   // 预览视频
  templateFileUrl: string   // 模板文件（AE工程/PR工程等）

  // 配置
  duration: number          // 默认时长（秒）
  aspectRatio: '16:9' | '9:16' | '1:1'

  // 自定义点
  customizableFields: TemplateField[]

  // 音频
  backgroundMusicUrl?: string
  musicStyle?: string

  // 统计
  useCount: number          // 使用次数
  rating: number            // 评分 (1-5)
  ratingCount: number       // 评分人数

  // 状态
  premium: boolean          // 是否为付费模板
  price?: number            // 价格（积分）
  active: boolean
  sortOrder: number

  createdAt: string
  updatedAt: string
}

export interface UserTemplateUsage {
  id: string
  userId: string
  templateId: string
  projectId: string         // 关联的创作项目
  customizedFields: Record<string, unknown>
  createdAt: string
}

export interface TemplateRating {
  id: string
  userId: string
  templateId: string
  rating: number             // 1-5
  review?: string
  createdAt: string
}

// API 请求/响应类型
export interface CreateTemplateRequest {
  name: string
  description: string
  category: TemplateCategory
  style: TemplateStyle
  thumbnailUrl: string
  previewVideoUrl?: string
  templateFileUrl?: string
  duration: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  customizableFields: TemplateField[]
  backgroundMusicUrl?: string
  musicStyle?: string
  premium?: boolean
  price?: number
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  active?: boolean
  sortOrder?: number
}

export interface TemplateListResponse {
  templates: VideoTemplate[]
  total: number
  page: number
  pageSize: number
}

export interface TemplateFilter {
  category?: TemplateCategory
  style?: TemplateStyle
  premium?: boolean
  active?: boolean
  search?: string
  sortBy?: 'popular' | 'rating' | 'newest' | 'oldest'
}

// 统计相关类型
export interface TemplateStats {
  totalTemplates: number
  categoryBreakdown: Record<TemplateCategory, number>
  styleBreakdown: Record<TemplateStyle, number>
  avgRating: number
  totalUsage: number
  premiumCount: number
  freeCount: number
}
