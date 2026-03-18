'use client'

import { useVideoCreationStore, type StepType } from '@/stores/video-creation-store'
import { cn } from '@/lib/utils'

interface Step {
  id: StepType
  label: string
  description: string
}

const STEPS: Step[] = [
  { id: 'scene', label: '场景选择', description: '选择创作场景' },
  { id: 'dialect', label: '方言选择', description: '选择说唱方言' },
  { id: 'lyrics', label: '歌词创作', description: '生成歌词内容' },
  { id: 'music', label: '音乐生成', description: '生成背景音乐' },
  { id: 'video', label: '视频合成', description: '合成最终视频' }
]

export function StepIndicator() {
  const { currentStep, setStep } = useVideoCreationStore()

  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep)

  const canNavigateToStep = (stepIndex: number): boolean => {
    // 只能跳转到当前步骤或之前的步骤
    return stepIndex <= currentStepIndex
  }

  return (
    <div className="w-full py-8">
      {/* 桌面端 - 横向步骤条 */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-4">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = index < currentStepIndex
            const canNavigate = canNavigateToStep(index)

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                {/* 步骤节点 */}
                <button
                  onClick={() => canNavigate && setStep(step.id)}
                  disabled={!canNavigate}
                  className={cn(
                    'relative flex flex-col items-center group',
                    canNavigate ? 'cursor-pointer' : 'cursor-not-allowed'
                  )}
                >
                  {/* 圆形指示器 */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300',
                      isActive && 'bg-primary text-primary-foreground scale-110 shadow-lg',
                      isCompleted && 'bg-primary/20 text-primary border-2 border-primary',
                      !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                      canNavigate && 'hover:scale-105'
                    )}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* 标签 */}
                  <div className="mt-3 text-center">
                    <div
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isActive && 'text-primary',
                        !isActive && 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 hidden lg:block">
                      {step.description}
                    </div>
                  </div>
                </button>

                {/* 连接线 */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1 mx-4 rounded-full overflow-hidden bg-muted mt-[-2rem]">
                    <div
                      className={cn(
                        'h-full bg-primary transition-all duration-500',
                        index < currentStepIndex ? 'w-full' : 'w-0'
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 移动端 - 紧凑显示 */}
      <div className="md:hidden px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-primary">
            步骤 {currentStepIndex + 1} / {STEPS.length}
          </div>
          <div className="text-sm text-muted-foreground">
            {STEPS[currentStepIndex].label}
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* 步骤描述 */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {STEPS[currentStepIndex].description}
        </div>
      </div>
    </div>
  )
}
