import { SESSIONS_BEFORE_LONG } from './config.js'

export type Phase = 'work' | 'short' | 'long'

export interface EngineState {
  phase: Phase
  remainingSeconds: number
  running: boolean
  completedWorkSessions: number
}

export type ControlAction = 'start' | 'pause' | 'resume' | 'reset' | 'skip'

/** Pure helper: which phase comes after the given one. */
export function nextPhase(
  current: Phase,
  completedWorkSessions: number
): { phase: Phase; incrementWork: boolean } {
  if (current === 'work') {
    const incremented = completedWorkSessions + 1
    const isLong = incremented % SESSIONS_BEFORE_LONG === 0
    return { phase: isLong ? 'long' : 'short', incrementWork: true }
  }
  // breaks always return to work
  return { phase: 'work', incrementWork: false }
}
