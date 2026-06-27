import type { MenuItemConstructorOptions } from 'electron'
import type { EngineState } from '../shared/types.js'
import type { ControlAction } from '../shared/types.js'

/** PURE: build the tray context-menu template from current state. Testable without Electron. */
export function buildTrayMenu(
  state: EngineState
): MenuItemConstructorOptions[] {
  const startPauseLabel = state.running ? 'Pause' : 'Start'
  const startPauseAction: ControlAction = state.running ? 'pause' : 'start'

  return [
    { label: startPauseLabel, click: () => send(startPauseAction) },
    { type: 'separator' },
    { label: 'Reset', click: () => send('reset') },
    { label: 'Skip', click: () => send('skip') },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ]
}

/** PURE: build the window context-menu template from current state and alwaysOnTop flag. */
export function buildWindowContextMenu(
  state: EngineState,
  isAlwaysOnTop: boolean
): MenuItemConstructorOptions[] {
  const startPauseLabel = state.running ? 'Pause' : 'Start'
  const startPauseAction: ControlAction = state.running ? 'pause' : 'start'
  const alwaysOnTopLabel = isAlwaysOnTop ? 'Cancel Always on Top' : 'Always on Top'

  return [
    { label: alwaysOnTopLabel, click: () => menuDispatch.toggleAlwaysOnTop() },
    { type: 'separator' },
    { label: startPauseLabel, click: () => send(startPauseAction) },
    { label: 'Stop', click: () => send('reset') },
    { label: 'Reset', click: () => send('reset') },
    { type: 'separator' },
    { label: 'Quit', click: () => menuDispatch.quit() }
  ]
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
} = {
  send: () => {},
  toggleAlwaysOnTop: () => {},
  quit: () => {}
}

function send(action: ControlAction): void {
  menuDispatch.send(action)
}
