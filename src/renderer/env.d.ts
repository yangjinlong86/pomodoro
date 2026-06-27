import type { EngineState, ControlAction } from '../shared/types.js'

interface PomodoroApi {
  onStateChange(cb: (state: EngineState) => void): () => void
  sendControl(action: ControlAction): void
  showContextMenu(): void
  dragWindow(dx: number, dy: number): void
}

declare global {
  interface Window {
    api: PomodoroApi
  }
}

export {}
