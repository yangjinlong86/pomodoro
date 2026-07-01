import { describe, it, expect, beforeEach } from 'vitest'
import { WORK_WINDOW_OPTIONS } from '../src/main/window-options.js'
import { visibilityForPhase, windowTitleForPhase, trayLabel } from '../src/main/visibility.js'
import { buildTrayMenu, buildWindowContextMenu, menuDispatch } from '../src/main/menu.js'
import type { EngineState, ControlAction, WindowSize } from '../src/shared/types.js'
import type { Locale } from '../src/shared/i18n.js'

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
  it('shows the window in every phase (work + breaks)', () => {
    expect(visibilityForPhase('work')).toBe('show')
    expect(visibilityForPhase('short')).toBe('show')
    expect(visibilityForPhase('long')).toBe('show')
  })
})

describe('windowTitleForPhase / trayLabel', () => {
  it('titles include the phase label', () => {
    expect(windowTitleForPhase('work')).toContain('Work')
    expect(windowTitleForPhase('long')).toContain('Long Break')
  })

  it('titles localise to Chinese when zh locale is supplied', () => {
    expect(windowTitleForPhase('work', 'zh')).toContain('工作')
    expect(windowTitleForPhase('long', 'zh')).toContain('长休息')
  })

  it('tray label shows the countdown and pauses prefix when not running', () => {
    const running = trayLabel(state({ running: true, remainingSeconds: 1495 }))
    expect(running).toBe('Work 24:55')
    const paused = trayLabel(state({ running: false, remainingSeconds: 1495 }))
    expect(paused).toBe('Paused — Work 24:55')
  })

  it('tray label uses the Chinese phase + paused prefix under zh locale', () => {
    const running = trayLabel(state({ running: true, remainingSeconds: 1495 }), 'zh')
    expect(running).toBe('工作 24:55')
    const paused = trayLabel(state({ running: false, remainingSeconds: 1495 }), 'zh')
    expect(paused).toBe('已暂停 — 工作 24:55')
  })
})

describe('tray menu', () => {
  it('exposes Pin, Start/Pause, Reset, Skip, Size, Language, Help, Quit', () => {
    const labels = buildTrayMenu(state({ running: false }), true, 'small')
      .map((m) => m.label)
      .filter((l): l is string => Boolean(l))
    expect(labels).toContain('Unpin')
    expect(labels).toContain('Start')
    expect(labels).toContain('Reset')
    expect(labels).toContain('Skip')
    expect(labels).toContain('Size')
    expect(labels).toContain('Language')
    expect(labels).toContain('Help')
    expect(labels).toContain('Quit')

    const labelsRunning = buildTrayMenu(state({ running: true }), true, 'small')
      .map((m) => m.label)
      .filter((l): l is string => Boolean(l))
    expect(labelsRunning).toContain('Pause')
  })

  it('clicking Start/Pause dispatches the right control action', () => {
    const captured: ControlAction[] = []
    menuDispatch.send = (a) => captured.push(a)
    const menu = buildTrayMenu(state({ running: false }), true, 'small')
    const start = menu.find((m) => m.label === 'Start')!
    start.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['start'])

    const menu2 = buildTrayMenu(state({ running: true }), true, 'small')
    const pause = menu2.find((m) => m.label === 'Pause')!
    pause.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['start', 'pause'])
  })

  it('Reset and Skip dispatch their actions', () => {
    const captured: ControlAction[] = []
    menuDispatch.send = (a) => captured.push(a)
    const menu = buildTrayMenu(state(), true, 'small')
    menu.find((m) => m.label === 'Reset')!.click?.(undefined as never, undefined as never, undefined as never)
    menu.find((m) => m.label === 'Skip')!.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['reset', 'skip'])
  })

  it('Pin/Unpin and Quit trigger their callbacks', () => {
    const callbacks: string[] = []
    menuDispatch.toggleAlwaysOnTop = () => callbacks.push('toggle')
    menuDispatch.quit = () => callbacks.push('quit')

    const menu = buildTrayMenu(state(), true, 'small')
    menu.find((m) => m.label === 'Unpin')!.click?.(undefined as never, undefined as never, undefined as never)
    menu.find((m) => m.label === 'Quit')!.click?.(undefined as never, undefined as never, undefined as never)

    expect(callbacks).toEqual(['toggle', 'quit'])
  })

  it('exposes a Size submenu with Large, Medium, Small radio items', () => {
    const menu = buildTrayMenu(state(), true, 'small')
    const sizeItem = menu.find((m) => m.label === 'Size')
    expect(sizeItem).toBeTruthy()
    const submenu = sizeItem?.submenu as { label: string; type?: string; checked?: boolean }[]
    expect(submenu).toBeTruthy()
    expect(submenu.map((m) => m.label)).toEqual(['Large', 'Medium', 'Small'])
    expect(submenu[2].type).toBe('radio')
    expect(submenu[2].checked).toBe(true)
  })

  it('clicking Help triggers the openHelp callback', () => {
    const callbacks: string[] = []
    menuDispatch.openHelp = () => callbacks.push('help')
    const menu = buildTrayMenu(state(), true, 'small')
    menu.find((m) => m.label === 'Help')!.click?.(undefined as never, undefined as never, undefined as never)
    expect(callbacks).toEqual(['help'])
  })

  it('appends a disabled version label when a version is supplied', () => {
    const menu = buildTrayMenu(state(), true, 'small', 'en', '0.1.0')
    const version = menu.find((m) => m.label === 'Pomodoro Timer V0.1.0')
    expect(version).toBeTruthy()
    expect(version?.enabled).toBe(false)
  })

  it('omits the version label when no version is supplied', () => {
    const menu = buildTrayMenu(state(), true, 'small')
    expect(menu.find((m) => typeof m.label === 'string' && m.label.startsWith('Pomodoro Timer V'))).toBeFalsy()
  })

  it('exposes a Language submenu with radio items for each locale', () => {
    const menu = buildTrayMenu(state(), true, 'small', 'en')
    const lang = menu.find((m) => m.label === 'Language')
    expect(lang).toBeTruthy()
    const submenu = lang?.submenu as { label: string; type?: string; checked?: boolean }[]
    expect(submenu.map((m) => m.label)).toEqual(['English', '中文'])
    expect(submenu[0].type).toBe('radio')
    expect(submenu[0].checked).toBe(true)
    expect(submenu[1].checked).toBe(false)
  })

  it('clicking a Language item dispatches setLocale', () => {
    const captured: Locale[] = []
    menuDispatch.setLocale = (l) => captured.push(l)
    const menu = buildTrayMenu(state(), true, 'small', 'en')
    const submenu = menu.find((m) => m.label === 'Language')?.submenu as { label: string; click?: () => void }[]
    submenu.find((m) => m.label === '中文')!.click?.()
    submenu.find((m) => m.label === 'English')!.click?.()
    expect(captured).toEqual(['zh', 'en'])
  })

  it('localises every menu label when the locale is zh', () => {
    const labels = buildTrayMenu(state({ running: false }), true, 'small', 'zh', '0.1.0')
      .map((m) => m.label)
      .filter((l): l is string => Boolean(l))
    expect(labels).toContain('取消置顶')
    expect(labels).toContain('开始')
    expect(labels).toContain('重置')
    expect(labels).toContain('跳过')
    expect(labels).toContain('尺寸')
    expect(labels).toContain('语言')
    expect(labels).toContain('帮助')
    expect(labels).toContain('退出')
    expect(labels).toContain('番茄钟 V0.1.0')
  })
})

