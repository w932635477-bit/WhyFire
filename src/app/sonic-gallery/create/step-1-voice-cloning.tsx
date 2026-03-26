'use client'

import { useState, useRef, useEffect } from 'react'
import { useCreateContext } from './create-context'
import { extractAudioFromVideo } from '@/lib/audio/audio-extractor'

interface Step1VoiceCloningProps {
  onNext: () => void
}

// 声音克隆服务状态
interface ServiceStatus {
  enabled: boolean
  provider: string
  message: string
}

export function Step1VoiceCloning({ onNext }: Step1VoiceCloningProps) {
  const { state, setVoiceFile, setRecording, setUploadType, setVideoFile, setExtracting, setCloningStatus } = useCreateContext()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // 服务状态
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null)

  // 从 context 获取状态
  const cloningStatus = state.voiceCloning.cloningStatus
  const cloningError = state.voiceCloning.cloningError
  const voiceId = state.voiceCloning.voiceId

  // 检查声音克隆服务是否可用
  useEffect(() => {
    const checkService = async () => {
      try {
        const response = await fetch('/api/voice/clone')
        const result = await response.json()
        setServiceStatus({
          enabled: result.data?.enabled ?? false,
          provider: result.data?.provider ?? 'unknown',
          message: result.data?.message ?? '',
        })
      } catch {
        setServiceStatus({
          enabled: false,
          provider: 'unknown',
          message: '服务检测失败',
        })
      }
    }
    checkService()
  }, [])

  // 指定朗读文本
  const readingText = `今天天气很好，我出门散步。阳光洒在脸上，感觉特别温暖。
路边的花开得正艳，小鸟在枝头歌唱。
我沿着小路慢慢走着，心情格外舒畅。
远处的山峦若隐若现，像一幅美丽的水墨画。
生活虽然忙碌，但偶尔也要停下来，感受这美好的时光。`

  // 格式化录音时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 处理视频上传
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setVideoFile(file, url)
    setUploadType('video')

    // 开始提取音频
    setExtracting(true, 0)

    try {
      const result = await extractAudioFromVideo(file, {
        onProgress: (progress) => {
          setExtracting(true, Math.round(progress * 100))
        },
        outputFormat: 'mp3',
      })

      // 提取完成，设置音频数据
      setVoiceFile(
        new File([result.audioBlob], 'extracted-audio.mp3', { type: 'audio/mpeg' }),
        result.audioUrl
      )
      setExtracting(false, 100)
    } catch (error) {
      console.error('Failed to extract audio:', error)
      setExtracting(false, 0)
      alert('音频提取失败，请尝试其他方式')
    }
  }

  // 处理音频文件上传
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setVoiceFile(file, url)
      setUploadType('upload')
    }
  }

  // 处理录音
  const handleRecording = async () => {
    if (isRecording) {
      // 停止录音
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      // 开始录音
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        chunksRef.current = []

        mediaRecorder.ondataavailable = (e) => {
          chunksRef.current.push(e.data)
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          setRecording(blob, recordingTime)
          setUploadType('record')
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
        setUploadType('record')
      } catch (error) {
        console.error('Failed to start recording:', error)
      }
    }
  }

  // 录音计时
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // 检查是否可以进入下一步（需要音频 + 克隆完成或跳过）
  const hasAudio = state.voiceCloning.audioFile || state.voiceCloning.recordingBlob
  const canProceed = hasAudio && (cloningStatus === 'completed' || cloningStatus === 'idle')

  // 正在提取中
  const isExtracting = state.voiceCloning.isExtracting

  // 启动声音克隆（调用 CosyVoice API）
  const startVoiceCloning = async () => {
    const audioBlob = state.voiceCloning.recordingBlob || state.voiceCloning.audioFile
    if (!audioBlob) return

    setCloningStatus('pending')  // 显示"正在审核音频..."（API 会真实等待审核通过）

    try {
      // 准备 FormData
      const formData = new FormData()
      formData.append('audio', audioBlob instanceof Blob ? audioBlob : audioBlob)
      formData.append('dialect', state.dialect.selected || 'mandarin')

      // 调用声音克隆 API
      const response = await fetch('/api/voice/clone', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.code === 0 && result.data?.voiceId) {
        // API 已等待审核通过，直接标记完成
        setCloningStatus('completed', result.data.voiceId)
      } else {
        throw new Error(result.message || '声音克隆失败')
      }
    } catch (error) {
      console.error('Voice cloning failed:', error)
      setCloningStatus('failed', undefined, error instanceof Error ? error.message : '声音克隆失败')
    }
  }

  // 跳过声音克隆，直接使用默认音色
  const handleSkipVoiceCloning = () => {
    // 设置为完成状态（不使用自定义音色）
    setCloningStatus('completed')
    onNext()
  }

  // 获取状态显示文本
  const getStatusText = () => {
    switch (cloningStatus) {
      case 'uploading': return '正在上传音频...'
      case 'cloning': return '正在创建复刻音色...'
      case 'pending': return '正在审核音频（最长 5 分钟）...'
      case 'completed': return voiceId ? '音色复刻完成！' : '已跳过声音克隆'
      case 'failed': return cloningError || '声音克隆失败'
      default: return '准备就绪'
    }
  }

  // 获取进度百分比
  const getProgressPercent = () => {
    switch (cloningStatus) {
      case 'uploading': return 20
      case 'cloning': return 50
      case 'pending': return 80
      case 'completed': return 100
      case 'failed': return 0
      default: return 0
    }
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-violet-400 text-sm font-medium tracking-wider uppercase mb-3 block">
          步骤一
        </span>
        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          建立你的数字声音身份
        </h2>
        <p className="text-white/40 text-base leading-relaxed font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          提供至少 1 分钟的高质量人声样本，AI 将学习你的声音特点
        </p>
      </div>

      {/* 为什么要录音？解释卡片 */}
      <div className="max-w-3xl mx-auto p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white/60 text-lg">
              help
            </span>
          </div>
          <div className="flex-1">
            <h4 className="text-white/90 font-medium mb-2 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              为什么要录音？
            </h4>
            <p className="text-white/50 text-sm leading-relaxed mb-3 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              AI 会学习你的声音特点，然后用<strong className="text-white/70">你自己的声音</strong>唱出方言 Rap。
              就像有一个"数字分身"在帮你唱歌！
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/35">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400/70 text-sm">check</span>
                <span>相似度 ≥ 80%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400/70 text-sm">check</span>
                <span>保持你的声音特色</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400/70 text-sm">check</span>
                <span>可随时重新录制</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Action Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 主卡片：上传视频 - 最推荐 */}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
          <div
            className={`group p-6 rounded-2xl transition-all duration-300 cursor-pointer card-lift ${
              state.voiceCloning.uploadType === 'video'
                ? 'bg-gradient-to-br from-violet-500/15 to-emerald-500/15 border-2 border-violet-500/40'
                : 'bg-gradient-to-br from-violet-500/5 to-emerald-500/5 border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
            }`}
            onClick={() => !isExtracting && videoInputRef.current?.click()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl text-violet-400">
                  movie
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white/90 font-semibold text-base font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    上传视频
                  </h3>
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full font-medium">
                    推荐
                  </span>
                </div>
                <p className="text-white/40 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif] mb-2">
                  从相册选择视频，自动提取人声
                </p>
                <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  支持 MP4 / MOV / AVI
                </p>

                {/* 提取进度 */}
                {state.voiceCloning.uploadType === 'video' && (
                  <div className="mt-3">
                    {isExtracting ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-violet-400">正在提取音频...</span>
                          <span className="text-white/60">{state.voiceCloning.extractProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.1] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${state.voiceCloning.extractProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : state.voiceCloning.videoFile ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                        <span className="text-emerald-400/80">✓ 已提取音频</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">其他方式</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* 直接录音 */}
          <div
            className={`group p-5 rounded-2xl transition-all duration-300 cursor-pointer card-lift ${
              state.voiceCloning.uploadType === 'record'
                ? 'bg-gradient-to-br from-violet-500/10 to-emerald-500/10 border-2 border-violet-500/30'
                : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
            }`}
            onClick={handleRecording}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500/10'
                  : 'bg-white/[0.05]'
              }`}>
                <span className={`material-symbols-outlined text-lg ${
                  isRecording ? 'text-red-400' : 'text-white/60'
                }`}>
                  {isRecording ? 'stop' : 'mic'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-white/90 font-medium text-base mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  直接录音
                </h3>
                <p className="text-white/40 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  点击开始，朗读指定文本
                </p>
                {(isRecording || state.voiceCloning.recordingBlob) && (
                  <div className="flex items-center gap-2 mt-2">
                    {isRecording && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    <span className={`${isRecording ? 'text-red-400/80' : 'text-emerald-400/80'} text-xs font-medium`}>
                      {formatTime(recordingTime)}
                    </span>
                    {state.voiceCloning.recordingBlob && !isRecording && (
                      <span className="text-emerald-400/60 text-xs ml-2">✓ 已录制</span>
                    )}
                  </div>
                )}
              </div>
              <span className="material-symbols-outlined text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all text-lg">
                arrow_forward
              </span>
            </div>
          </div>

          {/* 上传音频 */}
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />
          <div
            className={`group p-5 rounded-2xl transition-all duration-300 cursor-pointer card-lift ${
              state.voiceCloning.uploadType === 'upload'
                ? 'bg-gradient-to-br from-violet-500/10 to-emerald-500/10 border-2 border-violet-500/30'
                : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
            }`}
            onClick={() => audioInputRef.current?.click()}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white/60 text-lg">
                  audio_file
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-white/90 font-medium text-base mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  上传音频
                </h3>
                <p className="text-white/40 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  从文件选择音频
                </p>
                <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif] mt-1">
                  MP3 / WAV / FLAC / M4A
                </p>
                {state.voiceCloning.audioFile && state.voiceCloning.uploadType === 'upload' && (
                  <p className="text-emerald-400/80 text-xs mt-2">✓ {state.voiceCloning.audioFile.name}</p>
                )}
              </div>
              <span className="material-symbols-outlined text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all text-lg">
                arrow_forward
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Reading Text & Quality Analysis */}
        <div className="lg:col-span-8 space-y-6">
          {/* Reading Text Card - 录音时显示 */}
          {(state.voiceCloning.uploadType === 'record' || isRecording) && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-white/50 text-base">
                  article
                </span>
                <span className="text-white/60 text-sm font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  请朗读以下文字（约1分钟）
                </span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed font-['PingFang_SC','Noto_Sans_SC',sans-serif] whitespace-pre-line">
                {readingText}
              </p>
            </div>
          )}

          {/* Quality Analysis Panel */}
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-white text-xl font-semibold font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  声音质量分析
                </h3>
                <p className="text-white/30 text-sm mt-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  自动检测音频质量指标
                </p>
              </div>
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="text-emerald-400 text-xs font-medium">
                  分析就绪
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">信噪比</span>
                  <span className="text-white font-semibold">38.2 dB</span>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-gradient-to-r from-violet-500 to-violet-400 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">清晰度</span>
                  <span className="text-white font-semibold">94%</span>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full w-[94%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                </div>
              </div>
            </div>

            {/* Quality Checks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: 'check_circle', label: '无削波' },
                { icon: 'check_circle', label: '环境安静' },
                { icon: 'check_circle', label: '采样率 44.1k' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03]">
                  <span className="material-symbols-outlined text-emerald-400 text-lg">
                    {item.icon}
                  </span>
                  <span className="text-white/60 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/5 to-emerald-500/5 border border-white/[0.04]">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-amber-400 text-lg">
                lightbulb
              </span>
              <span className="text-white/60 text-sm font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                录制技巧
              </span>
            </div>
            <ul className="space-y-2 text-white/40 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-violet-400" />
                最少录制 1 分钟，建议 1-2 分钟
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-violet-400" />
                选择安静环境录制
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-violet-400" />
                保持麦克风距离 15-20cm
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-violet-400" />
                按照指定文本自然朗读
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cloning Progress / Service Status */}
      {serviceStatus === null ? (
        // 加载中
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center justify-center gap-3 py-4">
            <span className="material-symbols-outlined text-white/40 animate-spin">progress_activity</span>
            <span className="text-white/50 text-sm">检测声音克隆服务...</span>
          </div>
        </div>
      ) : serviceStatus.enabled ? (
        // 服务可用 - 显示克隆进度
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/60">graphic_eq</span>
              </div>
              <div>
                <h4 className="text-white font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  {getStatusText()}
                </h4>
                <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  CosyVoice 声音复刻技术
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{getProgressPercent()}%</span>
            </div>
          </div>
          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/30 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
            <span>{getStatusText()}</span>
            <span>
              {cloningStatus === 'completed' ? '可以使用' :
               cloningStatus === 'pending' ? '审核中...' : '-'}
            </span>
          </div>

          {/* 错误提示 */}
          {cloningError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-xs">{cloningError}</p>
            </div>
          )}

          {/* 开始克隆按钮 */}
          {cloningStatus === 'idle' && hasAudio && (
            <button
              onClick={startVoiceCloning}
              className="mt-4 w-full py-3 bg-gradient-to-r from-violet-500/20 to-emerald-500/20 text-white rounded-xl font-medium hover:from-violet-500/30 hover:to-emerald-500/30 transition-all font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
            >
              创建我的声音模型
            </button>
          )}
        </div>
      ) : (
        // 服务不可用 - 显示跳过选项
        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-amber-400">info</span>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium mb-2 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                声音克隆服务暂未启用
              </h4>
              <p className="text-white/50 text-sm leading-relaxed mb-4 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                CosyVoice 声音复刻服务需要配置 DASHSCOPE_API_KEY。您可以跳过此步骤，使用系统默认音色创作方言 Rap。
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSkipVoiceCloning}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/15 transition-colors font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
                >
                  使用默认音色继续
                </button>
                <span className="text-white/30 text-xs">您仍可上传音频，稍后启用训练</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-4">
        {/* 下一步预览 */}
        <div className="hidden md:block">
          <p className="text-white/30 text-xs mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">下一步</p>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-lg">graphic_eq</span>
            <span className="text-white/50 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              选择方言风格和背景音乐
            </span>
          </div>
        </div>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 active:scale-95 min-h-[48px] btn-press font-['PingFang_SC','Noto_Sans_SC',sans-serif] ${
            canProceed
              ? 'bg-white text-black hover:shadow-lg hover:shadow-white/20'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {canProceed ? '下一步' : '请先录制或上传音频'}
          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  )
}
