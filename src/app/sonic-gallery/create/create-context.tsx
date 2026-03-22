'use client'

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'

// 方言类型
export interface Dialect {
  id: string
  name: string
  region: string
}

// Beat 类型
export interface Beat {
  id: string
  name: string
  bpm: number
  duration: string
  category: string
  audioUrl?: string
}

// 热点话题类型
export interface HotTopic {
  id: string
  name: string
  category: string
}

// 创作流程状态
export interface CreateState {
  // Step 1: 音色克隆
  voiceCloning: {
    audioFile: File | null
    audioUrl: string | null
    recordingBlob: Blob | null
    recordingDuration: number
    uploadType: 'record' | 'upload' | null
  }

  // Step 2: 方言 + Beat
  dialect: {
    selected: string
    dialects: Dialect[]
  }
  beat: {
    selected: string | null
    beats: Beat[]
    customBeatFile: File | null
  }

  // Step 3: 歌词生成
  lyrics: {
    selfDescription: string
    selectedTopics: string[]
    selectedMemes: string[]
    generatedLyrics: string
    isEdited: boolean
  }

  // Step 4: 预览参数
  preview: {
    speed: number
    pitch: number
    isPlaying: boolean
  }

  // 当前步骤
  currentStep: number
}

// 初始状态
const initialState: CreateState = {
  voiceCloning: {
    audioFile: null,
    audioUrl: null,
    recordingBlob: null,
    recordingDuration: 0,
    uploadType: null,
  },
  dialect: {
    selected: 'cantonese',
    dialects: [
      { id: 'mandarin', name: '普通话', region: '标准' },
      { id: 'cantonese', name: '粤语', region: '广东' },
      { id: 'sichuan', name: '四川话', region: '川渝' },
      { id: 'dongbei', name: '东北话', region: '东北' },
      { id: 'shandong', name: '山东话', region: '齐鲁' },
      { id: 'shanghai', name: '上海话', region: '吴语' },
      { id: 'henan', name: '河南话', region: '中原' },
      { id: 'hunan', name: '湖南话', region: '湘语' },
    ],
  },
  beat: {
    selected: null,
    beats: [],
    customBeatFile: null,
  },
  lyrics: {
    selfDescription: '',
    selectedTopics: [],
    selectedMemes: [],
    generatedLyrics: '',
    isEdited: false,
  },
  preview: {
    speed: 1.0,
    pitch: 0,
    isPlaying: false,
  },
  currentStep: 1,
}

// Action 类型
type CreateAction =
  | { type: 'SET_VOICE_FILE'; payload: { file: File | null; url: string | null } }
  | { type: 'SET_RECORDING'; payload: { blob: Blob | null; duration: number } }
  | { type: 'SET_UPLOAD_TYPE'; payload: 'record' | 'upload' | null }
  | { type: 'SET_DIALECT'; payload: string }
  | { type: 'SET_BEAT'; payload: string | null }
  | { type: 'SET_CUSTOM_BEAT'; payload: File | null }
  | { type: 'SET_SELF_DESCRIPTION'; payload: string }
  | { type: 'SET_TOPICS'; payload: string[] }
  | { type: 'SET_MEMES'; payload: string[] }
  | { type: 'SET_LYRICS'; payload: string }
  | { type: 'SET_PREVIEW_PARAMS'; payload: { speed?: number; pitch?: number } }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET' }

// Context 类型
interface CreateContextType {
  state: CreateState
  dispatch: (action: CreateAction) => void
  // 便捷方法
  setVoiceFile: (file: File | null, url: string | null) => void
  setRecording: (blob: Blob | null, duration: number) => void
  setUploadType: (type: 'record' | 'upload' | null) => void
  setDialect: (dialectId: string) => void
  setBeat: (beatId: string | null) => void
  setCustomBeat: (file: File | null) => void
  setSelfDescription: (text: string) => void
  setTopics: (topics: string[]) => void
  setMemes: (memes: string[]) => void
  setLyrics: (lyrics: string) => void
  setPreviewParams: (params: { speed?: number; pitch?: number }) => void
  setPlaying: (playing: boolean) => void
  goToStep: (step: number) => void
  reset: () => void
}

// 创建 Context
const CreateContext = createContext<CreateContextType | null>(null)

