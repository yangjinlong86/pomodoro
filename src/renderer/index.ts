import { formatTime } from '../shared/format.js'
import { phaseLabel, durationFor } from '../shared/config.js'
import { t, DEFAULT_LOCALE, type Locale } from '../shared/i18n.js'
import type { EngineState, Phase } from '../shared/types.js'

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS // ≈ 251.327

const countdown = document.getElementById('countdown')!
const phaseLabelEl = document.getElementById('phase-label')!
const progressMaskCircle = document.getElementById('progress-mask-circle')!

// Initialise the mask ring dasharray so it exactly matches the circumference.
progressMaskCircle.setAttribute('stroke-dasharray', String(CIRCUMFERENCE))

window.api.onWindowResize((size) => {
  document.body.classList.remove('size-small', 'size-medium', 'size-large')
  document.body.classList.add(`size-${size}`)
})

const PHASE_CLASS: Record<Phase, string> = {
  work: 'phase-work',
  short: 'phase-short',
  long: 'phase-long'
}

let currentLocale: Locale = DEFAULT_LOCALE

function updateProgress(remainingSeconds: number, phase: Phase): void {
  const total = durationFor(phase)
  const progress = remainingSeconds / total
  // Negative offset shifts the dash pattern clockwise, so the gap opens at
  // 12 o'clock and expands clockwise (red → yellow → blue → green).
  const offset = -(1 - progress) * CIRCUMFERENCE
  progressMaskCircle.setAttribute('stroke-dashoffset', String(offset))
}

function render(state: EngineState): void {
  countdown.textContent = formatTime(state.remainingSeconds)
  const label = phaseLabel(state.phase, currentLocale)
  phaseLabelEl.textContent = state.running
    ? label
    : `${t(currentLocale).pausedPrefix} — ${label}`

  document.body.classList.remove('phase-work', 'phase-short', 'phase-long')
  document.body.classList.add(PHASE_CLASS[state.phase])
  updateProgress(state.remainingSeconds, state.phase)
}

let currentState: EngineState | null = null

window.api.onStateChange((state) => {
  currentState = state
  render(state)
})

window.api.onLocaleChange((locale) => {
  currentLocale = locale
  document.documentElement.setAttribute('lang', locale === 'zh' ? 'zh-CN' : 'en')
  if (currentState) render(currentState)
})

// Double-click to start / pause the timer.
document.addEventListener('dblclick', () => {
  if (!currentState) return
  isDragging = false
  window.api.sendControl(currentState.running ? 'pause' : 'start')
})

// Right-click anywhere on the timer face to show the context menu.
document.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  window.api.showContextMenu()
})

// Custom window drag for the frameless window (replaces -webkit-app-region: drag
// which swallows right-clicks on some platforms).
let isDragging = false

document.addEventListener('pointerdown', (e) => {
  if (e.button === 0) {
    isDragging = true
    document.setPointerCapture(e.pointerId)
  }
})

document.addEventListener('pointermove', (e) => {
  if (isDragging && e.buttons & 1) {
    window.api.dragWindow(e.movementX, e.movementY)
  }
})

document.addEventListener('pointerup', () => {
  isDragging = false
})
