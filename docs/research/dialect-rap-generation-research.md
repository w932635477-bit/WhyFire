# 方言 Rap 音乐生成技术调研报告

> 调研日期: 2026-03-21
> 目标: 实现真正的方言版 Rap 音乐生成，而非"加入方言词汇的普通话版"

---

## 一、问题分析

### 当前 MiniMax API 的能力限制

| 方言 | 支持情况 | 说明 |
|------|----------|------|
| 粤语 | ✅ 完整支持 | 写粤语歌词 → 模型用粤语发音演唱 |
| 普通话 | ✅ 完整支持 | 标准普通话发音 |
| 东北话 | ❌ 不支持真正的方言发音 | 只能用普通话发音读方言词汇 |
| 四川话 | ❌ 不支持真正的方言发音 | 只能用普通话发音读方言词汇 |
| 其他方言 | ❌ 基本不支持 | 同上问题 |

**核心问题**: MiniMax 音乐 API 会根据歌词内容自动识别语言，但对于非标准语言的方言（东北话、四川话等），只能用普通话发音来读方言词汇，无法实现真正的方言发音。

---

## 二、技术方案调研

### 方案对比总览

| 方案 | 平台/服务 | 方言支持 | API可用性 | 推荐度 |
|------|----------|----------|----------|--------|
| **天工SkyMusic** | 昆仑万维 | 粤语、成都话、北京话等 | ✅ 已开放API | ⭐⭐⭐⭐⭐ |
| **Step-Audio** | 阶跃星辰 | 12种方言（含说唱功能） | ✅ 已开放API | ⭐⭐⭐⭐⭐ |
| **Fun-CosyVoice3** | 阿里开源 | 9种语言18种方言 | ✅ 开源可部署 | ⭐⭐⭐⭐ |
| **妙音AI** | miaoyin.live | 粤语、四川话、东北话等 | ⚠️ 未找到公开API | ⭐⭐⭐ |
| **MiniMax** | MiniMax | 粤语、40种语言 | ✅ 已集成 | ⭐⭐ |
| **Suno** | Suno AI | 粤语支持较好 | ⚠️ 需代理访问 | ⭐⭐ |

---

## 三、重点推荐方案

### 1. 天工SkyMusic API ⭐⭐⭐⭐⭐

**厂商**: 昆仑万维
**官网**: https://music.tiangong.cn/
**API文档**: https://platform.minimaxi.com/docs/api-reference/api-overview

#### 核心优势
- ✅ **明确支持方言歌曲生成**：粤语、成都话、北京话等
- ✅ **已开放API接口**：开发者可通过标准化协议调用
- ✅ **国产大模型**：基于4000亿参数的"天工3.0"大模型
- ✅ **30+音乐风格**：说唱、古风、电子、民谣、放克等
- ✅ **中文优化**：专为中国市场优化，中文人声质量优秀

#### 技术特点
- 采用音乐音频领域类Sora架构
- 支持高质量AI音乐生成、人声合成
- 支持歌词段落控制

#### 接入建议
```
1. 访问天工开放平台申请API权限
2. 评估API定价和调用限制
3. 进行技术集成测试
4. 与MiniMax形成双API架构（粤语用MiniMax，其他方言用天工）
```

---

### 2. Step-Audio（阶跃星辰）⭐⭐⭐⭐⭐

**厂商**: 阶跃星辰
**官网**: https://platform.stepfun.com/
**API文档**: https://platform.stepfun.com/docs/zh/api-reference/audio/create_audio

#### 核心优势
- ✅ **首创说唱与哼唱生成功能** - 这正是我们需要的！
- ✅ **支持12种方言**：粤语、四川话等
- ✅ **情绪控制**：开心、悲伤、愤怒等情感表达
- ✅ **语速和风格调整**：RAP、哼唱、正常语速
- ✅ **130亿参数大模型**

#### 可用模型

| 模型名称 | 功能 |
|---------|------|
| step-tts-mini | 文生音频，情绪感知、语音复刻 |
| step-tts-2 | 高保真语音合成 |
| step-audio-2 | 端到端语音模型，深度思考+音色切换 |
| Step-1o-Audio | 国内首个千亿参数端到端语音大模型 |

