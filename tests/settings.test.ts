import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadSettings, saveSettings, settingsFilePath } from '../src/main/settings.js'

let dir = ''
let file = ''

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'pomodoro-settings-'))
  file = settingsFilePath(dir)
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('settings', () => {
  it('returns the default locale when the file is missing', () => {
    expect(loadSettings(file)).toEqual({ locale: 'en' })
  })

  it('round-trips a saved locale', () => {
    saveSettings(file, { locale: 'zh' })
    expect(existsSync(file)).toBe(true)
    expect(loadSettings(file)).toEqual({ locale: 'zh' })
  })

  it('falls back to the default locale when the value is unknown', () => {
    writeFileSync(file, JSON.stringify({ locale: 'fr' }), 'utf-8')
    expect(loadSettings(file)).toEqual({ locale: 'en' })
  })

  it('falls back to defaults on malformed JSON', () => {
    writeFileSync(file, '{not json', 'utf-8')
    expect(loadSettings(file)).toEqual({ locale: 'en' })
  })

  it('writes pretty JSON the user can inspect', () => {
    saveSettings(file, { locale: 'zh' })
    const raw = readFileSync(file, 'utf-8')
    expect(raw).toContain('\n')
    expect(JSON.parse(raw)).toEqual({ locale: 'zh' })
  })

  it('settingsFilePath joins the file name onto userData', () => {
    expect(settingsFilePath('/tmp/pomodoro')).toBe('/tmp/pomodoro/settings.json')
  })
})
