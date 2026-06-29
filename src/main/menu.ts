import type { MenuItemConstructorOptions } from 'electron'
import type { EngineState, WindowSize } from '../shared/types.js'
import type { ControlAction } from '../shared/types.js'
import { t, LOCALES, type Locale } from '../shared/i18n.js'

function buildMenu(
  state: EngineState,
  isAlwaysOnTop: boolean,
  currentSize: WindowSize,
  locale: Locale,
  version: string
): MenuItemConstructorOptions[] {
  const d = t(locale)

  const startPauseLabel = state.running ? d.pause : d.start
  const startPauseAction: ControlAction = state.running ? 'pause' : 'start'
  const alwaysOnTopLabel = isAlwaysOnTop ? d.unpin : d.pin

  const items: MenuItemConstructorOptions[] = [
    { label: alwaysOnTopLabel, click: () => menuDispatch.toggleAlwaysOnTop() },
    { type: 'separator' },
    { label: startPauseLabel, click: () => send(startPauseAction) },
    { label: d.reset, click: () => send('reset') },
    { label: d.skip, click: () => send('skip') },
    { type: 'separator' },
    {
      label: d.size,
      submenu: [
        { label: d.sizeLarge, type: 'radio', checked: currentSize === 'large', click: () => menuDispatch.setWindowSize('large') },
        { label: d.sizeMedium, type: 'radio', checked: currentSize === 'medium', click: () => menuDispatch.setWindowSize('medium') },
        { label: d.sizeSmall, type: 'radio', checked: currentSize === 'small', click: () => menuDispatch.setWindowSize('small') }
      ]
    },
    {
      label: d.language,
      submenu: LOCALES.map((loc) => ({
        label: d.localeName[loc],
        type: 'radio',
        checked: locale === loc,
        click: () => menuDispatch.setLocale(loc)
      }))
    },
    { type: 'separator' },
    { label: d.help, click: () => menuDispatch.openHelp() },
    { label: d.quit, click: () => menuDispatch.quit() }
  ]

  if (version) {
    items.push({ type: 'separator' })
    items.push({ label: `${d.appName} V${version}`, enabled: false })
  }

  return items
}

/** PURE: build the tray context-menu template from current state. Testable without Electron. */
export function buildTrayMenu(
  state: EngineState,
  isAlwaysOnTop: boolean,
  currentSize: WindowSize,
  locale: Locale = 'en',
  version = ''
): MenuItemConstructorOptions[] {
  return buildMenu(state, isAlwaysOnTop, currentSize, locale, version)
}

/** PURE: build the window context-menu template from current state, alwaysOnTop flag, and window size. */
export function buildWindowContextMenu(
  state: EngineState,
  isAlwaysOnTop: boolean,
  currentSize: WindowSize,
  locale: Locale = 'en',
  version = ''
): MenuItemConstructorOptions[] {
  return buildMenu(state, isAlwaysOnTop, currentSize, locale, version)
}

/**
 * Indirection so tests can capture which action a menu click would dispatch.
 * `main/index.ts` sets this to the real dispatch function at startup; tests
 * read it back to assert the menu wires the right actions.
 */
export const menuDispatch: {
  send: (action: ControlAction) => void
  toggleAlwaysOnTop: () => void
  quit: () => void
  setWindowSize: (size: WindowSize) => void
  setLocale: (locale: Locale) => void
  openHelp: () => void
} = {
  send: () => {},
  toggleAlwaysOnTop: () => {},
  quit: () => {},
  setWindowSize: () => {},
  setLocale: () => {},
  openHelp: () => {}
}

function send(action: ControlAction): void {
  menuDispatch.send(action)
}
