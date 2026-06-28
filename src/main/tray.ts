import { join } from 'node:path'
import { app, Tray, Menu, nativeImage } from 'electron'
import { buildTrayMenu, menuDispatch } from './menu.js'
import { trayLabel } from './visibility.js'
import type { EngineState } from '../shared/types.js'
import type { ControlAction } from '../shared/types.js'

let tray: Tray | null = null
let lastMenuRunning: boolean | null = null
let lastToolTip = ''

function makeIcon(): ReturnType<typeof nativeImage.createFromBuffer> {
  const iconPath = join(app.getAppPath(), 'images', 'pomodoro-timer.jpg')
  const img = nativeImage.createFromPath(iconPath)
  return img.resize({ width: 16, height: 16 })
}

export function createTray(
  state: EngineState,
  dispatch: (action: ControlAction) => void,
  onClick: () => void
): Tray {
  menuDispatch.send = dispatch
  tray = new Tray(makeIcon())
  tray.setToolTip('Pomodoro')
  tray.on('click', onClick)
  updateTray(state)
  return tray
}

export function updateTray(state: EngineState): void {
  if (!tray) return
  // Only rebuild the context menu when Start/Pause label would change.
  // Rebuilding every second while the menu is open causes click events to be lost.
  if (state.running !== lastMenuRunning) {
    lastMenuRunning = state.running
    tray.setContextMenu(Menu.buildFromTemplate(buildTrayMenu(state)))
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
