import { formatTime } from '../shared/format.js'
import { PHASE_LABEL, durationFor } from '../shared/config.js'
import type { EngineState, Phase } from '../shared/types.js'

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS // ≈ 251.327

const countdown = document.getElementById('countdown')!
const phaseLabel = document.getElementById('phase-label')!
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
  phaseLabel.textContent = state.running
    ? PHASE_LABEL[state.phase]
    : `Paused — ${PHASE_LABEL[state.phase]}`

  document.body.classList.remove('phase-work', 'phase-short', 'phase-long')
  document.body.classList.add(PHASE_CLASS[state.phase])
  updateProgress(state.remainingSeconds, state.phase)
}

let currentState: EngineState | null = null

window.api.onStateChange((state) => {
  currentState = state
  render(state)
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
