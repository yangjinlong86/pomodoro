import { Tray, Menu, nativeImage } from 'electron'
import { buildTrayMenu, menuDispatch } from './menu.js'
import { trayLabel } from './visibility.js'
import type { EngineState } from '../shared/types.js'
import type { ControlAction } from '../shared/types.js'

let tray: Tray | null = null
let lastMenuRunning: boolean | null = null
let lastToolTip = ''

/**
 * A tiny 16x16 tomato-red PNG generated in-memory (no asset file needed for MVP).
 * Verified valid PNG: IHDR + IDAT + IEND with correct CRCs.
 */
function makeIcon(): ReturnType<typeof nativeImage.createFromBuffer> {
  const size = 16
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGUlEQVR4nGO4Y2PznxLM' +
      'MGrAqAGjBgwXAwCuWFMfG2uhAwAAAABJRU5ErkJggg==',
    'base64'
  )
  return nativeImage.createFromBuffer(png).resize({ width: size, height: size })
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
