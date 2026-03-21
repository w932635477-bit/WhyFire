/**
 * 方言类型定义 v2.0
 * 精简为 8 种核心方言，配合 CosyVoice API
 *
 * @deprecated 旧版本见 dialect.ts
 */

/**
 * 方言代码（精简版）
 * 仅保留 8 种核心方言
 */
export type DialectCodeV2 =
  | 'mandarin'      // 普通话
  | 'cantonese'     // 粤语
  | 'sichuan'       // 四川话
  | 'dongbei'       // 东北话
  | 'shandong'      // 山东话
  | 'shanghai'      // 上海话
  | 'henan'         // 河南话
  | 'hunan'         // 湖南话

/**
 * 方言配置
 */
export interface DialectConfigV2 {
  code: DialectCodeV2
  name: string
  englishName: string
  region: string
  /** CosyVoice 对应的 voiceId */
  cosyVoiceId: string
  /** 用于测试的样本文本 */
  sampleText: string
  /** 是否启用 */
  enabled: boolean
}

/**
 * CosyVoice Voice ID 映射
 * 参考: https://help.aliyun.com/zh/model-studio/developer-reference/cosyvoice-api
 */
export const COSYVOICE_VOICE_IDS: Record<DialectCodeV2, string> = {
  mandarin: 'longxiaochun',      // 普通话 - 龙小春
  cantonese: 'longyue',          // 粤语 - 龙悦
  sichuan: 'longxiaochun',       // 四川话 - 使用普通话模型 + 方言文本
  dongbei: 'longxiaochun',       // 东北话 - 使用普通话模型 + 方言文本
  shandong: 'longxiaochun',      // 山东话 - 使用普通话模型 + 方言文本
  shanghai: 'longxiaochun',      // 上海话 - 使用普通话模型 + 方言文本
  henan: 'longxiaochun',         // 河南话 - 使用普通话模型 + 方言文本
  hunan: 'longxiaochun',         // 湖南话 - 使用普通话模型 + 方言文本
}

/**
 * 所有方言配置（精简版 - 8 种方言）
 */
export const DIALECT_CONFIGS_V2: Record<DialectCodeV2, DialectConfigV2> = {
  mandarin: {
    code: 'mandarin',
    name: '普通话',
    englishName: 'Mandarin',
    region: '全国',
    cosyVoiceId: COSYVOICE_VOICE_IDS.mandarin,
    sampleText: '你好，欢迎来到方言说唱',
    enabled: true,
  },
  cantonese: {
    code: 'cantonese',
    name: '粤语',
    englishName: 'Cantonese',
    region: '广东、香港、澳门',
    cosyVoiceId: COSYVOICE_VOICE_IDS.cantonese,
    sampleText: '你好，欢迎嚟到方言说唱',
    enabled: true,
  },
  sichuan: {
    code: 'sichuan',
    name: '四川话',
    englishName: 'Sichuan Dialect',
    region: '四川、重庆',
    cosyVoiceId: COSYVOICE_VOICE_IDS.sichuan,
    sampleText: '你好，欢迎来到方言说唱嘛',
    enabled: true,
  },
  dongbei: {
    code: 'dongbei',
    name: '东北话',
    englishName: 'Northeastern Dialect',
    region: '东北三省',
    cosyVoiceId: COSYVOICE_VOICE_IDS.dongbei,
    sampleText: '你好，欢迎来到方言说唱啊',
    enabled: true,
  },
  shandong: {
    code: 'shandong',
    name: '山东话',
    englishName: 'Shandong Dialect',
    region: '山东',
    cosyVoiceId: COSYVOICE_VOICE_IDS.shandong,
    sampleText: '你好，欢迎来到方言说唱',
    enabled: true,
  },
  shanghai: {
    code: 'shanghai',
    name: '上海话',
    englishName: 'Shanghainese',
    region: '上海',
    cosyVoiceId: COSYVOICE_VOICE_IDS.shanghai,
    sampleText: '侬好，欢迎来到方言说唱',
    enabled: true,
  },
  henan: {
    code: 'henan',
    name: '河南话',
    englishName: 'Henan Dialect',
    region: '河南',
    cosyVoiceId: COSYVOICE_VOICE_IDS.henan,
    sampleText: '你好，欢迎来到方言说唱',
    enabled: true,
  },
  hunan: {
    code: 'hunan',
    name: '湖南话',
    englishName: 'Hunanese',
    region: '湖南',
    cosyVoiceId: COSYVOICE_VOICE_IDS.hunan,
    sampleText: '你好，欢迎来到方言说唱',
    enabled: true,
  },
}

/**
 * 获取启用的方言列表
 */
export function getEnabledDialectsV2(): DialectConfigV2[] {
  return Object.values(DIALECT_CONFIGS_V2).filter(d => d.enabled)
}

/**
 * 获取方言配置
 */
export function getDialectConfigV2(code: DialectCodeV2): DialectConfigV2 | undefined {
  return DIALECT_CONFIGS_V2[code]
}

/**
 * 方言名称映射（用于 UI 显示）
 */
export const DIALECT_LABELS_V2: Record<DialectCodeV2, string> = {
  mandarin: '普通话',
  cantonese: '粤语',
  sichuan: '四川话',
  dongbei: '东北话',
  shandong: '山东话',
  shanghai: '上海话',
  henan: '河南话',
  hunan: '湖南话',
}

/**
 * 方言代码列表（用于迭代）
 */
export const DIALECT_CODES_V2: DialectCodeV2[] = [
  'mandarin',
  'cantonese',
  'sichuan',
  'dongbei',
  'shandong',
  'shanghai',
  'henan',
  'hunan',
]

/**
 * 验证方言代码是否有效
 */
export function isValidDialectCodeV2(code: string): code is DialectCodeV2 {
  return DIALECT_CODES_V2.includes(code as DialectCodeV2)
}

/**
 * 解析方言代码，如果无效则返回默认值
 */
export function parseDialectCodeV2(code: string, defaultValue: DialectCodeV2 = 'mandarin'): DialectCodeV2 {
  return isValidDialectCodeV2(code) ? code : defaultValue
}
