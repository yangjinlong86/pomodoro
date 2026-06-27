import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { WORK_WINDOW_OPTIONS } from './window-options.js'

let workWindow: BrowserWindow | null = null

export function createWorkWindow(): BrowserWindow {
  if (workWindow && !workWindow.isDestroyed()) return workWindow

  const area = screen.getPrimaryDisplay().workArea
  // Position top-right of the work area, leaving the 300x300 window fully on screen.
  const x = Math.max(0, area.x + area.width - WORK_WINDOW_OPTIONS.width)
  const y = area.y

  workWindow = new BrowserWindow({
    ...WORK_WINDOW_OPTIONS,
    x,
    y,
    webPreferences: {
      ...WORK_WINDOW_OPTIONS.webPreferences,
      preload: join(__dirname, '../preload/index.cjs')
    }
  })

  workWindow.on('ready-to-show', () => {
    // Actual show/hide is driven by phase visibility in index.ts; only show if work.
  })

  // Load the built renderer.
  if (process.env.ELECTRON_RENDERER_URL) {
    void workWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void workWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return workWindow
}

export function getWorkWindow(): BrowserWindow | null {
  return workWindow && !workWindow.isDestroyed() ? workWindow : null
}
