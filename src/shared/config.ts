import type { Phase } from './types.js'
import { t, type Locale } from './i18n.js'

/** Phase durations in seconds. */
export const WORK = 25 * 60
export const SHORT = 5 * 60
export const LONG = 15 * 60

/** Number of work sessions before a long break. */
export const SESSIONS_BEFORE_LONG = 4

export function durationFor(phase: Phase): number {
  switch (phase) {
    case 'work':
      return WORK
    case 'short':
      return SHORT
    case 'long':
      return LONG
  }
}

/** Localised label for a phase. Pass a Locale to render in that language. */
export function phaseLabel(phase: Phase, locale?: Locale): string {
  const d = t(locale)
  switch (phase) {
    case 'work':
      return d.phaseWork
    case 'short':
      return d.phaseShort
    case 'long':
      return d.phaseLong
  }
}
