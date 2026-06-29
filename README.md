# Pomodoro

> [简体中文](README.zh-CN.md) | English

A minimal desktop pomodoro timer built with **Electron + TypeScript**. A small 100×100 always-on-top window floats in the top-right corner during work sessions, hides during breaks, and keeps you focused with a clean LCD-style countdown face.

> 🔔 Full cycle: 25 min work → 5 min short break → repeat. After every 4 work sessions, a 15 min long break. Auto-looping.

## Features

- **Drift-free countdown** — timing is based on absolute `endTime`, not a decrementing counter
- **Auto-looping pomodoro cycles** — work → short break → work → ... → long break (every 4th)
- **Always-on-top work window** — 100×100 frameless window, top-right positioning, auto-hides during breaks
- **Three window sizes** — Small / Medium / Large, resized in place (the window keeps its position)
- **LCD-style display** — [Orbitron](https://fonts.google.com/specimen/Orbitron) font with a four-colour progress ring
- **System tray controls** — start / pause / reset / skip / quit via tray icon menu
- **Identical tray & in-window right-click menu** — Pin / Unpin, Start / Pause, Reset, Skip, Size, Language, Help, Quit
- **Bilingual UI** — English / 中文 selectable from the menu; choice is persisted to `settings.json` and restored on next launch
- **Double-click to start / pause** the timer face
- **Drag to move** — left-click and drag the timer face to reposition the window
- **Phase-change notifications** — desktop notification when switching between work and break
- **Help** opens [the project on GitHub](https://github.com/yangjinlong86/pomodoro)
- **Version label** — current version (e.g. `Pomodoro Timer V0.2.0`) shown at the bottom of the menu
- **Single instance** — only one copy of the app runs at a time

## Screenshots

<!-- Add your own screenshots here -->
<!-- ![Work Phase](screenshots/work.png) -->

## Requirements

- Node.js 18+ (developed on Node 22)
- npm

## Install

```bash
npm install
```

> `.npmrc` uses [npmmirror](https://npmmirror.com/) mirrors for Electron and electron-builder binaries for reliable downloads.

## Development

```bash
# Hot-reload dev mode (requires a display)
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Run a single test file
npx vitest run tests/pomodoro-engine.test.ts
```

> The app needs a graphical display. On a headless machine, run inside your desktop session or under `xvfb-run`.

## Build & Package

```bash
# Production build → dist/{main,preload,renderer}
npm run build

# Preview the built app
npm start

# Package for Linux (AppImage + deb) → release/
npm run dist:linux
```

## Usage

| Action | How |
|--------|-----|
| Start / Pause timer | Tray menu, right-click timer face, or **double-click** timer face |
| Reset timer | Tray menu or right-click timer face |
| Skip to next phase | Tray menu or right-click timer face |
| Toggle always-on-top | Tray menu or right-click timer face (**Pin / Unpin**) |
| Resize window | Menu ▸ **Size** ▸ Small / Medium / Large (resizes in place) |
| Switch language | Menu ▸ **Language** ▸ English / 中文 (persisted) |
| Open GitHub page | Menu ▸ **Help** |
| Move window | Left-click + drag timer face |
| Show context menu | Right-click timer face |
| Quit | Tray menu or right-click timer face |

## Architecture

```
src/
  shared/      Types, config (durations), format (MM:SS), IPC channels, i18n dictionary
  timer/       PomodoroEngine — pure state machine, zero Electron/DOM deps
  main/        Electron main process
    window-options.ts   BrowserWindow options (100×100, frameless, alwaysOnTop)
    visibility.ts       Helpers: show on work / hide on break, tray label
    menu.ts             Tray menu & context menu template builder (locale-aware)
    window.ts           Window creation with top-right positioning
    tray.ts             Tray icon, tooltip, menu updates
    settings.ts         Load / save `settings.json` under userData
    index.ts            App lifecycle, engine tick, IPC, notifications, locale switching
  preload/     contextBridge exposing window.api to renderer
  renderer/    100×100 minimal UI (HTML/CSS/TS), driven by window.api
    fonts/            Orbitron bold font (local, embedded)
tests/         Vitest — engine, format, main-logic, settings, smoke
```

### Key Design Decisions

- **Pure / Electron split** — `window-options.ts`, `visibility.ts`, `menu.ts` import only *types* from `electron`, so unit tests can run them headlessly without launching Electron
- **Security** — `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, strict CSP, preload is the only bridge between main and renderer
- **Testability** — `PomodoroEngine` accepts an injectable `now: () => number` clock, making all timing logic 100% deterministic in tests
- **Drift-free timing** — remaining seconds are always derived from `endTime - now()`, never decremented

## Manual Smoke Checklist

Run on a real desktop with a display:

```bash
npm install
npm run dev    # or: npm run build && npm start
```

Expect:

1. A **100×100 frameless window** appears in the **top-right** corner.
2. The window is **always on top**.
3. It shows `25:00` in Orbitron font with a four-colour ring on a black background.
4. A **tray icon** with a context menu: Pin/Unpin, Start/Pause, Reset, Skip, Size, Language, Help, Quit, and a version label at the bottom (`Pomodoro Timer V0.2.0`).
5. **Right-click** the timer face shows the same menu.
6. **Double-click** the timer face toggles Start / Pause.
7. **Left-click + drag** moves the window.
8. **Size** ▸ Small / Medium / Large resizes the window **in place** without snapping back to the corner.
9. **Language** ▸ English / 中文 instantly re-renders every label everywhere (menu, tray tooltip, phase text, notifications, version label) and persists to `settings.json` in the user-data directory.
10. Starting the timer counts down; on reaching 0 it **auto-advances** to a break and the window **hides**; a desktop notification fires.
11. After a break it auto-loops back to work and the window **re-shows**.
12. After 4 work sessions, the break is the 15-minute long break.

## Tech Stack

- [Electron](https://www.electronjs.org/) 33 — desktop app framework
- [TypeScript](https://www.typescriptlang.org/) 5.7 — type-safe JS
- [electron-vite](https://evite.netlify.app/) 2.3 — build tooling
- [Vite](https://vitejs.dev/) 5.4 — bundler
- [Vitest](https://vitest.dev/) 2.1 — testing framework
- [ESLint](https://eslint.org/) 9 — linting

## License

MIT
