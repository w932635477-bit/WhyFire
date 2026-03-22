'use client'

import { useState } from 'react'

interface Step1VoiceCloningProps {
  onNext: () => void
}

export function Step1VoiceCloning({ onNext }: Step1VoiceCloningProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(68)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedMinutes, setRecordedMinutes] = useState(0)

  // 指定朗读文本
  const readingText = `今天天气很好，我出门散步。阳光洒在脸上，感觉特别温暖。
路边的花开得正艳，小鸟在枝头歌唱。
我沿着小路慢慢走着，心情格外舒畅。
远处的山峦若隐若现，像一幅美丽的水墨画。
生活虽然忙碌，但偶尔也要停下来，感受这美好的时光。`

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
          提供 30 秒至 2 分钟的高质量人声样本，由 GPT-SoVITS 训练你的专属音色模型
        </p>
      </div>

      {/* 🤔 为什么要录音？解释卡片 */}
      <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-emerald-500/10 border border-violet-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-violet-400 text-2xl">
              help
            </span>
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-2 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              🤔 为什么要录音？
            </h4>
            <p className="text-white/60 text-sm leading-relaxed mb-3 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
              AI 会学习你的声音特点，然后用<strong className="text-violet-400">你自己的声音</strong>唱出方言 Rap。
              就像有一个"数字分身"在帮你唱歌！
            </p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                <span>相似度 ≥ 80%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                <span>保持你的声音特色</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                <span>可随时重新录制优化</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Action Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Record Voice */}
          <div
            className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 cursor-pointer"
            onClick={() => setIsRecording(!isRecording)}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500/20 animate-pulse'
                  : 'bg-gradient-to-br from-violet-500/20 to-violet-500/5 group-hover:scale-110'
              }`}>
                <span className={`material-symbols-outlined text-2xl ${
                  isRecording ? 'text-red-400' : 'text-violet-400'
                }`}>
                  {isRecording ? 'stop' : 'mic'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  录制人声
                </h3>
                <p className="text-white/40 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  在浏览器中直接录音，建议录制 30秒-2分钟
                </p>
                {isRecording && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 text-sm font-medium">
                      00:32
                    </span>
                  </div>
                )}
              </div>
              <span className="material-symbols-outlined text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
            </div>
          </div>

          {/* Reading Text Card - 显示指定朗读文本 */}
          <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-violet-400 text-lg">
                article
              </span>
              <span className="text-white/70 text-sm font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                请朗读以下文字（约1分钟）
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed font-['PingFang_SC','Noto_Sans_SC',sans-serif] whitespace-pre-line">
              {readingText}
            </p>
          </div>

          {/* Upload Audio/Video */}
          <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-emerald-400 text-2xl">
                  upload_file
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  上传音频/视频
                </h3>
                <p className="text-white/40 text-sm font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                  支持 WAV、FLAC、MP3 或 MP4 格式
                </p>
              </div>
              <span className="material-symbols-outlined text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
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
                最少录制 30 秒，建议 1-2 分钟
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

        {/* Quality Analysis Panel */}
        <div className="lg:col-span-8 p-8 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
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
          <div className="grid grid-cols-2 gap-8 mb-8">
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
          <div className="grid grid-cols-3 gap-3">
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
      </div>

      {/* Training Progress */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/60">model_training</span>
            </div>
            <div>
              <h4 className="text-white font-medium font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                正在训练 AI 音色模型
              </h4>
              <p className="text-white/30 text-xs font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
                GPT-SoVITS 神经网络优化中
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">{trainingProgress}%</span>
          </div>
        </div>
        <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${trainingProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/30 font-['PingFang_SC','Noto_Sans_SC',sans-serif]">
          <span>训练轮次 142 / 200</span>
          <span>预计剩余时间 04:12</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-end pt-4">
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
          className="group inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-semibold text-base hover:shadow-lg hover:shadow-white/20 transition-all duration-300 active:scale-95 font-['PingFang_SC','Noto_Sans_SC',sans-serif]"
        >
          下一步
          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  )
}
