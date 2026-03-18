import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SceneType, DialectType } from '@/types'

export type StepType = 'scene' | 'dialect' | 'lyrics' | 'music' | 'video'

interface ProductInfo {
  name: string
  sellingPoints: string[]
}

interface VideoCreationState {
  // 当前步骤
  currentStep: StepType

  // 场景和方言选择
  scene: SceneType | null
  dialect: DialectType

  // 产品信息（用于歌词生成）
  productInfo: ProductInfo

  // 任务 ID（用于跟踪生成状态）
  lyricsId: string | null
  musicTaskId: string | null

  // Actions
  setStep: (step: StepType) => void
  setScene: (scene: SceneType | null) => void
  setDialect: (dialect: DialectType) => void
  setProductInfo: (info: ProductInfo) => void
  setLyricsId: (id: string | null) => void
  setMusicTaskId: (id: string | null) => void
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
  lyricsId: null,
  musicTaskId: null
}

export const useVideoCreationStore = create<VideoCreationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setScene: (scene) => set({ scene }),

      setDialect: (dialect) => set({ dialect }),

      setProductInfo: (productInfo) => set({ productInfo }),

      setLyricsId: (lyricsId) => set({ lyricsId }),

      setMusicTaskId: (musicTaskId) => set({ musicTaskId }),

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
      }
    }),
    {
      name: 'video-creation-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        scene: state.scene,
        dialect: state.dialect,
        productInfo: state.productInfo
      })
    }
  )
)
