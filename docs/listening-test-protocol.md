# Rap 增强系统 - 人工听感测试方案

## 测试目标

验证 F0Transformer + EnergyEnhancer + RapEnhancer 处理后的音频是否达到"演唱感"目标。

## 测试设计

### 1. 测试材料

#### 1.1 输入音频
- **类型 A**: 标准 TTS 输出（平淡朗读）
- **类型 B**: 方言 TTS 输出（四川话/粤语等）
- **类型 C**: 真人 Rap 参考（作为对照）

#### 1.2 BGM 选择
- 90 BPM 伴奏（中等速度）
- 120 BPM 伴奏（快节奏）
- 简单鼓点伴奏（便于判断节拍对齐）

### 2. 测试配置

| 预设 | semitoneShift | dynamicRange | 能量范围 | 适用场景 |
|------|--------------|--------------|----------|---------|
| subtle | 1 | 0.1 | 10dB | 轻柔说唱 |
| balanced | 2 | 0.2 | 15dB | 通用场景 |
| energetic | 3 | 0.3 | 20dB | 动感 Rap |
| aggressive | 2 | 0.25 | 25dB | 硬核风格 |
| melodic | 3 | 0.35 | 12dB | 旋律说唱 |

### 3. 评估维度

每个维度 1-5 分（1=很差，5=很好）

#### 3.1 演唱感维度
- **音调变化 (Pitch Variation)**: 是否有明显的音调起伏？
- **旋律感 (Melodic Feel)**: 听起来是否像在"唱"而不是"读"？
- **节奏贴合 (Rhythm Alignment)**: 是否与 BGM 节拍同步？

#### 3.2 音质维度
- **自然度 (Naturalness)**: 声音是否自然，没有明显的电子感？
- **清晰度 (Clarity)**: 歌词是否清晰可辨？
- **动态感 (Dynamics)**: 强弱变化是否明显？

#### 3.3 整体印象
- **整体评分 (Overall)**: 综合评价
- **与真人 Rap 的接近程度**: 1-5 分

### 4. 测试流程

#### 4.1 准备阶段
1. 生成测试音频样本（每个预设生成 5 个样本）
2. 准备对照音频（原始 TTS + 真人 Rap）
3. 准备评估表格

#### 4.2 测试执行
```
每位测试者需要：
1. 完成基本信息问卷（年龄、音乐背景等）
2. 听取测试说明（约 2 分钟）
3. 进行练习测试（1 个样本，不计分）
4. 正式测试（约 20 个样本，每个约 30 秒）
5. 填写评估表格
```

#### 4.3 样本顺序
- 随机打乱样本顺序，避免顺序效应
- 每个预设在不同位置出现次数相近

### 5. 测试样本生成脚本

```bash
# 运行测试样本生成
bun run scripts/test-rap-enhancer.ts

# 输出文件位于
test-output/rap-enhancer/
├── 00-original.mp3      # 原始音频
├── subtle.mp3           # subtle 预设
├── balanced.mp3         # balanced 预设
├── energetic.mp3        # energetic 预设
├── aggressive.mp3       # aggressive 预设
├── melodic.mp3          # melodic 预设
└── full-rap-with-bgm.mp3 # 完整处理 + BGM
```

### 6. 评估表格模板

| 样本ID | 音调变化 | 旋律感 | 节奏贴合 | 自然度 | 清晰度 | 动态感 | 整体评分 | 接近真人 |
|--------|---------|--------|---------|--------|--------|--------|---------|---------|
| A-01   |         |        |         |        |        |        |         |         |
| A-02   |         |        |         |        |        |        |         |         |
| ...    |         |        |         |        |        |        |         |         |

### 7. 数据分析

#### 7.1 主要指标
- 各预设的平均得分
- 各维度的得分分布
- 预设之间的显著性差异（t-test 或 ANOVA）

#### 7.2 次要指标
- 音乐背景对评分的影响
- 不同 BGM 速度的影响
- 方言类型的影响

### 8. 合格标准

#### 8.1 最低要求
- balanced 预设整体评分 >= 3.5
- 至少一个预设整体评分 >= 4.0
- "接近真人"平均分 >= 3.0

#### 8.2 理想目标
- balanced 预设整体评分 >= 4.0
- energetic 预设整体评分 >= 4.2
- "接近真人"平均分 >= 3.5

### 9. 快速测试命令

```bash
# macOS 快速播放
afplay test-output/rap-enhancer/00-original.mp3
afplay test-output/rap-enhancer/balanced.mp3
afplay test-output/rap-enhancer/energetic.mp3

# 对比播放（原始 vs 增强）
open test-output/rap-enhancer/
```

### 10. 测试者招募建议

- 人数：10-20 人
- 背景：
  - 音乐专业人士 3-5 人
  - Rap 爱好者 5-8 人
  - 普通听众 5-7 人
- 时长：每人约 30-45 分钟
- 激励：建议提供小礼品或红包

## 附录：测试音频生成代码

```typescript
// scripts/generate-listening-test-samples.ts
import { RapEnhancer, RAP_PRESETS } from '../src/lib/audio/rap-enhancer'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const SAMPLES = [
  { id: 'zh-standard', text: '这是第一句歌词，这是第二句歌词，这是第三句歌词', dialect: 'standard' },
  { id: 'zh-sichuan', text: '老子今天不上班，爽翻巴适得板', dialect: 'sichuan' },
  { id: 'zh-cantonese', text: '做人如果没有梦想，同条咸鱼有咩分别', dialect: 'cantonese' },
]

async function generateSamples() {
  const outputDir = 'test-output/listening-test'
  await mkdir(outputDir, { recursive: true })

  const enhancer = new RapEnhancer({ debug: true })

  for (const sample of SAMPLES) {
    // 1. 生成 TTS 音频（使用你的 TTS 系统）
    const ttsAudio = await generateTTS(sample.text, sample.dialect)

    // 2. 为每个预设生成增强版本
    for (const [presetName, presetConfig] of Object.entries(RAP_PRESETS)) {
      const result = await enhancer.enhance(ttsAudio, presetConfig)
      if (result.success && result.audioBuffer) {
        await writeFile(
          join(outputDir, `${sample.id}-${presetName}.mp3`),
          result.audioBuffer
        )
      }
    }
  }

  console.log(`Generated samples in ${outputDir}`)
}
```

## 变更历史

| 日期 | 版本 | 变更内容 |
|------|------|---------|
| 2025-03-25 | v1.0 | 初始版本 |
