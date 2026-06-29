import type { EngineState, ControlAction, WindowSize } from '../shared/types.js'
import type { Locale } from '../shared/i18n.js'

interface PomodoroApi {
  onStateChange(cb: (state: EngineState) => void): () => void
  sendControl(action: ControlAction): void
  showContextMenu(): void
  dragWindow(dx: number, dy: number): void
  onWindowResize(cb: (size: WindowSize) => void): () => void
  onLocaleChange(cb: (locale: Locale) => void): () => void
}

declare global {
  interface Window {
    api: PomodoroApi
  }
}

export {}
