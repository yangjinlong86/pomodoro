import { join } from 'node:path'
import { app, Tray, Menu, nativeImage } from 'electron'
import { buildTrayMenu, menuDispatch } from './menu.js'
import { trayLabel } from './visibility.js'
import type { EngineState, ControlAction, WindowSize } from '../shared/types.js'

let tray: Tray | null = null
let lastMenuRunning: boolean | null = null
let lastAlwaysOnTop: boolean | null = null
let lastSize: WindowSize | null = null
let lastToolTip = ''

function makeIcon(): ReturnType<typeof nativeImage.createFromBuffer> {
  const iconPath = join(app.getAppPath(), 'images', 'pomodoro-timer.jpg')
  const img = nativeImage.createFromPath(iconPath)
  return img.resize({ width: 16, height: 16 })
}

export function createTray(
  state: EngineState,
  dispatch: (action: ControlAction) => void,
  onClick: () => void,
  isAlwaysOnTop: boolean,
  currentSize: WindowSize
): Tray {
  menuDispatch.send = dispatch
  tray = new Tray(makeIcon())
  tray.setToolTip('Pomodoro')
  tray.on('click', onClick)
  updateTray(state, isAlwaysOnTop, currentSize)
  return tray
}

export function updateTray(
  state: EngineState,
  isAlwaysOnTop: boolean,
  currentSize: WindowSize
): void {
  if (!tray) return
  // Only rebuild the context menu when a label or checked state would change.
  // Rebuilding every second while the menu is open causes click events to be lost.
  if (
    state.running !== lastMenuRunning ||
    isAlwaysOnTop !== lastAlwaysOnTop ||
    currentSize !== lastSize
  ) {
    lastMenuRunning = state.running
    lastAlwaysOnTop = isAlwaysOnTop
    lastSize = currentSize
    tray.setContextMenu(Menu.buildFromTemplate(buildTrayMenu(state, isAlwaysOnTop, currentSize)))
  }
  // Only update tooltip when the text actually changes.
  // Calling setToolTip every second while the context menu is open can cause flicker.
  const tip = trayLabel(state)
  if (tip !== lastToolTip) {
    lastToolTip = tip
    tray.setToolTip(tip)
  }
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}
