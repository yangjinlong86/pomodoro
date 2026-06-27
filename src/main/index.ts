import { app, ipcMain, Menu, Notification } from 'electron'
import { PomodoroEngine } from '../timer/PomodoroEngine.js'
import { PHASE_LABEL } from '../shared/config.js'
import { CONTROL, DRAG_WINDOW, SHOW_CONTEXT_MENU, STATE_UPDATE } from '../shared/ipc-channels.js'
import type { ControlAction, Phase } from '../shared/types.js'
import { createWorkWindow, getWorkWindow } from './window.js'
import { createTray, destroyTray, updateTray } from './tray.js'
import { visibilityForPhase, windowTitleForPhase } from './visibility.js'
import { buildWindowContextMenu, menuDispatch } from './menu.js'

const engine = new PomodoroEngine()
let tickInterval: NodeJS.Timeout | null = null
let previousPhase: Phase | null = null

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
  const body = phase === 'work' ? 'Time to focus!' : 'Take a break.'
  try {
    new Notification({ title: PHASE_LABEL[phase], body }).show()
  } catch {
    // Notifications unavailable (e.g. headless); ignore.
  }
}

function applyVisibility(phase: Phase): void {
  let win = getWorkWindow()
  if (!win || win.isDestroyed()) {
    win = createWorkWindow()
  }
  if (visibilityForPhase(phase) === 'show') {
    win.setTitle(windowTitleForPhase(phase))
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
  updateTray(state)

  if (previousPhase !== null && previousPhase !== state.phase) {
    notifyPhaseChange(state.phase)
  }
  applyVisibility(state.phase)
  previousPhase = state.phase
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Keep only one instance.
  })

  app.whenReady().then(() => {
    createTray(engine.getState(), dispatch, () => {
      // Clicking the tray icon reveals the work window if currently in a work phase.
      if (engine.getPhase() === 'work') {
        getWorkWindow()?.show()
      }
    })
    const win = createWorkWindow()

    menuDispatch.toggleAlwaysOnTop = () => {
      const w = getWorkWindow()
      if (w) w.setAlwaysOnTop(!w.isAlwaysOnTop())
    }
    menuDispatch.quit = () => app.quit()

    // Publish initial state, then tick every second.
    publish()
    tickInterval = setInterval(publish, 1000)

    ipcMain.on(CONTROL, (_event, action: ControlAction) => dispatch(action))

    ipcMain.on(SHOW_CONTEXT_MENU, () => {
      const w = getWorkWindow()
      if (!w) return
      const state = engine.getState()
      const template = buildWindowContextMenu(state, w.isAlwaysOnTop())
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
