# WhyFire

> AI Rap 视频一键生成器 - 输入信息，一键生成创意短视频

## 功能特色

- 4 大使用场景：产品推广、 搞笑洗脑 | IP混剪 | 日常Vlog
- AI 生成 Rap 歌词（Claude）
- AI 生成 Rap 音乐（MiniMax）
- 视频模板 + 用户上传
- 一键合成成品

## 技术栈
- **框架**: Next.js 15 + React 18
- **样式**: Tailwind CSS
- **AI**: Claude API + MiniMax API
- **视频合成**: FFmpeg.wasm

- **语言**: TypeScript

## 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 API Keys

# 启动开发服务器
pnpm dev
```

## 环境变量
| 变量名 | 用途 | 获取地址 |
|--------|------|---------|
| `ANTHROPIC_API_KEY` | Claude API | [Anthropic Console](https://console.anthropic.com/) |
| `MINIMAX_API_KEY` | MiniMax API | [MiniMax 开放平台](https://platform.minimaxi.com/) |
| `MINIMAX_GROUP_ID` | MiniMax Group ID | MiniMax 控制台 |

## 用户流程
1. 选择场景（产品推广/搞笑/IP混剪/日常Vlog）
2. 输入信息（根据场景不同）
3. AI 生成 Rap 歌词
4. AI 生成 Rap 音乐
5. 选择视频（上传/模板）
6. 合成成品视频

7. 下载分享

## 开发进度
- [x] 项目初始化
- [x] 四大场景选择
- [x] Claude 歌词生成
- [ ] MiniMax 音乐生成
- [ ] 视频上传
- [ ] FFmpeg.wasm 合成
- [ ] 视频模板

- [ ] 测试与优化

## 许可证
MIT
