/**
 * Pure i18n module. No Electron / DOM imports so it's usable in any layer
 * (main, preload, renderer) and unit-testable.
 */

export type Locale = 'en' | 'zh'

export const LOCALES: Locale[] = ['en', 'zh']

export const DEFAULT_LOCALE: Locale = 'en'

export interface Translations {
  /** Localised display name for each locale, used by the language menu. */
  localeName: { en: string; zh: string }

  /** Tray tooltip / notification title prefix. */
  appName: string

  /** Phase labels. */
  phaseWork: string
  phaseShort: string
  phaseLong: string

  /** Tray / window-title prefix shown before the countdown when paused. */
  pausedPrefix: string

  /** Notification body shown on phase transitions. */
  notifyWork: string
  notifyBreak: string

  /** Menu items. */
  pin: string
  unpin: string
  start: string
  pause: string
  reset: string
  skip: string
  size: string
  sizeLarge: string
  sizeMedium: string
  sizeSmall: string
  language: string
  help: string
  quit: string
}

const EN: Translations = {
  localeName: { en: 'English', zh: '中文' },
  appName: 'Pomodoro Timer',
  phaseWork: 'Work',
  phaseShort: 'Short Break',
  phaseLong: 'Long Break',
  pausedPrefix: 'Paused',
  notifyWork: 'Time to focus!',
  notifyBreak: 'Take a break.',
  pin: 'Pin',
  unpin: 'Unpin',
  start: 'Start',
  pause: 'Pause',
  reset: 'Reset',
  skip: 'Skip',
  size: 'Size',
  sizeLarge: 'Large',
  sizeMedium: 'Medium',
  sizeSmall: 'Small',
  language: 'Language',
  help: 'Help',
  quit: 'Quit'
}

const ZH: Translations = {
  localeName: { en: 'English', zh: '中文' },
  appName: '番茄钟',
  phaseWork: '工作',
  phaseShort: '短休息',
  phaseLong: '长休息',
  pausedPrefix: '已暂停',
  notifyWork: '开始专注吧！',
  notifyBreak: '休息一下。',
  pin: '置顶',
  unpin: '取消置顶',
  start: '开始',
  pause: '暂停',
  reset: '重置',
  skip: '跳过',
  size: '尺寸',
  sizeLarge: '大',
  sizeMedium: '中',
  sizeSmall: '小',
  language: '语言',
  help: '帮助',
  quit: '退出'
}

const TABLE: Record<Locale, Translations> = { en: EN, zh: ZH }

/** PURE: pick the translation dictionary for a locale, falling back to English. */
export function t(locale: Locale = DEFAULT_LOCALE): Translations {
  return TABLE[locale] ?? EN
}

/** PURE: narrow an unknown value to a supported Locale, or undefined. */
export function asLocale(value: unknown): Locale | undefined {
  return value === 'en' || value === 'zh' ? value : undefined
}
