import { contextBridge, ipcRenderer } from 'electron'
import { CONTROL, DRAG_WINDOW, SHOW_CONTEXT_MENU, STATE_UPDATE, WINDOW_RESIZE } from '../shared/ipc-channels.js'
import type { ControlAction, EngineState, WindowSize } from '../shared/types.js'

const api = {
  onStateChange(cb: (state: EngineState) => void): () => void {
    const listener = (_event: unknown, state: EngineState): void => cb(state)
    ipcRenderer.on(STATE_UPDATE, listener)
    return () => ipcRenderer.removeListener(STATE_UPDATE, listener)
  },
  sendControl(action: ControlAction): void {
    ipcRenderer.send(CONTROL, action)
  },
  showContextMenu(): void {
    ipcRenderer.send(SHOW_CONTEXT_MENU)
  },
  dragWindow(dx: number, dy: number): void {
    ipcRenderer.send(DRAG_WINDOW, dx, dy)
  },
  onWindowResize(cb: (size: WindowSize) => void): () => void {
    const listener = (_event: unknown, size: WindowSize): void => cb(size)
    ipcRenderer.on(WINDOW_RESIZE, listener)
    return () => ipcRenderer.removeListener(WINDOW_RESIZE, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type PomodoroApi = typeof api
