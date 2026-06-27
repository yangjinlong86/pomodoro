import type { BrowserWindowConstructorOptions } from 'electron'
import type { Phase } from '../shared/types.js'

/**
 * Pure window options for the 100×100 always-on-top frameless work window.
 *
 * The `x`/`y` position is filled in at create-time from the primary display's
 * work area (see `createWorkWindow`), so the static object here omits them.
 * Kept free of any `electron` *runtime* import so unit tests can assert the
 * shape without launching Electron — only the type is imported.
 */
export const WORK_WINDOW_OPTIONS: Omit<BrowserWindowConstructorOptions, 'x' | 'y'> = {
  width: 100,
  height: 100,
  frame: false,
  alwaysOnTop: true,
  resizable: false,
  maximizable: false,
  minimizable: false,
  fullscreenable: false,
  skipTaskbar: true,
  show: false, // shown on 'ready-to-show'
  transparent: true, // allow the circular CSS shape to show through the corners
  backgroundColor: '#00000000', // fully transparent ARGB — required on some platforms
  hasShadow: false,
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    preload: '' // filled in at create-time with the compiled preload path
  }
}

/** Phases for which the work window should be visible (work only). */
export const VISIBLE_PHASES: ReadonlySet<Phase> = new Set<Phase>(['work'])
