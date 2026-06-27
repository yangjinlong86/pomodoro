import { describe, it, expect, beforeEach } from 'vitest'
import { WORK_WINDOW_OPTIONS } from '../src/main/window-options.js'
import { visibilityForPhase, windowTitleForPhase, trayLabel } from '../src/main/visibility.js'
import { buildTrayMenu, buildWindowContextMenu, menuDispatch } from '../src/main/menu.js'
import type { EngineState, ControlAction } from '../src/shared/types.js'

function state(over: Partial<EngineState> = {}): EngineState {
  return {
    phase: 'work',
    remainingSeconds: 1500,
    running: false,
    completedWorkSessions: 0,
    ...over
  }
}

describe('work window options', () => {
  it('is 100x100, frameless, always-on-top', () => {
    expect(WORK_WINDOW_OPTIONS.width).toBe(100)
    expect(WORK_WINDOW_OPTIONS.height).toBe(100)
    expect(WORK_WINDOW_OPTIONS.frame).toBe(false)
    expect(WORK_WINDOW_OPTIONS.alwaysOnTop).toBe(true)
    expect(WORK_WINDOW_OPTIONS.resizable).toBe(false)
    expect(WORK_WINDOW_OPTIONS.skipTaskbar).toBe(true)
  })

  it('locks down webPreferences: isolation on, node off, sandbox on', () => {
    const wp = WORK_WINDOW_OPTIONS.webPreferences!
    expect(wp.contextIsolation).toBe(true)
    expect(wp.nodeIntegration).toBe(false)
    expect(wp.sandbox).toBe(true)
  })
})

describe('visibilityForPhase', () => {
  it('shows the window during work and hides it during breaks', () => {
    expect(visibilityForPhase('work')).toBe('show')
    expect(visibilityForPhase('short')).toBe('hide')
    expect(visibilityForPhase('long')).toBe('hide')
  })
})

describe('windowTitleForPhase / trayLabel', () => {
  it('titles include the phase label', () => {
    expect(windowTitleForPhase('work')).toContain('Work')
    expect(windowTitleForPhase('long')).toContain('Long Break')
  })

  it('tray label shows the countdown and pauses prefix when not running', () => {
    const running = trayLabel(state({ running: true, remainingSeconds: 1495 }))
    expect(running).toBe('Work 24:55')
    const paused = trayLabel(state({ running: false, remainingSeconds: 1495 }))
    expect(paused).toBe('Paused — Work 24:55')
  })
})

describe('tray menu', () => {
  it('exposes Start/Pause, Reset, Skip, Quit', () => {
    const labels = buildTrayMenu(state({ running: false }))
      .map((m) => m.label)
      .filter((l): l is string => Boolean(l))
    // Start when not running
    expect(labels).toContain('Start')
    expect(labels).toContain('Reset')
    expect(labels).toContain('Skip')
    expect(labels).toContain('Quit')
    // Pause when running
    const labelsRunning = buildTrayMenu(state({ running: true }))
      .map((m) => m.label)
      .filter((l): l is string => Boolean(l))
    expect(labelsRunning).toContain('Pause')
  })

  it('clicking Start/Pause dispatches the right control action', () => {
    const captured: ControlAction[] = []
    menuDispatch.send = (a) => captured.push(a)
    const menu = buildTrayMenu(state({ running: false }))
    const start = menu.find((m) => m.label === 'Start')!
    start.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['start'])

    const menu2 = buildTrayMenu(state({ running: true }))
    const pause = menu2.find((m) => m.label === 'Pause')!
    pause.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['start', 'pause'])
  })

  it('Reset and Skip dispatch their actions', () => {
    const captured: ControlAction[] = []
    menuDispatch.send = (a) => captured.push(a)
    const menu = buildTrayMenu(state())
    menu.find((m) => m.label === 'Reset')!.click?.(undefined as never, undefined as never, undefined as never)
    menu.find((m) => m.label === 'Skip')!.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['reset', 'skip'])
  })
})

describe('window context menu', () => {
  beforeEach(() => {
    menuDispatch.send = () => {}
    menuDispatch.toggleAlwaysOnTop = () => {}
    menuDispatch.quit = () => {}
  })

  it('exposes Always on Top, Start/Pause, Stop, Reset, Quit', () => {
    const labels = buildWindowContextMenu(state({ running: false }), true)
      .map((m) => m.label)
      .filter((l): l is string => Boolean(l))
    expect(labels).toContain('Cancel Always on Top')
    expect(labels).toContain('Start')
    expect(labels).toContain('Stop')
    expect(labels).toContain('Reset')
    expect(labels).toContain('Quit')
  })

  it('shows "Always on Top" when not always on top, and "Cancel" when on', () => {
    const off = buildWindowContextMenu(state(), false)
    expect(off.find((m) => m.label === 'Always on Top')).toBeTruthy()
    const on = buildWindowContextMenu(state(), true)
    expect(on.find((m) => m.label === 'Cancel Always on Top')).toBeTruthy()
  })

  it('shows Start when not running and Pause when running', () => {
    const idle = buildWindowContextMenu(state({ running: false }), true)
    expect(idle.find((m) => m.label === 'Start')).toBeTruthy()
    expect(idle.find((m) => m.label === 'Pause')).toBeFalsy()

    const running = buildWindowContextMenu(state({ running: true }), true)
    expect(running.find((m) => m.label === 'Pause')).toBeTruthy()
    expect(running.find((m) => m.label === 'Start')).toBeFalsy()
  })

  it('clicking Start dispatches start, Pause dispatches pause', () => {
    const captured: ControlAction[] = []
    menuDispatch.send = (a) => captured.push(a)

    const idle = buildWindowContextMenu(state({ running: false }), true)
    idle.find((m) => m.label === 'Start')!.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['start'])

    const running = buildWindowContextMenu(state({ running: true }), true)
    running.find((m) => m.label === 'Pause')!.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['start', 'pause'])
  })

  it('Stop and Reset both dispatch reset', () => {
    const captured: ControlAction[] = []
    menuDispatch.send = (a) => captured.push(a)
    const menu = buildWindowContextMenu(state(), true)
    menu.find((m) => m.label === 'Stop')!.click?.(undefined as never, undefined as never, undefined as never)
    menu.find((m) => m.label === 'Reset')!.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['reset', 'reset'])
  })

  it('Always on Top and Quit trigger their callbacks', () => {
    const callbacks: string[] = []
    menuDispatch.toggleAlwaysOnTop = () => callbacks.push('toggle')
    menuDispatch.quit = () => callbacks.push('quit')

    const menu = buildWindowContextMenu(state(), true)
    menu.find((m) => m.label === 'Cancel Always on Top')!.click?.(undefined as never, undefined as never, undefined as never)
    menu.find((m) => m.label === 'Quit')!.click?.(undefined as never, undefined as never, undefined as never)

    expect(callbacks).toEqual(['toggle', 'quit'])
  })
})
