/**
 * 方言类型定义
 * 支持 18+ 种中国方言
 */

/**
 * 方言代码
 */
export type DialectCode =
  | 'mandarin'      // 普通话
  | 'cantonese'     // 粤语
  | 'sichuan'       // 四川话
  | 'dongbei'       // 东北话
  | 'shandong'      // 山东话
  | 'henan'         // 河南话
  | 'shaanxi'       // 陕西话
  | 'wu'            // 吴语（上海话）
  | 'minnan'        // 闽南语
  | 'hakka'         // 客家话
  | 'xiang'         // 湘语（湖南话）
  | 'gan'           // 赣语（江西话）
  | 'jin'           // 晋语（山西话）
  | 'lanyin'        // 兰银官话（甘肃、宁夏）
  | 'jianghuai'     // 江淮官话
  | 'xinan'         // 西南官话（云南、贵州）
  | 'jiaoliao'      // 胶辽官话
  | 'zhongyuan'     // 中原官话
  | 'english'       // 英语

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
 * Fish Audio Voice ID 参考: https://fish.audio
 */
export const DIALECT_CONFIGS: Record<DialectCode, DialectConfig> = {
  mandarin: {
    code: 'mandarin',
    name: '普通话',
    englishName: 'Mandarin',
    region: '全国',
    fishAudioVoiceId: '7f92f8f0-3d6c-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
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
  shandong: {
    code: 'shandong',
    name: '山东话',
    englishName: 'Shandong Dialect',
    region: '山东',
    fishAudioVoiceId: 'b5e7a9f0-3d6d-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  henan: {
    code: 'henan',
    name: '河南话',
    englishName: 'Henan Dialect',
    region: '河南',
    fishAudioVoiceId: 'c8f0b1a0-3d6d-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
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
  wu: {
    code: 'wu',
    name: '吴语',
    englishName: 'Wu Dialect (Shanghainese)',
    region: '上海、江苏、浙江',
    fishAudioVoiceId: 'e3b2d3c0-3d6d-11ee-a7cf-73d704f9a6e0',
    sampleText: '侬好，欢迎来到WhyFire',
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
  hakka: {
    code: 'hakka',
    name: '客家话',
    englishName: 'Hakka Dialect',
    region: '广东、江西、福建',
    fishAudioVoiceId: '05d4f5e0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  xiang: {
    code: 'xiang',
    name: '湘语',
    englishName: 'Xiang Dialect (Hunanese)',
    region: '湖南',
    fishAudioVoiceId: '16e5a6f0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  gan: {
    code: 'gan',
    name: '赣语',
    englishName: 'Gan Dialect',
    region: '江西',
    fishAudioVoiceId: '27f6b7a0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  jin: {
    code: 'jin',
    name: '晋语',
    englishName: 'Jin Dialect',
    region: '山西',
    fishAudioVoiceId: '38a7c8b0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  lanyin: {
    code: 'lanyin',
    name: '兰银官话',
    englishName: 'Lanyin Mandarin',
    region: '甘肃、宁夏',
    fishAudioVoiceId: '49b8d9c0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  jianghuai: {
    code: 'jianghuai',
    name: '江淮官话',
    englishName: 'Jianghuai Mandarin',
    region: '江苏、安徽',
    fishAudioVoiceId: '5ac9e0d0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  xinan: {
    code: 'xinan',
    name: '西南官话',
    englishName: 'Southwestern Mandarin',
    region: '云南、贵州、广西',
    fishAudioVoiceId: '6bd0f1e0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  jiaoliao: {
    code: 'jiaoliao',
    name: '胶辽官话',
    englishName: 'Jiaoliao Mandarin',
    region: '山东、辽宁',
    fishAudioVoiceId: '7ce1a2f0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  zhongyuan: {
    code: 'zhongyuan',
    name: '中原官话',
    englishName: 'Zhongyuan Mandarin',
    region: '河南、陕西、甘肃',
    fishAudioVoiceId: '8df2b3a0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: '你好，欢迎来到WhyFire',
    enabled: true,
  },
  english: {
    code: 'english',
    name: 'English',
    englishName: 'English',
    region: 'International',
    fishAudioVoiceId: '9ea3c4b0-3d6e-11ee-a7cf-73d704f9a6e0',
    sampleText: 'Hello, welcome to WhyFire',
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
