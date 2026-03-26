/**
 * 生成测试音频文件
 *
 * 使用 FFmpeg 生成测试用的静音音频文件
 *
 * 运行: npx tsx tests/fixtures/generate-fixtures.ts
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = __dirname

// 确保目录存在
;['voices', 'bgm', 'samples'].forEach(dir => {
  const fullPath = resolve(fixturesDir, dir)
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true })
    console.log(`✓ 创建目录: ${dir}/`)
  }
})

/**
 * 使用 FFmpeg 生成静音音频
 */
function generateSilentAudio(
  outputPath: string,
  duration: number,
  sampleRate: number = 44100,
  channels: number = 2
) {
  const cmd = `ffmpeg -y -f lavfi -i anullsrc=r=${sampleRate}:cl=${channels === 2 ? 'stereo' : 'mono'} -t ${duration} -acodec libmp3lame -q:a 9 "${outputPath}" 2>/dev/null`

  try {
    execSync(cmd, { stdio: 'pipe' })
    console.log(`✓ 生成: ${outputPath}`)
    return true
  } catch (error) {
    console.error(`✗ 生成失败: ${outputPath}`)
    return false
  }
}

/**
 * 使用 FFmpeg 生成带噪音的音频
 */
function generateNoisyAudio(
  outputPath: string,
  duration: number,
  volume: number = 0.1
) {
  const cmd = `ffmpeg -y -f lavfi -i anoisesrc=d=${duration}:c=pink:a=${volume} -acodec libmp3lame -q:a 9 "${outputPath}" 2>/dev/null`

  try {
    execSync(cmd, { stdio: 'pipe' })
    console.log(`✓ 生成: ${outputPath}`)
    return true
  } catch (error) {
    console.error(`✗ 生成失败: ${outputPath}`)
    return false
  }
}

console.log('\n=== 生成测试音频文件 ===\n')

// 检查 FFmpeg 是否可用
try {
  execSync('ffmpeg -version', { stdio: 'pipe' })
} catch {
  console.error('✗ FFmpeg 未安装，请先安装 FFmpeg')
  console.log('\n安装方法:')
  console.log('  macOS: brew install ffmpeg')
  console.log('  Ubuntu: sudo apt install ffmpeg')
  process.exit(1)
}

// 生成测试音频
const fixtures = [
  // 声音样本
  { path: 'voices/sample-voice-30s.mp3', duration: 30, type: 'silent' },
  { path: 'voices/sample-voice-10s.mp3', duration: 10, type: 'silent' },

  // BGM 样本
  { path: 'bgm/sample-bgm-60s.mp3', duration: 60, type: 'noisy' },
  { path: 'bgm/sample-bgm-30s.mp3', duration: 30, type: 'noisy' },

  // 测试样本
  { path: 'samples/test-rap-60s.mp3', duration: 60, type: 'silent' },
  { path: 'samples/test-rap-30s.mp3', duration: 30, type: 'silent' },
  { path: 'samples/test-vocals-60s.mp3', duration: 60, type: 'silent' },
]

let successCount = 0
let failCount = 0

fixtures.forEach(fixture => {
  const fullPath = resolve(fixturesDir, fixture.path)
  const generated = fixture.type === 'noisy'
    ? generateNoisyAudio(fullPath, fixture.duration)
    : generateSilentAudio(fullPath, fixture.duration)

  if (generated) {
    successCount++
  } else {
    failCount++
  }
})

console.log(`\n=== 完成 ===`)
console.log(`✓ 成功: ${successCount}`)
console.log(`✗ 失败: ${failCount}`)

// 生成 README
const readme = `# 测试音频文件

本目录包含用于测试的音频文件。

## 目录结构

\`\`\`
fixtures/
├── voices/          # 声音样本
│   ├── sample-voice-30s.mp3    # 30 秒声音样本
│   └── sample-voice-10s.mp3    # 10 秒声音样本
├── bgm/             # BGM 样本
│   ├── sample-bgm-60s.mp3      # 60 秒 BGM
│   └── sample-bgm-30s.mp3      # 30 秒 BGM
└── samples/         # 测试样本
    ├── test-rap-60s.mp3        # 60 秒 Rap 测试
    ├── test-rap-30s.mp3        # 30 秒 Rap 测试
    └── test-vocals-60s.mp3     # 60 秒人声测试
\`\`\`

## 生成文件

运行以下命令生成测试音频：

\`\`\`bash
npx tsx tests/fixtures/generate-fixtures.ts
\`\`\`

## 注意事项

- 这些是用于测试的静音/噪音音频
- 实际功能测试应使用真实的音频文件
- 真实音频可从 OSS 下载：\`https://whyfire-02.oss-cn-beijing.aliyuncs.com/test/\`
`

import { writeFileSync } from 'fs'
writeFileSync(resolve(fixturesDir, 'README.md'), readme)
console.log(`✓ 生成: README.md`)
