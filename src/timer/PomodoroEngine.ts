import { durationFor } from '../shared/config.js'
import { nextPhase, type EngineState, type Phase } from '../shared/types.js'

/**
 * Drift-free pomodoro state machine.
 *
 * Remaining time is ALWAYS derived from `endTime - now()` on each read, never by
 * decrementing a counter. This means a paused tab or a slow tick interval cannot
 * cause the countdown to drift away from wall-clock reality.
 *
 * The clock is injected (`now: () => number`, ms) so tests are deterministic and
 * the module has zero Electron / DOM dependencies.
 */
export class PomodoroEngine {
  private phase: Phase = 'work'
  private completedWorkSessions = 0
  private running = false
  private paused = false

  /** Absolute wall-clock ms when the current phase ends. Null when not running. */
  private endTime: number | null = null
  /** Remaining seconds captured at pause. */
  private remainingAtPause = 0

  constructor(private readonly now: () => number = Date.now) {}

  start(): void {
    this.phase = 'work'
    this.completedWorkSessions = 0
    this.running = true
    this.paused = false
    this.endTime = this.now() + durationFor('work') * 1000
  }

  pause(): void {
    if (!this.running || this.paused) return
    this.remainingAtPause = this.remainingSeconds
    this.paused = true
    this.endTime = null
  }

  resume(): void {
    if (!this.paused) return
    this.endTime = this.now() + this.remainingAtPause * 1000
    this.paused = false
    this.running = true
  }

  reset(): void {
    this.phase = 'work'
    this.completedWorkSessions = 0
    this.running = false
    this.paused = false
    this.endTime = null
    this.remainingAtPause = 0
  }

  /** Advance to the next phase immediately, same transition as the timer hitting 0. */
  skip(): void {
    this.advancePhase()
  }

  /** Recompute current state from the clock. Auto-advances phases that elapsed. */
  tick(): EngineState {
    if (this.running && !this.paused && this.endTime !== null) {
      while (this.remainingSeconds <= 0) {
        this.advancePhase()
        if (!this.running) break
      }
    }
    return this.getState()
  }

  isPaused(): boolean {
    return this.paused
  }

  getPhase(): Phase {
    return this.phase
  }

  getState(): EngineState {
    return {
      phase: this.phase,
      remainingSeconds: this.remainingSeconds,
      running: this.running && !this.paused,
      completedWorkSessions: this.completedWorkSessions
    }
  }

  /** Seconds left in the current phase, derived drift-free from endTime vs now(). */
  private get remainingSeconds(): number {
    if (this.paused) return this.remainingAtPause
    if (!this.running || this.endTime === null) return durationFor(this.phase)
    const ms = this.endTime - this.now()
    return Math.max(0, Math.round(ms / 1000))
  }

  /** Apply the work→break or break→work transition. Auto-loops into next work. */
  private advancePhase(): void {
    const { phase: next, incrementWork } = nextPhase(this.phase, this.completedWorkSessions)
    if (incrementWork) this.completedWorkSessions += 1
    this.phase = next
    // Auto-loop: every phase (including breaks) starts the next countdown running.
    this.running = true
    this.paused = false
    this.endTime = this.now() + durationFor(next) * 1000
  }
}
