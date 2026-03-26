/**
 * 重命名 rap-generator.ts → rap-generator.ts
 *
 * 这个脚本会：
 * 1. 重命名文件
 * 2. 更新所有导入引用
 * 3. 验证编译
 *
 * 运行：npx tsx scripts/rename-rap-generator.ts
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const DRY_RUN = process.argv.includes('--dry-run')

const OLD_NAME = 'rap-generator'
const NEW_NAME = 'rap-generator'
const OLD_FILE = `src/lib/services/${OLD_NAME}.ts`
const NEW_FILE = `src/lib/services/${NEW_NAME}.ts`

console.log('=== Rap Generator 重命名脚本 ===\n')

if (DRY_RUN) {
  console.log('🔍 DRY RUN 模式 - 只显示将要做的更改\n')
}

// 步骤 1: 查找所有引用
console.log('1. 查找引用...')
const grepCommand = `grep -r "${OLD_NAME}" --include="*.ts" --include="*.tsx" --include="*.md" . | grep -v node_modules | grep -v ".git"`
const references = execSync(grepCommand, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
  .split('\n')
  .filter(line => line.trim())

console.log(`   找到 ${references.length} 处引用\n`)

if (references.length === 0) {
  console.log('✓ 没有找到引用，无需重命名')
  process.exit(0)
}

// 显示前 10 个引用
console.log('   前 10 个引用:')
references.slice(0, 10).forEach(ref => {
  console.log(`   - ${ref.substring(0, 100)}`)
})
if (references.length > 10) {
  console.log(`   ... 还有 ${references.length - 10} 个`)
}
console.log('')

// 步骤 2: 重命名文件
console.log('2. 重命名文件...')
if (!existsSync(OLD_FILE)) {
  console.error(`   ✗ 源文件不存在: ${OLD_FILE}`)
  process.exit(1)
}

if (!DRY_RUN) {
  execSync(`git mv "${OLD_FILE}" "${NEW_FILE}"`)
  console.log(`   ✓ ${OLD_FILE} → ${NEW_FILE}\n`)
} else {
  console.log(`   [DRY RUN] ${OLD_FILE} → ${NEW_FILE}\n`)
}

// 步骤 3: 更新所有引用
console.log('3. 更新导入引用...')

const filesToUpdate = new Set<string>()
references.forEach(ref => {
  const match = ref.match(/^([^:]+):/)
  if (match && !match[1].includes('.git')) {
    filesToUpdate.add(match[1])
  }
})

console.log(`   需要更新 ${filesToUpdate.size} 个文件\n`)

const importPatterns = [
  {
    old: `from '@/lib/services/${OLD_NAME}'`,
    new: `from '@/lib/services/${NEW_NAME}'`,
  },
  {
    old: `from '../../lib/services/${OLD_NAME}.js'`,
    new: `from '../../lib/services/${NEW_NAME}.js'`,
  },
  {
    old: `from './${OLD_NAME}'`,
    new: `from './${NEW_NAME}'`,
  },
]

let updatedCount = 0
filesToUpdate.forEach(file => {
  if (file.endsWith('.md')) {
    // Markdown 文件只替换文本
    let content = readFileSync(file, 'utf-8')
    const newContent = content.replace(new RegExp(OLD_NAME, 'g'), NEW_NAME)

    if (content !== newContent) {
      if (!DRY_RUN) {
        writeFileSync(file, newContent)
      }
      updatedCount++
      console.log(`   ✓ ${file}`)
    }
    return
  }

  if (!existsSync(file)) return

  let content = readFileSync(file, 'utf-8')
  let modified = false

  importPatterns.forEach(({ old, new: newPattern }) => {
    if (content.includes(old)) {
      content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPattern)
      modified = true
    }
  })

  // 更新文件名引用（非导入语句）
  if (content.includes(OLD_NAME)) {
    content = content.replace(new RegExp(OLD_NAME, 'g'), NEW_NAME)
    modified = true
  }

  if (modified) {
    if (!DRY_RUN) {
      writeFileSync(file, content)
    }
    updatedCount++
    console.log(`   ✓ ${file}`)
  }
})

console.log(`\n   更新了 ${updatedCount} 个文件\n`)

// 步骤 4: 验证编译
if (!DRY_RUN) {
  console.log('4. 验证 TypeScript 编译...')
  try {
    execSync('npx tsc --noEmit', { encoding: 'utf-8', timeout: 60000 })
    console.log('   ✓ 编译成功\n')
  } catch (error) {
    console.error('   ✗ 编译失败，请检查错误')
    console.error(error)
    process.exit(1)
  }
} else {
  console.log('4. [DRY RUN] 跳过编译验证\n')
}

// 步骤 5: 提交更改
if (!DRY_RUN) {
  console.log('5. 提交更改...')
  execSync('git add -A')
  execSync(`git commit -m "refactor: rename ${OLD_NAME} → ${NEW_NAME}

- Simplify service naming (RVC replaced by Seed-VC)
- Update all import references
- Update documentation

This is part of the migration from RVC to Seed-VC zero-shot voice cloning.`)
  console.log('   ✓ 提交成功\n')
} else {
  console.log('5. [DRY RUN] 跳过 Git 提交\n')
}

console.log('=== 重命名完成 ===\n')

if (DRY_RUN) {
  console.log('提示: 移除 --dry-run 参数以执行实际更改')
} else {
  console.log('下一步:')
  console.log('1. 运行测试: npm test')
  console.log('2. 推送更改: git push')
}
