/**
 * 安全命令执行工具
 * 防止命令注入攻击
 */

import { spawn } from 'child_process'

/**
 * 安全执行命令选项
 */
export interface SafeExecOptions {
  /** 超时时间 (毫秒) */
  timeout?: number
  /** 环境变量 */
  env?: Record<string, string>
  /** 工作目录 */
  cwd?: string
  /** 是否抛出错误 */
  throwOnError?: boolean
}

/**
 * 安全执行命令结果
 */
export interface SafeExecResult {
  stdout: string
  stderr: string
  exitCode: number
  success: boolean
}

/**
 * 验证路径安全性
 * 防止路径遍历攻击
 */
export function validatePath(path: string): boolean {
  // 不允许空路径
  if (!path || path.trim() === '') {
    return false
  }

  // 不允许路径遍历
  if (path.includes('..')) {
    return false
  }

  // 不允许 null 字节
  if (path.includes('\0')) {
    return false
  }

  // 不允许命令替换字符
  const dangerousChars = ['`', '$', '(', ')', '{', '}', '[', ']', ';', '|', '&', '<', '>', '\n', '\r']
  for (const char of dangerousChars) {
    if (path.includes(char)) {
      return false
    }
  }

  return true
}

/**
 * 验证用户 ID 安全性
 */
export function validateUserId(userId: string): boolean {
  // 只允许字母、数字、下划线、连字符
  const validPattern = /^[a-zA-Z0-9_-]+$/
  return validPattern.test(userId) && userId.length <= 128
}

/**
 * 安全地转义 shell 参数
 */
export function escapeShellArg(arg: string): string {
  // 使用单引号包裹，并转义内部的单引号
  return `'${arg.replace(/'/g, "'\\''")}'`
}

/**
 * 安全执行命令
 * 使用 spawn 替代 execSync，避免命令注入
 */
export async function safeExec(
  command: string,
  args: string[],
  options: SafeExecOptions = {}
): Promise<SafeExecResult> {
  const {
    timeout = 60000,
    env = process.env,
    cwd,
    throwOnError = false,
  } = options

  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      env,
      shell: false, // 不使用 shell，防止命令注入
      timeout,
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      const result: SafeExecResult = {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? 1,
        success: code === 0,
      }

      if (throwOnError && code !== 0) {
        reject(new Error(`Command failed with exit code ${code}: ${stderr}`))
      } else {
        resolve(result)
      }
    })

    proc.on('error', (err) => {
      if (throwOnError) {
        reject(err)
      } else {
        resolve({
          stdout: '',
          stderr: err.message,
          exitCode: 1,
          success: false,
        })
      }
    })
  })
}

/**
 * 安全执行 ffprobe 命令
 */
export async function safeFfprobe(inputPath: string): Promise<SafeExecResult> {
  if (!validatePath(inputPath)) {
    return {
      stdout: '',
      stderr: 'Invalid input path',
      exitCode: 1,
      success: false,
    }
  }

  return safeExec('ffprobe', [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    inputPath,
  ])
}

/**
 * 安全执行 ffmpeg 命令
 */
export async function safeFfmpeg(
  inputPath: string,
  outputPath: string,
  args: string[]
): Promise<SafeExecResult> {
  if (!validatePath(inputPath) || !validatePath(outputPath)) {
    return {
      stdout: '',
      stderr: 'Invalid path',
      exitCode: 1,
      success: false,
    }
  }

  return safeExec('ffmpeg', [
    '-i', inputPath,
    ...args,
    '-y', // 覆盖输出文件
    outputPath,
  ])
}

/**
 * 获取音频时长（秒）
 */
export async function getAudioDuration(audioPath: string): Promise<number> {
  const result = await safeFfprobe(audioPath)

  if (!result.success) {
    return 0
  }

  try {
    const data = JSON.parse(result.stdout)
    return parseFloat(data.format?.duration) || 0
  } catch {
    return 0
  }
}
