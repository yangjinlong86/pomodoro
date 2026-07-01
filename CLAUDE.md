# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A minimal desktop pomodoro timer (Electron + TypeScript). An
**always-on-top** window in the top-right corner shows the countdown in every
phase — work, short break, and long break — with the label and background
colour swapping to reflect the current phase. Controls live in the system
tray. Full cycle: 25 min work / 5 min short break / 15 min long break (after
every 4 work sessions), auto-looping.

## Commands

```bash
npm install            # deps (registry + electron mirror = npmmirror, see .npmrc)
npm run typecheck      # tsc --noEmit (covers main/preload/renderer via project refs)
npm run lint           # eslint . (flat config)
npm test               # vitest run
npm run build          # electron-vite build → dist/{main,preload,renderer}
npm run dev            # electron-vite dev (hot reload; needs a display)
npm start              # preview built app
npm run dist:linux     # electron-builder --linux → release/ (AppImage + deb)
```

Run a single test file: `npx vitest run tests/pomodoro-engine.test.ts`

## Architecture

```
src/
  shared/      types, config (durations), format (MM:SS), ipc-channels  — imported by all layers
  timer/       PomodoroEngine — PURE state machine, zero Electron/DOM deps, fully unit-tested
  main/        Electron main process
    window-options.ts  PURE BrowserWindow options (300x300, frameless, alwaysOnTop, locked webPreferences)
    visibility.ts      PURE helpers: visibilityForPhase (currently always 'show'), trayLabel, windowTitle
    menu.ts            PURE tray-menu template builder + dispatch indirection
    window.ts          createWorkWindow (uses electron + screen for top-right positioning)
    tray.ts            createTray / updateTray (uses electron)
    index.ts           lifecycle: single-instance lock, engine, 1s tick, IPC, show/hide on phase change, notifications
  preload/     contextBridge → window.api { onStateChange, sendControl }
  renderer/    300x300 minimal UI (index.html/styles.css/index.ts), driven only by window.api
tests/         vitest — engine, format, main-logic (pure modules), smoke
```

### Key design notes

- **Drift-free timing**: `PomodoroEngine` stores an absolute `endTime`; remaining
  seconds are derived from `endTime - now()` each read, never by decrementing a
  counter. The clock is injected (`now: () => ms`) so tests are deterministic.
- **Window visibility**: `visibilityForPhase` currently returns `show` for
  every phase — the renderer swaps the phase label and background colour so
  the same window presents work and break countdowns. The helper is retained
  as the single toggle point for a future opt-out that hides during breaks.
- **Pure / Electron split**: `window-options.ts`, `visibility.ts`, `menu.ts`
  carry only **type** imports from `electron` (stripped at runtime), so the unit
  tests can import them without launching Electron. `window.ts`/`tray.ts`/
  `index.ts`/`preload` use Electron at runtime.
- **Security posture**: `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`, strict CSP meta in the renderer, preload is the only bridge.
- **Single instance**: `app.requestSingleInstanceLock()`; the 1s interval is
  cleared on `before-quit`; `window-all-closed` is prevented so the tray keeps
  the app alive.

## Environment notes

- Developed in a headless tty (no `DISPLAY`/`WAYLAND_DISPLAY`, no `xvfb`). All
  logic is verified by headless unit tests; the **live GUI window cannot be
  launched here** — smoke-test `npm run dev` on a real desktop.
- `.npmrc` sets `electron_mirror` and `electron_builder_binaries_mirror` to
  npmmirror so Electron + builder binaries download reliably.
- `electron-vite@2.3` requires `vite@4||5` (vite is pinned to `^5`).
- electron-builder's `deb` target requires a `homepage` field in package.json.
