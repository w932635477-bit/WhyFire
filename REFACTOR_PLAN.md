# 方言 Rap 重构计划

## 技术栈变更

| 功能 | 旧技术 | 新技术 |
|------|--------|--------|
| 声音克隆 | MiniMax/Fish Audio | **GPT-SoVITS** |
| 方言 TTS | Suno/Step Audio | **阿里云 CosyVoice 3** |
| 人声分离 | FFmpeg.wasm | **Spleeter/Demucs** |
| 歌词生成 | EvoLink (Claude) | 保持不变 ✅ |
| Rhythm Adaptor | 未实现 | **自研** |

## 需要的 API Keys

1. **阿里云 DashScope API Key** - CosyVoice 3 TTS
   - 获取: https://dashscope.console.aliyun.com/
   - 环境变量: `DASHSCOPE_API_KEY`

2. **GPT-SoVITS 服务**
   - 选项 A: 自己部署 (推荐，更灵活)
   - 选项 B: 使用云服务

## 重构文件清单

### 新建文件
```
src/lib/tts/cosyvoice-client.ts      # CosyVoice 3 客户端
src/lib/voice/gpt-sovits-client.ts   # GPT-SoVITS 声音克隆
src/lib/audio/spleeter-client.ts     # 人声分离
src/lib/audio/rhythm-adaptor.ts      # 节奏适配器
src/app/api/voice/clone/route.ts     # 声音克隆 API
src/app/api/tts/dialect/route.ts     # 方言 TTS API
```

### 删除/弃用文件
```
src/lib/music/suno-client.ts         # 不再使用
src/lib/minimax/client.ts            # 不再使用
src/lib/tts/fish-audio-client.ts     # 不再使用
```

### 修改文件
```
src/lib/music/music-router.ts        # 重写音乐路由
src/app/sonic-gallery/create/        # 更新创作流程
.env.example                         # 更新环境变量
```

## 实现步骤

### Phase 1: TTS 层 (CosyVoice 3)
1. 实现 CosyVoice 3 客户端
2. 支持 8 种方言：普通话、粤语、四川话、东北话、山东话、上海话、河南话、湖南话
3. 实现 API 路由

### Phase 2: 声音克隆层 (GPT-SoVITS)
1. 实现 GPT-SoVITS 客户端
2. 用户录音 → 训练模型 → 克隆声音
3. 克隆后的声音 + 方言 TTS 结合

### Phase 3: 音频处理层
1. 实现人声分离 (Spleeter)
2. 实现 Rhythm Adaptor (节奏适配)
3. 实现混音合成

### Phase 4: 整合测试
1. 端到端流程测试
2. 音质验证
3. 性能优化

## CosyVoice 3 API 文档

### 支持的方言
- 普通话 (zh-CN)
- 粤语 (yue-CN)
- 四川话 (sc-CN)
- 东北话 (ne-CN)
- 更多...

### API 调用示例
```typescript
const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'cosyvoice-v3-flash',
    input: { text: '你好世界' },
    voice: 'longxiaochun',
  }),
})
```
