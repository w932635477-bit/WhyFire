# WhyFire 产品需求文档 (PRD)

> AI 方言 Rap 生成器

**文档版本**: 7.0
**最后更新**: 2026-03-28
**状态**: Active

---

## 1. 产品定位

WhyFire 让用户通过录制声音样本，生成带有自己音色的方言 Rap 音频。

核心差异化：
- 零样本声音克隆（无需训练，3 秒音频即可）
- 8 种中国方言支持
- 用户选择 BGM + AI 自动生成匹配的人声

## 2. 核心流程

```
录制声音 → 选择方言和BGM → 输入创意描述 → AI 生成歌词 → 生成 Rap → 声音替换 → 下载
```

### 用户步骤

| 步骤 | 操作 | 技术实现 |
|------|------|----------|
| 1. 录制声音 | 用户录制或上传音频 | CosyVoice 声音注册 + OSS 存储 |
| 2. 选择方言 | 从 8 种方言中选择 | 方言映射到歌词 Prompt 和 Rap 风格 |
| 3. 选择 BGM | 从预设 BGM 库选择 | BGM 元数据（BPM、时长、风格） |
| 4. 输入描述 | 描述想要的 Rap 内容 | Claude API 生成个性化歌词 |
| 5. 生成 | AI 自动完成 | Suno Add Vocals + Seed-VC |
| 6. 预览下载 | 试听并下载成品 | 音频播放器 + OSS 下载 |

## 3. 方言支持

| 方言 | 代码 | 歌词风格 | Rap 风格 |
|------|------|----------|----------|
| 普通话 | `original` | 标准中文 | Chinese rap, hip-hop, trap |
| 粤语 | `cantonese` | 粤语口语 | Cantonese rap, HK hip-hop |
| 四川话 | `sichuan` | 川味方言 | Sichuan rap, trap |
| 东北话 | `dongbei` | 东北方言 | Northeastern rap, hip-hop |
| 陕西话 | `shaanxi` | 关中方言 | Shaanxi rap, folk rap |
| 吴语 | `wu` | 上海/江南方言 | Wu dialect rap |
| 闽南语 | `minnan` | 闽南/台语 | Taiwanese rap |
| 天津话 | `tianjin` | 天津方言 | Tianjin rap |
| 南京话 | `nanjing` | 南京方言 | Nanjing rap |

## 4. 技术架构

### 4.1 生成管道（Add Vocals 模式）

```
Claude 歌词生成 → Suno Add Vocals（在用户 BGM 上生成人声）→ Seed-VC 零样本音色替换 → 成品
```

### 4.2 核心服务

| 服务 | 用途 | 配置 |
|------|------|------|
| Claude API | 歌词生成 | `ANTHROPIC_API_KEY` |
| SunoAPI | Rap 音乐生成（Add Vocals） | `SUNOAPI_API_KEY` |
| Seed-VC | 零样本声音克隆 | Modal GPU (A10G) |
| CosyVoice | 声音复刻注册 | `DASHSCOPE_API_KEY` |
| 阿里云 OSS | 文件存储 | `OSS_*` 环境变量 |

### 4.3 前端

| 技术 | 用途 |
|------|------|
| Next.js 15 | 全栈框架 (App Router) |
| React 18 | UI |
| Tailwind CSS | 样式 |
| Framer Motion | 动画 |

## 5. 成本估算

| 环节 | 单次成本 |
|------|----------|
| Claude 歌词 | ~$0.002 |
| Suno Add Vocals | ~$0.10 |
| Seed-VC 转换 | ~$0.05 (Modal GPU) |
| OSS 存储 | 可忽略 |
| **合计** | **~$0.15/次** |

## 6. 已知限制

- Modal GPU 账单耗尽会导致 429 错误
- SunoAPI credits 不足需要充值
- 视频合成功能暂未实现（当前只生成音频）
- 声音克隆效果受参考音频质量影响

## 7. 未来计划

- [ ] 视频合成（FFmpeg + 字幕同步）
- [ ] BGM 库扩充
- [ ] 用户系统 + 作品管理
- [ ] 付费体系
- [ ] 移动端适配

---

## 修订历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 7.0 | 2026-03-28 | 全面重写：更新为 Suno + Seed-VC 管道，移除 MiniMax/Azure 等废弃服务 |
| 6.1 | 2026-03-18 | 方言 TTS Azure 方案，积分制 |
| 1.0 | 2026-03-18 | 初始版本 |
