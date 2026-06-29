import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { asLocale, DEFAULT_LOCALE, type Locale } from '../shared/i18n.js'

export interface Settings {
  locale: Locale
}

const DEFAULTS: Settings = {
  locale: DEFAULT_LOCALE
}

/**
 * Load settings from `<file>`. Returns defaults on any error (missing file,
 * malformed JSON, unknown locale, etc.) so the app never fails to boot on a
 * corrupt config.
 */
export function loadSettings(file: string): Settings {
  try {
    const raw = readFileSync(file, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      locale: asLocale(parsed.locale) ?? DEFAULTS.locale
    }
  } catch {
    return { ...DEFAULTS }
  }
}

/** Write settings atomically-ish; ensure the directory exists first. */
export function saveSettings(file: string, settings: Settings): void {
  try {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(settings, null, 2), 'utf-8')
  } catch {
    // Swallow: persistence is best-effort, the app should keep running.
  }
}

/** PURE: derive the settings file path inside the user-data directory. */
export function settingsFilePath(userDataDir: string): string {
  return join(userDataDir, 'settings.json')
}
