'use client';

/**
 * Step 4: 海外创意灵感库页面
 * WhyFire - 小红书 AI 教练
 */

import { useState } from 'react';
import StepNavigation from '@/components/wizard/step-navigation';

// 模拟灵感视频数据
const mockVideos = [
  {
    id: '1',
    platform: 'TikTok',
    title: '5分钟早餐挑战 - 从零开始做健康早餐',
    thumbnail: 'https://picsum.photos/seed/video1/400/225',
    author: '@healthyfood',
    views: '2.3M',
    duration: '5:24',
    insight: '使用"挑战"框架 + 时间限制，制造紧迫感',
    localizationTip: '可改为"5分钟早餐搞定"或"打工人早餐"',
  },
  {
    id: '2',
    platform: 'YouTube',
    title: 'I tried 100 skincare products so you don\'t have to',
    thumbnail: 'https://picsum.photos/seed/video2/400/225',
    author: 'Skincare Lab',
    views: '1.8M',
    duration: '12:30',
    insight: '"替你试错"框架 + 大量产品，建立信任感',
    localizationTip: '改为"帮你们试了50款平价护肤品"',
  },
  {
    id: '3',
    platform: 'TikTok',
    title: 'Day in my life as a content creator',
    thumbnail: 'https://picsum.photos/seed/video3/400/225',
    author: '@creatorlife',
    views: '5.1M',
    duration: '3:45',
    insight: '幕后揭秘 + 身份认同，吸引同赛道用户',
    localizationTip: '改为"全职博主的一天"或"副业博主日常"',
  },
  {
    id: '4',
    platform: 'TikTok',
    title: 'POV: You finally found your aesthetic',
    thumbnail: 'https://picsum.photos/seed/video4/400/225',
    author: '@aesthetictips',
    views: '3.2M',
    duration: '2:18',
    insight: 'POV叙事 + 身份转变，强情感共鸣',
    localizationTip: '改为"找到自己的风格后的变化"',
  },
  {
    id: '5',
    platform: 'YouTube',
    title: 'The truth about viral content nobody talks about',
    thumbnail: 'https://picsum.photos/seed/video5/400/225',
    author: 'Growth Lab',
    views: '890K',
    duration: '8:15',
    insight: '"真相揭秘"框架 + 负面表达，激发好奇',
    localizationTip: '改为"爆款背后的真相"或"没人告诉你的"',
  },
  {
    id: '6',
    platform: 'TikTok',
    title: 'Things I wish I knew before starting my business',
    thumbnail: 'https://picsum.photos/seed/video6/400/225',
    author: '@entrepreneur',
    views: '4.5M',
    duration: '4:02',
    insight: '经验分享 + 后悔叙事，建立信任',
    localizationTip: '改为"做博主前我希望知道的事"',
  },
];

export default function InspirationPage() {
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleVideo = (videoId: string) => {
    setSelectedVideos(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col">
      {/* 页面标题 */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">💡</span>
          <h1 className="text-2xl font-bold text-text-primary">海外创意灵感库</h1>
        </div>
        <p className="text-text-secondary">
          基于你的分析结果，AI 精选 6-10 个相关海外爆款
        </p>
      </div>

      {/* 上下文提示 */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl flex-shrink-0">🎯</span>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-1">针对你的差距点精选</h3>
              <p className="text-sm text-text-secondary">
                根据你在"钩子强度"、"视觉吸引力"、"传播性"的差距，精选了以下可借鉴的海外爆款
              </p>
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="text-2xl font-bold gradient-text">6</div>
              <div className="text-xs text-text-tertiary">精选视频</div>
            </div>
          </div>
        </div>
      </div>

      {/* 灵感卡片网格 */}
      <div className="px-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {mockVideos.map((video) => (
            <div
              key={video.id}
              className={`bg-bg-card border rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                selectedVideos.includes(video.id)
                  ? 'border-accent-primary'
                  : 'border-border-default hover:border-border-strong'
              }`}
            >
              {/* 视频缩略图 */}
              <div className="relative aspect-video bg-bg-secondary">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    video.platform === 'TikTok'
                      ? 'bg-black border border-cyan-400 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    {video.platform}
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs text-white font-mono">
                  {video.duration}
                </div>
              </div>

              {/* 视频信息 */}
              <div className="p-4 border-b border-border-subtle">
                <h4 className="font-medium text-text-primary mb-2 line-clamp-2">
                  {video.title}
                </h4>
                <div className="flex items-center justify-between text-sm text-text-tertiary">
                  <span>{video.author}</span>
                  <span>{video.views} views</span>
                </div>
              </div>

              {/* 洞察面板 */}
              <div className="p-4 bg-bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-accent-primary">💡</span>
                  <span className="text-sm font-medium text-accent-primary">AI 解读</span>
                </div>
                <p className="text-sm text-text-secondary mb-3">{video.insight}</p>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-primary">🇨🇳</span>
                  <span className="text-sm font-medium text-green-primary">本土化建议</span>
                </div>
                <p className="text-sm text-text-secondary">{video.localizationTip}</p>
              </div>

              {/* 操作按钮 */}
              <div className="p-4 flex gap-2">
                <button
                  onClick={() => toggleVideo(video.id)}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedVideos.includes(video.id)
                      ? 'bg-accent-gradient text-white'
                      : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {selectedVideos.includes(video.id) ? '已收藏' : '收藏灵感'}
                </button>
                <button className="px-4 py-2 rounded-lg bg-bg-secondary text-text-secondary hover:text-text-primary text-sm transition-all">
                  查看原片
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 已选提示 */}
        {selectedVideos.length > 0 && (
          <div className="bg-green-primary/10 border border-green-primary/20 rounded-lg p-4 mb-8 text-center">
            <p className="text-sm text-green-primary">
              已收藏 {selectedVideos.length} 个灵感，将在完成报告中汇总
            </p>
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <StepNavigation
        currentStepId={4}
        completedSteps={[1, 2, 3]}
      />
    </div>
  );
}