// Reducer
function createReducer(state: CreateState, action: CreateAction): CreateState {
  switch (action.type) {
    case 'SET_VOICE_FILE':
      return {
        ...state,
        voiceCloning: {
          ...state.voiceCloning,
          audioFile: action.payload.file,
          audioUrl: action.payload.url,
        },
      }
    case 'SET_RECORDING':
      return {
        ...state,
        voiceCloning: {
          ...state.voiceCloning,
          recordingBlob: action.payload.blob,
          recordingDuration: action.payload.duration,
        },
      }
    case 'SET_UPLOAD_TYPE':
      return {
        ...state,
        voiceCloning: {
          ...state.voiceCloning,
          uploadType: action.payload,
        },
      }
    case 'SET_DIALECT':
      return {
        ...state,
        dialect: {
          ...state.dialect,
          selected: action.payload,
        },
      }
    case 'SET_BEAT':
      return {
        ...state,
        beat: {
          ...state.beat,
          selected: action.payload,
        },
      }
    case 'SET_CUSTOM_BEAT':
      return {
        ...state,
        beat: {
          ...state.beat,
          customBeatFile: action.payload,
        },
      }
    case 'SET_SELF_DESCRIPTION':
      return {
        ...state,
        lyrics: {
          ...state.lyrics,
          selfDescription: action.payload,
        },
      }
    case 'SET_TOPICS':
      return {
        ...state,
        lyrics: {
          ...state.lyrics,
          selectedTopics: action.payload,
        },
      }
    case 'SET_MEMES':
      return {
        ...state,
        lyrics: {
          ...state.lyrics,
          selectedMemes: action.payload,
        },
      }
    case 'SET_LYRICS':
      return {
        ...state,
        lyrics: {
          ...state.lyrics,
          generatedLyrics: action.payload,
          isEdited: true,
        },
      }
    case 'SET_PREVIEW_PARAMS':
      return {
        ...state,
        preview: {
          ...state.preview,
          ...action.payload,
        },
      }
    case 'SET_PLAYING':
      return {
        ...state,
        preview: {
          ...state.preview,
          isPlaying: action.payload,
        },
      }
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Provider 组件
export function CreateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(createReducer, initialState)

  // 便捷方法
  const setVoiceFile = useCallback((file: File | null, url: string | null) => {
    dispatch({ type: 'SET_VOICE_FILE', payload: { file, url } })
  }, [])

  const setRecording = useCallback((blob: Blob | null, duration: number) => {
    dispatch({ type: 'SET_RECORDING', payload: { blob, duration } })
  }, [])

  const setUploadType = useCallback((type: 'record' | 'upload' | null) => {
    dispatch({ type: 'SET_UPLOAD_TYPE', payload: type })
  }, [])

  const setDialect = useCallback((dialectId: string) => {
    dispatch({ type: 'SET_DIALECT', payload: dialectId })
  }, [])

  const setBeat = useCallback((beatId: string | null) => {
    dispatch({ type: 'SET_BEAT', payload: beatId })
  }, [])

  const setCustomBeat = useCallback((file: File | null) => {
    dispatch({ type: 'SET_CUSTOM_BEAT', payload: file })
  }, [])

  const setSelfDescription = useCallback((text: string) => {
    dispatch({ type: 'SET_SELF_DESCRIPTION', payload: text })
  }, [])

  const setTopics = useCallback((topics: string[]) => {
    dispatch({ type: 'SET_TOPICS', payload: topics })
  }, [])

  const setMemes = useCallback((memes: string[]) => {
    dispatch({ type: 'SET_MEMES', payload: memes })
  }, [])

  const setLyrics = useCallback((lyrics: string) => {
    dispatch({ type: 'SET_LYRICS', payload: lyrics })
  }, [])

  const setPreviewParams = useCallback((params: { speed?: number; pitch?: number }) => {
    dispatch({ type: 'SET_PREVIEW_PARAMS', payload: params })
  }, [])

  const setPlaying = useCallback((playing: boolean) => {
    dispatch({ type: 'SET_PLAYING', payload: playing })
  }, [])

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const value: CreateContextType = {
    state,
    dispatch,
    setVoiceFile,
    setRecording,
    setUploadType,
    setDialect,
    setBeat,
    setCustomBeat,
    setSelfDescription,
    setTopics,
    setMemes,
    setLyrics,
    setPreviewParams,
    setPlaying,
    goToStep,
    reset,
  }

  return (
    <CreateContext.Provider value={value}>
      {children}
    </CreateContext.Provider>
  )
}

// Hook
export function useCreateContext() {
  const context = useContext(CreateContext)
  if (!context) {
    throw new Error('useCreateContext must be used within a CreateProvider')
  }
  return context
}