#### API接口
```
POST https://api.stepfun.com/v1/audio/speech
```

#### 接入建议
```
1. 注册阶跃星辰开放平台账号
2. 测试说唱功能是否满足Rap音乐生成需求
3. 评估方言发音质量
4. 集成到项目中
```

---

### 3. Fun-CosyVoice3（阿里开源）⭐⭐⭐⭐

**厂商**: 阿里巴巴
**开源地址**: GitHub (FunAudioLLM)

#### 核心优势
- ✅ **开源可自部署** - 数据安全可控
- ✅ **支持9种语言18种方言**
- ✅ **说唱识别功能**
- ✅ **跨语种音色克隆**（仅需3秒音频）
- ✅ **生成速度快**：实时2倍以上

#### 技术特点
- 0.5B TTS + 0.8B ASR 模型
- 词错误率（WER）比主流方案低15%
- 支持情感控制和风格调整

#### 接入建议
```
1. 评估服务器部署成本
2. 测试方言Rap生成效果
3. 考虑作为备选方案或离线处理方案
```

---

### 4. 妙音AI ⭐⭐⭐

**官网**: https://www.miaoyin.live/

#### 核心优势
- ✅ **最懂中文的AI作曲平台**
- ✅ **独家方言功能**：粤语、四川话、东北话、上海话、闽南语
- ✅ **发音准确率95%+**，文化地道性85%+
- ✅ **创作成本极低**：单首不到1元

#### 局限性
- ⚠️ **未找到公开API文档**
- ⚠️ 可能仅对企业客户开放API
- ⚠️ 需要联系商务获取接入权限

#### 接入建议
```
1. 联系妙音AI商务合作
2. 评估API接入可能性
3. 如无API，可作为人工补充方案
```

---

## 四、推荐实施方案

### 短期方案（1-2周）

```
┌─────────────────────────────────────────────────────┐
│                    双API架构                         │
├─────────────────────────────────────────────────────┤
│  粤语歌曲 → MiniMax API（已集成，效果已验证）          │
│  其他方言 → 天工SkyMusic API（需接入）                │
│  普通话   → MiniMax API（已集成）                     │
└─────────────────────────────────────────────────────┘
```

**实施步骤**:
1. 申请天工SkyMusic API权限
2. 创建天工音乐生成客户端（参考现有MiniMax客户端）
3. 修改音乐生成路由，根据方言选择API
4. 测试验证方言发音效果

### 中期方案（2-4周）

```
┌─────────────────────────────────────────────────────┐
│                多API + 质量评估                       │
├─────────────────────────────────────────────────────┤
│  方言Rap → Step-Audio 说唱API                        │
│  方言歌曲 → 天工SkyMusic                             │
│  粤语    → MiniMax / 天工SkyMusic                    │
│  普通话  → MiniMax                                   │
│                                                     │
│  质量评估 → 用户反馈 + 自动评分                       │
└─────────────────────────────────────────────────────┘
```

**实施步骤**:
1. 集成Step-Audio说唱API
2. 对比测试Step-Audio与天工SkyMusic的方言效果
3. 建立质量评估机制
4. 根据用户反馈持续优化

### 长期方案（1-3个月）

```
┌─────────────────────────────────────────────────────┐
│              智能路由 + 多源融合                      │
├─────────────────────────────────────────────────────┤
│  输入：歌词 + 方言类型 + 音乐风格                     │
│                    ↓                                │
│         智能选择最佳生成引擎                         │
│                    ↓                                │
│  ┌──────────────────────────────────────┐           │
│  │ 引擎选择逻辑：                        │           │
│  │ • 粤语 → MiniMax (最优)              │           │
│  │ • 东北话/四川话 → 天工SkyMusic       │           │
│  │ • Rap风格 → Step-Audio说唱           │           │
│  │ • 高质量需求 → 多引擎生成+用户选择   │           │
│  └──────────────────────────────────────┘           │
│                    ↓                                │
│  输出：高质量方言音乐                                │
└─────────────────────────────────────────────────────┘
```

