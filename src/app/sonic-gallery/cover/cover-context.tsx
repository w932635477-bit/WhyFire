'use client'

import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { DialectCode } from '@/types/dialect'

// 方言列表
export const COVER_DIALECTS = [
  { id: 'original' as DialectCode, name: '原声', region: '普通话' },
  { id: 'cantonese' as DialectCode, name: '粤语', region: '广东' },
  { id: 'sichuan' as DialectCode, name: '四川话', region: '川渝' },
  { id: 'dongbei' as DialectCode, name: '东北话', region: '东北' },
  { id: 'shaanxi' as DialectCode, name: '陕西话', region: '秦腔' },
  { id: 'wu' as DialectCode, name: '上海话', region: '吴语' },
  { id: 'minnan' as DialectCode, name: '闽南语', region: '福建' },
  { id: 'tianjin' as DialectCode, name: '天津话', region: '津门' },
  { id: 'nanjing' as DialectCode, name: '南京话', region: '金陵' },
]

// 翻唱流程状态
export interface CoverState {
  // Step 1: 上传原唱
  song: {
    file: File | null
    url: string | null         // OSS URL 或外链
    fileName: string
    uploadStatus: 'idle' | 'uploading' | 'completed' | 'failed'
    uploadProgress: number
    error: string | null
  }

  // Step 2: 选方言 + 歌词
  dialect: {
    selected: DialectCode
  }
  lyrics: {
    mode: 'original' | 'custom' | 'ai-generate'
    customLyrics: string
    brandMessage: string
    generatedLyrics: string
    isGenerating: boolean
  }
  vocalGender: 'm' | 'f'

  // Step 3: 生成结果
  result: {
    taskId: string | null
    sunoTaskId: string | null
    audioId: string | null
    audioUrl: string | null
    duration: number | null
    lyrics: string | null
    status: 'idle' | 'generating' | 'completed' | 'failed'
    progress: number
    progressMessage: string
    error: string | null
    // MV
    mvTaskId: string | null
    mvVideoUrl: string | null
    mvStatus: 'idle' | 'generating' | 'completed' | 'failed'
    mvProgress: number
    // KTV 歌词视频
    ktvStatus: 'idle' | 'fetching-lyrics' | 'generating' | 'completed' | 'failed'
    ktvProgress: number
    ktvVideoUrl: string | null
    ktvMessage: string
  }

  // 当前步骤
  currentStep: number
}

type CoverAction =
  | { type: 'SET_SONG_FILE'; file: File; fileName: string }
  | { type: 'SET_SONG_URL'; url: string }
  | { type: 'SET_UPLOAD_STATUS'; status: CoverState['song']['uploadStatus']; progress?: number; error?: string }
  | { type: 'SET_DIALECT'; dialect: DialectCode }
  | { type: 'SET_LYRICS_MODE'; mode: CoverState['lyrics']['mode'] }
  | { type: 'SET_CUSTOM_LYRICS'; lyrics: string }
  | { type: 'SET_BRAND_MESSAGE'; message: string }
  | { type: 'SET_GENERATED_LYRICS'; lyrics: string }
  | { type: 'SET_LYRICS_GENERATING'; isGenerating: boolean }
  | { type: 'SET_VOCAL_GENDER'; gender: 'm' | 'f' }
  | { type: 'SET_RESULT'; result: Partial<CoverState['result']> }
  | { type: 'SET_MV_RESULT'; result: Partial<Pick<CoverState['result'], 'mvTaskId' | 'mvVideoUrl' | 'mvStatus' | 'mvProgress'>> }
  | { type: 'SET_KTV'; payload: Partial<Pick<CoverState['result'], 'ktvStatus' | 'ktvProgress' | 'ktvVideoUrl' | 'ktvMessage'>> }
  | { type: 'GO_TO_STEP'; step: number }
  | { type: 'RESET' }

const initialState: CoverState = {
  song: {
    file: null,
    url: null,
    fileName: '',
    uploadStatus: 'idle',
    uploadProgress: 0,
    error: null,
  },
  dialect: {
    selected: 'sichuan',
  },
  lyrics: {
    mode: 'original',
    customLyrics: '',
    brandMessage: '',
    generatedLyrics: '',
    isGenerating: false,
  },
  vocalGender: 'm',
  result: {
    taskId: null,
    sunoTaskId: null,
    audioId: null,
    audioUrl: null,
    duration: null,
    lyrics: null,
    status: 'idle',
    progress: 0,
    progressMessage: '',
    error: null,
    mvTaskId: null,
    mvVideoUrl: null,
    mvStatus: 'idle',
    mvProgress: 0,
    // KTV
    ktvStatus: 'idle',
    ktvProgress: 0,
    ktvVideoUrl: null,
    ktvMessage: '',
  },
  currentStep: 1,
}

function coverReducer(state: CoverState, action: CoverAction): CoverState {
  switch (action.type) {
    case 'SET_SONG_FILE':
      return { ...state, song: { ...state.song, file: action.file, fileName: action.fileName } }
    case 'SET_SONG_URL':
      return { ...state, song: { ...state.song, url: action.url } }
    case 'SET_UPLOAD_STATUS':
      return {
        ...state,
        song: {
          ...state.song,
          uploadStatus: action.status,
          uploadProgress: action.progress ?? state.song.uploadProgress,
          error: action.error ?? null,
        },
      }
    case 'SET_DIALECT':
      return { ...state, dialect: { selected: action.dialect } }
    case 'SET_LYRICS_MODE':
      return { ...state, lyrics: { ...state.lyrics, mode: action.mode } }
    case 'SET_CUSTOM_LYRICS':
      return { ...state, lyrics: { ...state.lyrics, customLyrics: action.lyrics } }
    case 'SET_BRAND_MESSAGE':
      return { ...state, lyrics: { ...state.lyrics, brandMessage: action.message } }
    case 'SET_GENERATED_LYRICS':
      return { ...state, lyrics: { ...state.lyrics, generatedLyrics: action.lyrics } }
    case 'SET_LYRICS_GENERATING':
      return { ...state, lyrics: { ...state.lyrics, isGenerating: action.isGenerating } }
    case 'SET_VOCAL_GENDER':
      return { ...state, vocalGender: action.gender }
    case 'SET_RESULT':
      return { ...state, result: { ...state.result, ...action.result } }
    case 'SET_MV_RESULT':
      return { ...state, result: { ...state.result, ...action.result } }
    case 'SET_KTV':
      return {
        ...state,
        result: {
          ...state.result,
          ktvStatus: action.payload.ktvStatus ?? state.result.ktvStatus,
          ktvProgress: action.payload.ktvProgress ?? state.result.ktvProgress,
          ktvVideoUrl: action.payload.ktvVideoUrl ?? state.result.ktvVideoUrl,
          ktvMessage: action.payload.ktvMessage ?? state.result.ktvMessage,
        },
      }
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.step }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

interface CoverContextValue {
  state: CoverState
  dispatch: React.Dispatch<CoverAction>
  goToStep: (step: number) => void
}

const CoverContext = createContext<CoverContextValue | null>(null)

export function CoverProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(coverReducer, initialState)

  const goToStep = (step: number) => {
    dispatch({ type: 'GO_TO_STEP', step })
  }

  return (
    <CoverContext.Provider value={{ state, dispatch, goToStep }}>
      {children}
    </CoverContext.Provider>
  )
}

export function useCoverContext() {
  const ctx = useContext(CoverContext)
  if (!ctx) throw new Error('useCoverContext must be used within CoverProvider')
  return ctx
}
