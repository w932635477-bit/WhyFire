import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SceneType, DialectType } from '@/types'
import type { MiniMaxMusicStyle } from '@/lib/minimax/types'
import type { BeatAnalysisResult } from '@/lib/audio/types'

export type StepType = 'scene' | 'dialect' | 'lyrics' | 'music' | 'video'

interface ProductInfo {
  name: string
  sellingPoints: string[]
}

interface MusicState {
  taskId: string | null
  audioUrl: string | null
  status: 'idle' | 'generating' | 'polling' | 'completed' | 'failed'
  error: string | null
}

interface VideoCreationState {
  // 当前步骤
  currentStep: StepType

  // 场景和方言选择
  scene: SceneType | null
  dialect: DialectType

  // 产品信息（用于歌词生成）
  productInfo: ProductInfo

  // 歌词
  lyrics: string | null

  // 任务 ID（用于跟踪生成状态）
  lyricsId: string | null

  // 音乐状态
  music: MusicState

  // 音乐风格
  musicStyle: MiniMaxMusicStyle

  // 新增：节拍信息
  beatInfo: BeatAnalysisResult | null
  isAnalyzingBeat: boolean

  // Actions
  setStep: (step: StepType) => void
  setScene: (scene: SceneType | null) => void
  setDialect: (dialect: DialectType) => void
  setProductInfo: (info: ProductInfo) => void
  setLyrics: (lyrics: string | null) => void
  setLyricsId: (id: string | null) => void
  setMusicTaskId: (id: string | null) => void
  setMusicAudioUrl: (url: string | null) => void
  setMusicStatus: (status: MusicState['status']) => void
  setMusicError: (error: string | null) => void
  setMusicStyle: (style: MiniMaxMusicStyle) => void
  // 新增：节拍分析方法
  setBeatInfo: (beatInfo: BeatAnalysisResult | null) => void
  setIsAnalyzingBeat: (isAnalyzing: boolean) => void
  reset: () => void
  nextStep: () => void
  prevStep: () => void
}

// 步骤顺序
const STEP_ORDER: StepType[] = ['scene', 'dialect', 'lyrics', 'music', 'video']

const initialState = {
  currentStep: 'scene' as StepType,
  scene: null,
  dialect: 'mandarin' as DialectType,
  productInfo: {
    name: '',
    sellingPoints: []
  },
  lyrics: null,
  lyricsId: null,
  music: {
    taskId: null,
    audioUrl: null,
    status: 'idle' as MusicState['status'],
    error: null,
  },
  musicStyle: 'rap' as MiniMaxMusicStyle,
  // 新增
  beatInfo: null,
  isAnalyzingBeat: false,
}

export const useVideoCreationStore = create<VideoCreationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setScene: (scene) => set({ scene }),

      setDialect: (dialect) => set({ dialect }),

      setProductInfo: (productInfo) => set({ productInfo }),

      setLyrics: (lyrics) => set({ lyrics }),

      setLyricsId: (lyricsId) => set({ lyricsId }),

      setMusicTaskId: (taskId) =>
        set((state) => ({
          music: { ...state.music, taskId },
        })),

      setMusicAudioUrl: (audioUrl) =>
        set((state) => ({
          music: { ...state.music, audioUrl },
        })),

      setMusicStatus: (status) =>
        set((state) => ({
          music: { ...state.music, status },
        })),

      setMusicError: (error) =>
        set((state) => ({
          music: { ...state.music, error },
        })),

      setMusicStyle: (musicStyle) => set({ musicStyle }),

      // 新增
      setBeatInfo: (beatInfo) => set({ beatInfo }),
      setIsAnalyzingBeat: (isAnalyzingBeat) => set({ isAnalyzingBeat }),

      reset: () => set(initialState),

      nextStep: () => {
        const { currentStep } = get()
        const currentIndex = STEP_ORDER.indexOf(currentStep)
        if (currentIndex < STEP_ORDER.length - 1) {
          set({ currentStep: STEP_ORDER[currentIndex + 1] })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        const currentIndex = STEP_ORDER.indexOf(currentStep)
        if (currentIndex > 0) {
          set({ currentStep: STEP_ORDER[currentIndex - 1] })
        }
      },
    }),
    {
      name: 'video-creation-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        scene: state.scene,
        dialect: state.dialect,
        productInfo: state.productInfo,
        lyrics: state.lyrics,
        musicStyle: state.musicStyle,
      }),
    }
  )
)
