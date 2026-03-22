/**
 * WhyFire - AI Rap 视频生成器
 * 类型定义
 */

// Video types
export * from './video'

// 场景类型
export type SceneType = 'product' | 'funny' | 'ip' | 'vlog';

// 语言/方言类型 - 从 dialect.ts 导入完整定义
export type { DialectCode, DialectConfig } from './dialect'
export { DIALECT_CONFIGS, DIALECT_LABELS, DIALECT_VOICE_MAP, getEnabledDialects, getDialectConfig } from './dialect'
// 兼容旧的 DialectType 名称
export type { DialectCode as DialectType } from './dialect'

// 场景配置
export interface SceneConfig {
  id: SceneType;
  name: string;
  icon: string;
  description: string;
  inputFields: InputField[];
  musicStyle: string;
  lyricsStyle: string;
}

// 输入字段配置
export interface InputField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'array';
  placeholder: string;
  required: boolean;
  maxLength?: number;
}

// 产品推广场景输入
export interface ProductInputs {
  productName: string;
  sellingPoints: string[];
  price?: string;
  targetAudience?: string;
}

// 搞笑场景输入
export interface FunnyInputs {
  theme: string;
  keywords?: string[];
  tone?: 'sarcastic' | 'absurd' | 'relatable';
}

// IP混剪场景输入
export interface IPInputs {
  ipName: string;
  coreElements: string[];
  mood?: 'cool' | 'emotional' | 'energetic';
}

// 日常Vlog场景输入
export interface VlogInputs {
  activities: string[];
  mood?: 'chill' | 'energetic' | 'cozy';
  location?: string;
}

// 所有场景输入的联合类型
export type SceneInputs = ProductInputs | FunnyInputs | IPInputs | VlogInputs;

// 歌词生成请求
export interface LyricsRequest {
  scene: SceneType;
  inputs: SceneInputs;
}

// 歌词生成响应
export interface LyricsResponse {
  lyrics: string;
  style: string;
  duration: number;
}

// 音乐生成请求
export interface MusicRequest {
  lyrics: string;
  style: string;
  duration?: number;
}

// 音乐生成响应
export interface MusicResponse {
  audioUrl: string;
  duration: number;
}

// 视频模板
export interface VideoTemplate {
  id: string;
  name: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  sceneTypes: SceneType[];
}

// 创作状态
export interface CreationState {
  currentStep: number;
  scene: SceneType | null;
  inputs: SceneInputs | null;
  lyrics: string | null;
  musicUrl: string | null;
  videoFile: File | null;
  selectedTemplate: VideoTemplate | null;
  outputUrl: string | null;
}

// 创作步骤
export const CREATION_STEPS = [
  { id: 1, name: '选择场景', key: 'scene' },
  { id: 2, name: '输入信息', key: 'inputs' },
  { id: 3, name: '生成歌词', key: 'lyrics' },
  { id: 4, name: '生成音乐', key: 'music' },
  { id: 5, name: '选择视频', key: 'video' },
  { id: 6, name: '合成成品', key: 'output' },
] as const;

// 场景配置列表
export const SCENE_CONFIGS: SceneConfig[] = [
  {
    id: 'product',
    name: '产品推广',
    icon: '🛒',
    description: '电商带货、产品宣传，洗脑推销',
    inputFields: [
      { key: 'productName', label: '产品名称', type: 'text', placeholder: '例如：燕之屋鲜炖燕窝', required: true },
      { key: 'sellingPoints', label: '核心卖点', type: 'array', placeholder: '例如：新鲜、营养、方便', required: true },
      { key: 'price', label: '价格', type: 'text', placeholder: '例如：99元3瓶', required: false },
      { key: 'targetAudience', label: '目标人群', type: 'text', placeholder: '例如：25-35岁女性', required: false },
    ],
    musicStyle: 'rap, commercial, upbeat, catchy',
    lyricsStyle: '推销感、洗脑、突出卖点、押韵',
  },
  {
    id: 'funny',
    name: '搞笑洗脑',
    icon: '😂',
    description: '魔性搞笑、娱乐爆款',
    inputFields: [
      { key: 'theme', label: '搞笑主题', type: 'text', placeholder: '例如：打工人的日常', required: true },
      { key: 'keywords', label: '关键词', type: 'array', placeholder: '例如：摸鱼、内卷、加班', required: false },
    ],
    musicStyle: 'rap, funny, quirky, viral',
    lyricsStyle: '搞笑、魔性、网络梗、押韵、接地气',
  },
  {
    id: 'ip',
    name: 'IP混剪',
    icon: '🎬',
    description: '品牌推广、IP宣传',
    inputFields: [
      { key: 'ipName', label: 'IP名称', type: 'text', placeholder: '例如：原神', required: true },
      { key: 'coreElements', label: '核心元素', type: 'array', placeholder: '例如：角色、场景、剧情', required: true },
      { key: 'mood', label: '风格', type: 'text', placeholder: '例如：酷炫、热血、温情', required: false },
    ],
    musicStyle: 'rap, epic, energetic',
    lyricsStyle: '品牌调性、情感共鸣、粉丝向',
  },
  {
    id: 'vlog',
    name: '日常Vlog',
    icon: '📷',
    description: '生活记录、个性表达',
    inputFields: [
      { key: 'activities', label: '今天做了什么', type: 'array', placeholder: '例如：起床、吃饭、逛街', required: true },
      { key: 'location', label: '地点', type: 'text', placeholder: '例如：北京三里屯', required: false },
      { key: 'mood', label: '心情', type: 'text', placeholder: '例如：开心、放松、emo', required: false },
    ],
    musicStyle: 'rap, chill, lo-fi, casual',
    lyricsStyle: '生活化、个性化、轻松、真实',
  },
];
