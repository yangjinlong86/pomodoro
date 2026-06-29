import { app, ipcMain, Menu, Notification, screen, shell } from 'electron'
import { PomodoroEngine } from '../timer/PomodoroEngine.js'
import { phaseLabel } from '../shared/config.js'
import {
  CONTROL,
  DRAG_WINDOW,
  LOCALE_UPDATE,
  SHOW_CONTEXT_MENU,
  STATE_UPDATE,
  WINDOW_RESIZE
} from '../shared/ipc-channels.js'
import type { ControlAction, Phase, WindowSize } from '../shared/types.js'
import { t, type Locale } from '../shared/i18n.js'
import { createWorkWindow, getWorkWindow } from './window.js'
import { createTray, destroyTray, updateTray } from './tray.js'
import { visibilityForPhase, windowTitleForPhase } from './visibility.js'
import { buildWindowContextMenu, menuDispatch } from './menu.js'
import { loadSettings, saveSettings, settingsFilePath } from './settings.js'

const engine = new PomodoroEngine()
let tickInterval: NodeJS.Timeout | null = null
let previousPhase: Phase | null = null

let currentSize: WindowSize = 'small'
let currentLocale: Locale = 'en'
let settingsFile = ''

const SIZE_DIMENSIONS: Record<WindowSize, { width: number; height: number }> = {
  small: { width: 100, height: 100 },
  medium: { width: 150, height: 150 },
  large: { width: 300, height: 300 }
}

function applyWindowSize(size: WindowSize, keepPosition = false): void {
  const win = getWorkWindow()
  if (!win || win.isDestroyed()) return
  const { width, height } = SIZE_DIMENSIONS[size]
  const area = screen.getPrimaryDisplay().workArea

  let x: number
  let y: number
  if (keepPosition) {
    // Resize in place: keep the current top-left corner, clamped so the
    // resized window stays fully within the work area.
    const [curX, curY] = win.getPosition()
    x = Math.min(Math.max(area.x, curX), area.x + area.width - width)
    y = Math.min(Math.max(area.y, curY), area.y + area.height - height)
  } else {
    // Initial placement: dock to the top-right corner.
    x = Math.max(0, area.x + area.width - width)
    y = area.y
  }

  // Linux window managers may refuse to shrink a non-resizable window.
  // Temporarily enable resizing, apply bounds, then restore.
  win.setResizable(true)
  win.setBounds({ x, y, width, height })
  win.setResizable(false)

  win.webContents.send(WINDOW_RESIZE, size)
}

function dispatch(action: ControlAction): void {
  switch (action) {
    case 'start':
      if (engine.isPaused()) {
        engine.resume()
      } else {
        engine.start()
      }
      break
    case 'pause':
      engine.pause()
      break
    case 'resume':
      engine.resume()
      break
    case 'reset':
      engine.reset()
      break
    case 'skip':
      engine.skip()
      break
  }
  publish()
}

function notifyPhaseChange(phase: Phase): void {
  const d = t(currentLocale)
  const body = phase === 'work' ? d.notifyWork : d.notifyBreak
  try {
    new Notification({ title: phaseLabel(phase, currentLocale), body }).show()
  } catch {
    // Notifications unavailable (e.g. headless); ignore.
  }
}

function applyVisibility(phase: Phase): void {
  let win = getWorkWindow()
  if (!win || win.isDestroyed()) {
    win = createWorkWindow()
    applyWindowSize(currentSize)
  }
  if (visibilityForPhase(phase) === 'show') {
    win.setTitle(windowTitleForPhase(phase, currentLocale))
    if (!win.isVisible()) win.show()
  } else {
    if (win.isVisible()) win.hide()
  }
}

function publish(): void {
  const state = engine.tick()
  const win = getWorkWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(STATE_UPDATE, state)
  }
  updateTray(state, win?.isAlwaysOnTop() ?? true, currentSize, currentLocale)

  if (previousPhase !== null && previousPhase !== state.phase) {
    notifyPhaseChange(state.phase)
  }
  applyVisibility(state.phase)
  previousPhase = state.phase
}

function applyLocale(locale: Locale): void {
  if (locale === currentLocale) return
  currentLocale = locale
  saveSettings(settingsFile, { locale })

  const win = getWorkWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(LOCALE_UPDATE, locale)
    if (visibilityForPhase(engine.getPhase()) === 'show') {
      win.setTitle(windowTitleForPhase(engine.getPhase(), locale))
    }
  }
  // Force the tray to rebuild its menu/tooltip on the next publish.
  publish()
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Keep only one instance.
  })

  app.whenReady().then(() => {
    settingsFile = settingsFilePath(app.getPath('userData'))
    currentLocale = loadSettings(settingsFile).locale

    createTray(engine.getState(), dispatch, () => {
      // Clicking the tray icon reveals the work window if currently in a work phase.
      if (engine.getPhase() === 'work') {
        getWorkWindow()?.show()
      }
    }, true, currentSize, currentLocale)
    createWorkWindow()
    applyWindowSize(currentSize)

    menuDispatch.toggleAlwaysOnTop = () => {
      const w = getWorkWindow()
      if (w) w.setAlwaysOnTop(!w.isAlwaysOnTop())
    }
    menuDispatch.quit = () => app.quit()
    menuDispatch.setWindowSize = (size) => {
      currentSize = size
      applyWindowSize(size, true)
    }
    menuDispatch.setLocale = (locale) => {
      applyLocale(locale)
    }
    menuDispatch.openHelp = () => {
      void shell.openExternal('https://github.com/yangjinlong86/pomodoro')
    }

    // Publish initial state, then tick every second.
    publish()
    tickInterval = setInterval(publish, 1000)

    // Push the initial locale to the renderer as soon as it's loaded.
    const w = getWorkWindow()
    if (w) {
      w.webContents.on('did-finish-load', () => {
        w.webContents.send(LOCALE_UPDATE, currentLocale)
      })
    }

    ipcMain.on(CONTROL, (_event, action: ControlAction) => dispatch(action))

    ipcMain.on(SHOW_CONTEXT_MENU, () => {
      const w = getWorkWindow()
      if (!w) return
      const state = engine.getState()
      const template = buildWindowContextMenu(
        state,
        w.isAlwaysOnTop(),
        currentSize,
        currentLocale,
        app.getVersion()
      )
      Menu.buildFromTemplate(template).popup({ window: w })
    })

    ipcMain.on(DRAG_WINDOW, (_event, dx: number, dy: number) => {
      const w = getWorkWindow()
      if (!w) return
      const [x, y] = w.getPosition()
      w.setPosition(x + dx, y + dy)
    })
  })

  app.on('window-all-closed', (e: Event) => {
    // Do NOT quit when the window closes — the tray keeps the app alive.
    e.preventDefault()
  })

  app.on('before-quit', () => {
    if (tickInterval) clearInterval(tickInterval)
    tickInterval = null
    destroyTray()
  })
}
