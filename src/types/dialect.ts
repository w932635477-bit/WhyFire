/**
 * 方言类型定义
 * 支持 9 种方言（原声 + 8 种阿里云 Qwen-TTS + CosyVoice 原生支持的方言）
 */

/**
 * 方言代码
 * original = 原声（不使用方言指令，保留用户原始声音特色，项目默认选项）
 */
export type DialectCode =
  | 'original'      // 原声（用户声音本色，默认）
  | 'cantonese'     // 粤语
  | 'sichuan'       // 四川话
  | 'dongbei'       // 东北话
  | 'wu'            // 吴语（上海话）
  | 'shaanxi'       // 陕西话
  | 'minnan'        // 闽南语
  | 'tianjin'       // 天津话
  | 'nanjing'       // 南京话

/**
 * 方言配置
 */
export interface DialectConfig {
  code: DialectCode
  name: string
  englishName: string
  region: string
  fishAudioVoiceId: string
  sampleText: string
  enabled: boolean
}

/**
 * 所有方言配置
 * 只包含阿里云 Qwen-TTS + CosyVoice 原生支持的方言
 */
export const DIALECT_CONFIGS: Record<DialectCode, DialectConfig> = {
  original: {
    code: 'original',
    name: '原声',
    englishName: 'Original Voice',
    region: '本色',
    fishAudioVoiceId: '00000000-0000-0000-0000-000000000000',
    sampleText: '使用你的原始声音',
    enabled: true,
  },
  cantonese: {
    code: 'cantonese',
    name: '粤语',
    englishName: 'Cantonese',
    region: '广东、香港、澳门',
    fishAudioVoiceId: '54a01c20-3d6d-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎嚟到WhyFire',
    enabled: true,
  },
  sichuan: {
    code: 'sichuan',
    name: '四川话',
    englishName: 'Sichuan Dialect',
    region: '四川、重庆',
    fishAudioVoiceId: '8f3b5f10-3d6d-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire嘛',
    enabled: true,
  },
  dongbei: {
    code: 'dongbei',
    name: '东北话',
    englishName: 'Northeastern Dialect',
    region: '东北三省',
    fishAudioVoiceId: 'a1c4d8e0-3d6d-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire啊',
    enabled: true,
  },
  wu: {
    code: 'wu',
    name: '上海话',
    englishName: 'Shanghainese (Wu Dialect)',
    region: '上海、江苏、浙江',
    fishAudioVoiceId: 'e3b2d3c0-3d6d-11ee-a7cf-73d704f9a6e0',
    sampleText: '侬好，欢迎来到WhyFire',
    enabled: true,
  },
  shaanxi: {
    code: 'shaanxi',
    name: '陕西话',
    englishName: 'Shaanxi Dialect',
    region: '陕西',
    fishAudioVoiceId: 'd2a1c2b0-3d6d-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  minnan: {
    code: 'minnan',
    name: '闽南语',
    englishName: 'Minnan Dialect',
    region: '福建、台湾',
    fishAudioVoiceId: 'f4c3e4d0-3d6d-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  tianjin: {
    code: 'tianjin',
    name: '天津话',
    englishName: 'Tianjin Dialect',
    region: '天津',
    fishAudioVoiceId: 'a1b2c3d0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '您好，欢迎来到WhyFire',
    enabled: true,
  },
  nanjing: {
    code: 'nanjing',
    name: '南京话',
    englishName: 'Nanjing Dialect',
    region: '江苏南京',
    fishAudioVoiceId: 'b2c3d4e0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
}

/**
 * 获取启用的方言列表
 */
export function getEnabledDialects(): DialectConfig[] {
  return Object.values(DIALECT_CONFIGS).filter(d => d.enabled)
}

/**
 * 获取方言配置
 */
export function getDialectConfig(code: DialectCode): DialectConfig | undefined {
  return DIALECT_CONFIGS[code]
}

/**
 * 方言名称映射（用于 UI 显示）
 */
export const DIALECT_LABELS: Record<DialectCode, string> = Object.fromEntries(
  Object.entries(DIALECT_CONFIGS).map(([code, config]) => [code, config.name])
) as Record<DialectCode, string>

/**
 * Fish Audio Voice ID 映射
 */
export const DIALECT_VOICE_MAP: Record<DialectCode, string> = Object.fromEntries(
  Object.entries(DIALECT_CONFIGS).map(([code, config]) => [code, config.fishAudioVoiceId])
) as Record<DialectCode, string>
