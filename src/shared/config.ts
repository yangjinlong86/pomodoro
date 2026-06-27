import type { Phase } from './types.js'

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

export const PHASE_LABEL: Record<Phase, string> = {
  work: 'Work',
  short: 'Short Break',
  long: 'Long Break'
}
