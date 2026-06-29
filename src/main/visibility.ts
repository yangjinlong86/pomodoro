import type { EngineState, Phase } from '../shared/types.js'
import { phaseLabel } from '../shared/config.js'
import { t, type Locale } from '../shared/i18n.js'

/** PURE: should the work window be visible during this phase? */
export function visibilityForPhase(phase: Phase): 'show' | 'hide' {
  return phase === 'work' ? 'show' : 'hide'
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
