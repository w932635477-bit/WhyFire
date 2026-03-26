/**
 * 测试 Claude 歌词生成 - 爆款版本
 * 参考《八方来财》《野狼disco》等爆款分析
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

// 初始化全局代理（必须在其他 import 之前）
import '../src/lib/proxy'

import { generateWithClaude } from '../src/lib/ai/claude-client'
import type { DialectCode } from '../src/types/dialect'

async function testLyricsGeneration() {
  console.log('🎤 测试爆款歌词生成（基于《八方来财》《野狼disco》分析）\n')

  // 检查 API 配置
  const apiKey = process.env.EVOLINK_API_KEY
  if (!apiKey) {
    console.error('❌ EVOLINK_API_KEY 未配置')
    process.exit(1)
  }
  console.log('✓ EVOLINK_API_KEY 已配置\n')

  // 测试用例 - 更贴近爆款主题
  const testCases: Array<{ dialect: DialectCode; description: string }> = [
    { dialect: 'cantonese', description: '发财梦，生意人的奋斗' },  // 类似《八方来财》
    { dialect: 'dongbei', description: '东北迪厅的怀旧回忆' },     // 类似《野狼disco》
    { dialect: 'sichuan', description: '成都街头的生活' },
  ]

  for (const { dialect, description } of testCases) {
    console.log(`\n📝 测试方言: ${dialect}`)
    console.log(`   主题: ${description}\n`)

    const startTime = Date.now()

    try {
      const lyrics = await generateLyricsWithClaude(description, dialect)
      const duration = Date.now() - startTime

      console.log(`✓ 生成成功 (${duration}ms)`)

      // 分析爆款元素
      console.log('\n📊 爆款元素分析:')
      analyzeLyrics(lyrics, dialect)

      console.log('\n--- 歌词 ---')
      console.log(lyrics)
      console.log('--- 结束 ---\n')
    } catch (error) {
      console.error(`✗ 生成失败:`, error)
    }

    // 避免 rate limit
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  console.log('\n✅ 测试完成')
}

function analyzeLyrics(lyrics: string, dialect: DialectCode) {
  const lines = lyrics.split('\n').filter(l => l.trim() && !l.startsWith('['))

  // 检查是否有 Hook 在开头
  const hasHookFirst = lyrics.indexOf('[Hook]') < lyrics.indexOf('[Verse]')

  // 统计重复句
  const lineCounts = new Map<string, number>()
  lines.forEach(line => {
    const normalized = line.trim()
    lineCounts.set(normalized, (lineCounts.get(normalized) || 0) + 1)
  })
  const repeatedLines = [...lineCounts.entries()].filter(([_, count]) => count > 1)

  // 检查金句候选（短句、有节奏感）
  const goldenCandidates = lines.filter(l => l.length <= 15 && l.length >= 5)

  console.log(`  • Hook在开头: ${hasHookFirst ? '✅' : '❌'}`)
  console.log(`  • 重复句数量: ${repeatedLines.length}（洗脑指数）`)
  console.log(`  • 金句候选: ${goldenCandidates.slice(0, 3).join(' / ')}`)
}

async function generateLyricsWithClaude(description: string, dialect: DialectCode): Promise<string> {
  // 完整的方言配置（与 rap-generator.ts 保持一致）
  const dialectConfig: Record<DialectCode, {
    name: string
    style: string
    keywords: string[]
    culturalSymbols: string[]
    goldenPhrases: string[]
  }> = {
    original: {
      name: '普通话', style: '标准说唱', keywords: ['flow', '押韵', '节奏'],
      culturalSymbols: ['街头', '夜市', '烧烤摊', '电动车'],
      goldenPhrases: ['一路生花', '冲就完了', '干就完了'],
    },
    cantonese: {
      name: '粤语', style: '港式嘻哈', keywords: ['港风', '江湖', '义气'],
      culturalSymbols: ['茶餐厅', '麻将馆', '维港', '牛杂'],
      goldenPhrases: ['捞得掂', '顶硬上', '大把世界'],
    },
    sichuan: {
      name: '四川话', style: '成都Trap', keywords: ['火锅', '熊猫', '安逸'],
      culturalSymbols: ['宽窄巷子', '串串香', '盖碗茶', '麻将'],
      goldenPhrases: ['巴适得板', '要得', '雄起'],
    },
    dongbei: {
      name: '东北话', style: '东北说唱', keywords: ['豪爽', '实在', '热乎'],
      culturalSymbols: ['炕头', '大集', '冰雕', '二人转'],
      goldenPhrases: ['必须的', '没毛病', '整就完了'],
    },
    shaanxi: {
      name: '陕西话', style: '秦腔说唱', keywords: ['古城', '兵马俑', 'biangbiang'],
      culturalSymbols: ['城墙根', '回民街', '油泼面', '羊肉泡'],
      goldenPhrases: ['嘹咋咧', '么麻达', '额滴神'],
    },
    wu: {
      name: '上海话', style: '海派说唱', keywords: ['弄堂', '精致', '摩登'],
      culturalSymbols: ['外滩', '生煎', '石库门', '咖啡'],
      goldenPhrases: ['老灵额', '不要太', '有腔调'],
    },
    minnan: {
      name: '闽南语', style: '台语说唱', keywords: ['打拼', '兄弟', '海风'],
      culturalSymbols: ['夜市', '庙口', '海港', '蚵仔煎'],
      goldenPhrases: ['爱拼才会赢', '兄弟一条心', '冲冲冲'],
    },
    tianjin: {
      name: '天津话', style: '津味说唱', keywords: ['相声', '快板', '逗趣'],
      culturalSymbols: ['茶馆', '狗不理', '海河', '煎饼果子'],
      goldenPhrases: ['倍儿', '介是嘛', '哏儿都'],
    },
    nanjing: {
      name: '南京话', style: '金陵说唱', keywords: ['鸭血粉丝', '秦淮河', '城墙'],
      culturalSymbols: ['夫子庙', '老门东', '盐水鸭', '紫金山'],
      goldenPhrases: ['阿要辣油', '滴板', '多大事'],
    },
  }

  const config = dialectConfig[dialect]

  const prompt = `你是一位擅长创作**病毒式传播**说唱的歌词创作人。你的作品参考了《八方来财》《野狼disco》等爆款神曲的风格。

## 任务
为用户创作一段${config.name}风格的Rap歌词，主题是：${description}

## 爆款歌词核心法则（必须严格遵守）

### 1. 开头放 Hook（最重要！）
- **前3行必须是洗脑金句**，让人一听就能记住
- 参考风格："来财来，我们这憋佬" / "左边跟我一起画个龙"
- 金句要短、要重复、要有节奏感

### 2. 设计传播金句
必须包含 **1-2 句可以单独传播的金句**，类似：
- "${config.goldenPhrases[0]}"
- "${config.culturalSymbols[0]}里的故事"

### 3. 地域文化符号（至少3个）
融入以下${config.name}特色元素：${config.culturalSymbols.join('、')}
${config.keywords.map(k => `- ${k}`).join('\n')}

### 4. 画面感 + 接地气
- 用具体场景代替抽象表达
- 例如："别墅里面唱K" 比 "很有钱" 更有画面感
- 写市井生活、普通人能共情的内容

### 5. 积极正能量
- 结尾要有希望、有力量
- 类似"大展鸿图"的气势

## 歌词结构（必须遵守）

[Hook]
（3-4行洗脑金句，放在最开头！重复2遍）

[Verse 1]
（6-8行主歌，叙事+画面感）

[Chorus]
（4-6行副歌，朗朗上口，包含金句）

[Verse 2]
（6-8行主歌，情绪递进）

[Hook]
（重复开头的洗脑金句）

[Outro]
（2-3行收尾，正能量）

## 方言要求
- 大量使用${config.name}特色词汇和表达
- 韵脚要符合方言发音
- 可以中英夹杂增加节奏感

请直接输出歌词，不要任何解释。`

  return await generateWithClaude(prompt, {
    maxTokens: 2048,
    temperature: 0.9,
  })
}

testLyricsGeneration().catch(console.error)