---

## 五、技术实现要点

### 1. API路由层改造

```typescript
// src/lib/music/music-router.ts
interface MusicGenerationRequest {
  lyrics: string
  dialect: 'mandarin' | 'cantonese' | 'dongbei' | 'sichuan' | 'english'
  style: 'rap' | 'pop' | 'electronic'
}

async function routeMusicGeneration(req: MusicGenerationRequest) {
  switch (req.dialect) {
    case 'cantonese':
      return minimaxClient.generateMusic(req)
    case 'dongbei':
    case 'sichuan':
      return tiangongClient.generateMusic(req)
    case 'mandarin':
      return minimaxClient.generateMusic(req)
    default:
      return minimaxClient.generateMusic(req)
  }
}
```

### 2. 新增方言类型

```typescript
// src/types/index.ts
export type DialectType = 'mandarin' | 'cantonese' | 'english' | 'dongbei' | 'sichuan'

export const DIALECT_LABELS: Record<DialectType, string> = {
  mandarin: '普通话',
  cantonese: '粤语',
  english: 'English',
  dongbei: '东北话',
  sichuan: '四川话',
}
```

### 3. 天工SkyMusic客户端（待实现）

```typescript
// src/lib/tiangong/client.ts
export class TiangongMusicClient {
  private apiKey: string
  private baseUrl: string

  async generateMusic(options: {
    lyrics: string
    dialect: string
    style: string
  }): Promise<{ audioUrl: string }> {
    // 调用天工SkyMusic API
    // 保存音频到本地
    // 返回音频URL
  }
}
```

---

## 六、成本估算

### API成本对比（预估）

| 平台 | 单首成本 | 月度1000首 | 备注 |
|------|---------|-----------|------|
| MiniMax | ~0.5元 | ~500元 | 已集成 |
| 天工SkyMusic | 待确认 | 待确认 | 需申请后评估 |
| Step-Audio | 待确认 | 待确认 | 需申请后评估 |
| 妙音AI | <1元 | <1000元 | 无API，需商务合作 |

### 开发工作量估算

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| 天工SkyMusic客户端开发 | 2-3天 | 高 |
| 音乐路由层改造 | 1天 | 高 |
| 方言类型扩展 | 0.5天 | 高 |
| Step-Audio集成 | 2-3天 | 中 |
| 测试与验证 | 2天 | 高 |

---

## 七、结论与建议

### 核心结论

1. **MiniMax无法实现真正的方言发音**（除粤语外）
2. **天工SkyMusic**是目前最佳选择，明确支持方言歌曲生成且有公开API
3. **Step-Audio**的说唱功能值得重点关注
4. 建议采用**多API架构**，根据方言类型智能路由

### 立即行动项

1. [ ] 申请天工SkyMusic API权限
2. [ ] 申请Step-Audio API权限
3. [ ] 联系妙音AI商务了解API接入可能性
4. [ ] 创建技术评估任务清单
5. [ ] 开始天工SkyMusic客户端开发

---

## 八、参考链接

### 官方平台
- [天工AI音乐](https://music.tiangong.cn/)
- [阶跃星辰开放平台](https://platform.stepfun.com/)
- [MiniMax开放平台](https://platform.minimaxi.com/)
- [妙音AI](https://www.miaoyin.live/)

### API文档
- [Step-Audio语音合成API](https://platform.stepfun.com/docs/zh/api-reference/audio/create_audio)
- [MiniMax语音合成API](https://platform.minimaxi.com/docs/api-reference/speech-t2a-intro)

### 相关文章
- [AI音乐平台对比实测](https://zhuanlan.zhihu.com/p/1938984516308935562)
- [天工SkyMusic vs Suno对比](https://post.smzdm.com/p/a8636gg0)
- [Step-Audio技术分析](https://blog.csdn.net/gitblog_01036/article/details/155046742)
- [2025语音合成革命](https://testerhome.com/topics/41597/show_wechat)