describe('window context menu', () => {
  beforeEach(() => {
    menuDispatch.send = () => {}
    menuDispatch.toggleAlwaysOnTop = () => {}
    menuDispatch.quit = () => {}
    menuDispatch.setWindowSize = () => {}
    menuDispatch.setLocale = () => {}
    menuDispatch.openHelp = () => {}
  })

  it('exposes Pin, Start/Pause, Reset, Skip, Language, Help, Quit', () => {
    const labels = buildWindowContextMenu(state({ running: false }), true, 'small')
      .map((m) => m.label)
      .filter((l): l is string => Boolean(l))
    expect(labels).toContain('Unpin')
    expect(labels).toContain('Start')
    expect(labels).toContain('Reset')
    expect(labels).toContain('Skip')
    expect(labels).toContain('Language')
    expect(labels).toContain('Help')
    expect(labels).toContain('Quit')
  })

  it('shows "Pin" when not always on top, and "Unpin" when on', () => {
    const off = buildWindowContextMenu(state(), false, 'small')
    expect(off.find((m) => m.label === 'Pin')).toBeTruthy()
    const on = buildWindowContextMenu(state(), true, 'small')
    expect(on.find((m) => m.label === 'Unpin')).toBeTruthy()
  })

  it('shows Start when not running and Pause when running', () => {
    const idle = buildWindowContextMenu(state({ running: false }), true, 'small')
    expect(idle.find((m) => m.label === 'Start')).toBeTruthy()
    expect(idle.find((m) => m.label === 'Pause')).toBeFalsy()

    const running = buildWindowContextMenu(state({ running: true }), true, 'small')
    expect(running.find((m) => m.label === 'Pause')).toBeTruthy()
    expect(running.find((m) => m.label === 'Start')).toBeFalsy()
  })

  it('clicking Start dispatches start, Pause dispatches pause', () => {
    const captured: ControlAction[] = []
    menuDispatch.send = (a) => captured.push(a)

    const idle = buildWindowContextMenu(state({ running: false }), true, 'small')
    idle.find((m) => m.label === 'Start')!.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['start'])

    const running = buildWindowContextMenu(state({ running: true }), true, 'small')
    running.find((m) => m.label === 'Pause')!.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['start', 'pause'])
  })

  it('Reset and Skip dispatch their actions', () => {
    const captured: ControlAction[] = []
    menuDispatch.send = (a) => captured.push(a)
    const menu = buildWindowContextMenu(state(), true, 'small')
    menu.find((m) => m.label === 'Reset')!.click?.(undefined as never, undefined as never, undefined as never)
    menu.find((m) => m.label === 'Skip')!.click?.(undefined as never, undefined as never, undefined as never)
    expect(captured).toEqual(['reset', 'skip'])
  })

  it('Pin/Unpin and Quit trigger their callbacks', () => {
    const callbacks: string[] = []
    menuDispatch.toggleAlwaysOnTop = () => callbacks.push('toggle')
    menuDispatch.quit = () => callbacks.push('quit')

    const menu = buildWindowContextMenu(state(), true, 'small')
    menu.find((m) => m.label === 'Unpin')!.click?.(undefined as never, undefined as never, undefined as never)
    menu.find((m) => m.label === 'Quit')!.click?.(undefined as never, undefined as never, undefined as never)

    expect(callbacks).toEqual(['toggle', 'quit'])
  })

  it('exposes a Size submenu with Large, Medium, Small radio items', () => {
    const menu = buildWindowContextMenu(state(), true, 'small')
    const sizeItem = menu.find((m) => m.label === 'Size')
    expect(sizeItem).toBeTruthy()
    const submenu = sizeItem?.submenu as { label: string; type?: string; checked?: boolean }[]
    expect(submenu).toBeTruthy()
    expect(submenu.map((m) => m.label)).toEqual(['Large', 'Medium', 'Small'])
    expect(submenu[2].type).toBe('radio')
    expect(submenu[2].checked).toBe(true)
  })

  it('checks the correct Size item based on currentSize', () => {
    const small = buildWindowContextMenu(state(), true, 'small')
    const medium = buildWindowContextMenu(state(), true, 'medium')
    const large = buildWindowContextMenu(state(), true, 'large')

    const smallSub = small.find((m) => m.label === 'Size')?.submenu as { label: string; checked?: boolean }[]
    const mediumSub = medium.find((m) => m.label === 'Size')?.submenu as { label: string; checked?: boolean }[]
    const largeSub = large.find((m) => m.label === 'Size')?.submenu as { label: string; checked?: boolean }[]

    expect(smallSub.find((m) => m.label === 'Small')?.checked).toBe(true)
    expect(mediumSub.find((m) => m.label === 'Medium')?.checked).toBe(true)
    expect(largeSub.find((m) => m.label === 'Large')?.checked).toBe(true)
  })

  it('clicking a Size item dispatches setWindowSize', () => {
    const captured: WindowSize[] = []
    menuDispatch.setWindowSize = (s) => captured.push(s)

    const menu = buildWindowContextMenu(state(), true, 'small')
    const submenu = menu.find((m) => m.label === 'Size')?.submenu as { label: string; click?: () => void }[]
    submenu.find((m) => m.label === 'Large')!.click?.()
    submenu.find((m) => m.label === 'Medium')!.click?.()
    submenu.find((m) => m.label === 'Small')!.click?.()

    expect(captured).toEqual(['large', 'medium', 'small'])
  })

  it('clicking Help triggers the openHelp callback', () => {
    const callbacks: string[] = []
    menuDispatch.openHelp = () => callbacks.push('help')
    const menu = buildWindowContextMenu(state(), true, 'small')
    menu.find((m) => m.label === 'Help')!.click?.(undefined as never, undefined as never, undefined as never)
    expect(callbacks).toEqual(['help'])
  })

  it('appends a disabled version label when a version is supplied', () => {
    const menu = buildWindowContextMenu(state(), true, 'small', 'en', '0.1.0')
    const version = menu.find((m) => m.label === 'Pomodoro Timer V0.1.0')
    expect(version).toBeTruthy()
    expect(version?.enabled).toBe(false)
  })

  it('exposes a Language submenu and dispatches setLocale on click', () => {
    const captured: Locale[] = []
    menuDispatch.setLocale = (l) => captured.push(l)

    const menu = buildWindowContextMenu(state(), true, 'small', 'zh')
    const lang = menu.find((m) => m.label === '语言')
    expect(lang).toBeTruthy()
    const submenu = lang?.submenu as { label: string; type?: string; checked?: boolean; click?: () => void }[]
    expect(submenu.map((m) => m.label)).toEqual(['English', '中文'])
    expect(submenu[1].checked).toBe(true)
    submenu.find((m) => m.label === 'English')!.click?.()
    expect(captured).toEqual(['en'])
  })

  it('localises every label when the locale is zh', () => {
    const menu = buildWindowContextMenu(state(), true, 'small', 'zh')
    const labels = menu.map((m) => m.label).filter((l): l is string => Boolean(l))
    expect(labels).toContain('取消置顶')
    expect(labels).toContain('开始')
    expect(labels).toContain('重置')
    expect(labels).toContain('跳过')
    expect(labels).toContain('尺寸')
    expect(labels).toContain('语言')
    expect(labels).toContain('帮助')
    expect(labels).toContain('退出')
  })
})
