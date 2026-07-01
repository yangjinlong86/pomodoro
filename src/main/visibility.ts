import type { EngineState, Phase } from '../shared/types.js'
import { phaseLabel } from '../shared/config.js'
import { t, type Locale } from '../shared/i18n.js'

/** PURE: should the work window be visible during this phase?
 *
 * The window is always visible — during breaks the renderer shows the break
 * countdown and switches to the break background/label. `phase` is retained in
 * the signature for future policies (e.g. an opt-out that hides on break). */
export function visibilityForPhase(_phase: Phase): 'show' | 'hide' {
  return 'show'
}

/** PURE: window title for a phase (not rendered when frameless, kept for a11y/accessibility). */
export function windowTitleForPhase(phase: Phase, locale?: Locale): string {
  return `${t(locale).appName} — ${phaseLabel(phase, locale)}`
}

/** PURE: tray label reflecting current state, e.g. "Work 24:53" or "Paused — Work 24:53". */
export function trayLabel(state: EngineState, locale?: Locale): string {
  const mm = Math.floor(state.remainingSeconds / 60)
    .toString()
    .padStart(2, '0')
  const ss = (state.remainingSeconds % 60).toString().padStart(2, '0')
  const label = `${phaseLabel(state.phase, locale)} ${mm}:${ss}`
  return state.running ? label : `${t(locale).pausedPrefix} — ${label}`
}
