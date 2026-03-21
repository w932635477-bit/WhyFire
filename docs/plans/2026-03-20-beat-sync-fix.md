# 节拍同步功能修复计划

> **问题**: A方案（节拍同步字幕）功能完全没有生效，字幕特效不工作

## 根本原因分析

经过代码审查，发现以下问题链：

### 问题 1: 节拍同步静默失败
- `video-synthesizer.ts` 第 352-354 行捕获错误后设置 `syncedLyrics = null`
- 回退到原始歌词时，`words` 数组为空（第 395 行 `words: line.words || []`）
- 用户无法知道节拍同步是否成功

### 问题 2: 特效依赖 words 数组
- `subtitle-effects.ts` 中的特效（karaoke-plus, punch, bounce-3d 等）都依赖 `line.words`
- 如果 `words` 为空，特效回退到基本模式
- 第 68-70 行和类似位置：`if (!line.words || line.words.length === 0)`

### 问题 3: 原始歌词没有 words 数组
- `parseLyricsToLines()` (page.tsx 第 23-34 行) 只生成基本歌词
- 不包含逐字的时间信息

## 修复方案

### Task 1: 增加节拍同步诊断日志

**文件**: `src/lib/ffmpeg/video-synthesizer.ts`

在节拍同步阶段添加详细日志：
- 节拍检测开始/结束
- BPM、offset、confidence
- 歌词映射结果（行数、第一行的时间戳）
- 最终使用的歌词来源（syncedLyrics 还是原始 lyrics）

### Task 2: 为回退歌词生成 words 数组

**文件**: `src/lib/ffmpeg/video-synthesizer.ts`

当 `syncedLyrics` 为 null 时，不简单回退，而是基于音频时长均匀分配生成 words：

```typescript
// 为原始歌词生成 words 数组
function generateWordsForLyrics(
  lyrics: LyricLine[],
  audioDuration: number
): LyricLineWithWords[] {
  return lyrics.map(line => ({
    ...line,
    words: generateWordsArray(line.text, line.startTime, line.endTime)
  }))
}
```

### Task 3: 确保 ASS 字幕特效正确应用

**文件**: `src/lib/effects/subtitle-effects.ts`

检查并修复：
- Alignment 值（已修复为 5 = 中心）
- 确保特效标签正确生成
- 增加调试日志输出 ASS 内容

### Task 4: 增加用户可见的节拍同步状态

**文件**: `src/app/create/page.tsx`

在 UI 上显示：
- 节拍同步是否成功
- BPM 值
- 如果失败，显示警告

## 验证步骤

1. 启动开发服务器
2. 上传视频，生成歌词和音乐
3. 查看控制台日志，确认：
   - `[VideoSynthesizer] 节拍同步完成` 或错误信息
   - `Final lyrics sample` 包含 words 数组
   - ASS 字幕内容包含特效标签（如 `\kf`, `\t`, `\fscx` 等）
4. 检查生成的视频字幕是否：
   - 显示在画面中央
   - 有逐字高亮/缩放等特效

## 预期结果

- 节拍同步成功：歌词与音乐节拍对齐，特效正常工作
- 节拍同步失败：均匀分配时间，特效仍然工作（只是不与节拍对齐）
