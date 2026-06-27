import { describe, it, expect } from 'vitest'
import { PomodoroEngine } from '../src/timer/PomodoroEngine.js'
import { WORK, SHORT, LONG } from '../src/shared/config.js'

/** A controllable clock: `t` is in seconds; we return ms. */
function clock() {
  let t = 0
  return {
    now: () => t * 1000,
    set: (s: number) => {
      t = s
    },
    advance: (s: number) => {
      t += s
    }
  }
}

describe('PomodoroEngine', () => {
  it('starts in the initial work state, not running, 0 completed', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    const s = e.getState()
    expect(s.phase).toBe('work')
    expect(s.remainingSeconds).toBe(WORK) // 25:00
    expect(s.running).toBe(false)
    expect(s.completedWorkSessions).toBe(0)
  })

  it('start() sets running and remaining decreases as time advances (drift-free)', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    expect(e.getState().running).toBe(true)
    expect(e.getState().remainingSeconds).toBe(WORK)
    c.advance(5)
    expect(e.getState().remainingSeconds).toBe(WORK - 5)
    c.advance(55)
    expect(e.tick().remainingSeconds).toBe(WORK - 60)
  })

  it('transitions work→short at 0 and increments completedWorkSessions', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    c.advance(WORK) // work elapses
    const s = e.tick()
    expect(s.phase).toBe('short')
    expect(s.completedWorkSessions).toBe(1)
    expect(s.running).toBe(true)
  })

  it('after the 4th work completion the break is long', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    // Drive 4 work→break→work cycles via skip (deterministic, no clock math).
    e.skip() // work→short, completed=1
    expect(e.getPhase()).toBe('short')
    e.skip() // short→work
    expect(e.getPhase()).toBe('work')
    e.skip() // work→short, completed=2
    e.skip() // short→work
    e.skip() // work→short, completed=3
    e.skip() // short→work
    e.skip() // work→long, completed=4
    expect(e.getPhase()).toBe('long')
    expect(e.getState().completedWorkSessions).toBe(4)
  })

  it('auto-loops: after long break the next phase is work and running stays true', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    // get to a long break
    for (let i = 0; i < 7; i++) e.skip() // ends on long, completed=4
    expect(e.getPhase()).toBe('long')
    c.advance(LONG)
    const s = e.tick()
    expect(s.phase).toBe('work')
    expect(s.running).toBe(true)
    expect(s.remainingSeconds).toBe(WORK)
  })

  it('pause freezes remaining; resume continues within 1s', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    c.advance(100)
    e.tick()
    const before = e.getState().remainingSeconds // 1400
    e.pause()
    expect(e.getState().running).toBe(false)
    // time passes while paused
    c.advance(400)
    expect(e.getState().remainingSeconds).toBe(before) // frozen
    e.resume()
    expect(e.getState().running).toBe(true)
    c.advance(1)
    const after = e.getState().remainingSeconds
    // resumed countdown continued; lost ~1s, preserved within 1s
    expect(Math.abs(after - (before - 1))).toBeLessThanOrEqual(1)
  })

  it('reset returns to initial work state, not running', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    e.skip()
    e.skip()
    e.reset()
    const s = e.getState()
    expect(s.phase).toBe('work')
    expect(s.running).toBe(false)
    expect(s.completedWorkSessions).toBe(0)
    expect(s.remainingSeconds).toBe(WORK)
  })

  it('skip advances the phase immediately', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    expect(e.getPhase()).toBe('work')
    e.skip()
    expect(e.getPhase()).toBe('short')
    e.skip()
    expect(e.getPhase()).toBe('work')
  })

  it('remaining is derived from endTime vs now, not a decremented counter', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    expect(e.getState().remainingSeconds).toBe(WORK)
    // advance 5s without ticking — remaining must reflect the new now() directly
    c.advance(5)
    expect(e.getState().remainingSeconds).toBe(WORK - 5)
    // advance another 10s — still derived live
    c.advance(10)
    expect(e.getState().remainingSeconds).toBe(WORK - 15)
  })

  it('short break duration is 5 minutes and long is 15', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    e.skip() // -> short
    expect(e.getState().remainingSeconds).toBe(SHORT)
    // advance through to a long break
    e.skip() // work
    e.skip() // short (2)
    e.skip() // work
    e.skip() // short (3)
    e.skip() // work
    e.skip() // long (4)
    expect(e.getState().remainingSeconds).toBe(LONG)
  })

  it('skip at the long break (last phase of a cycle) returns to work', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    for (let i = 0; i < 7; i++) e.skip() // ends on long, completed=4
    expect(e.getPhase()).toBe('long')
    e.skip() // long -> work
    expect(e.getPhase()).toBe('work')
    expect(e.getState().running).toBe(true)
    // completedWorkSessions stays at 4 until this new work session ends
    expect(e.getState().completedWorkSessions).toBe(4)
  })

  it('reset while paused returns to a fresh, non-running work state', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    c.advance(200)
    e.tick()
    e.pause()
    expect(e.getState().running).toBe(false)
    e.reset()
    const s = e.getState()
    expect(s.phase).toBe('work')
    expect(s.running).toBe(false)
    expect(s.remainingSeconds).toBe(WORK)
    expect(s.completedWorkSessions).toBe(0)
    // resuming after a reset-without-start is a no-op (not paused)
    e.resume()
    expect(e.getState().running).toBe(false)
  })

  it('rapid start/pause toggling does not corrupt remaining time', () => {
    const c = clock()
    const e = new PomodoroEngine(c.now)
    e.start()
    c.advance(10)
    e.tick()
    e.pause()
    e.resume()
    e.pause()
    e.resume()
    c.advance(10)
    e.tick()
    // ~20s elapsed total across toggles; remaining within 1s of WORK-20
    expect(Math.abs(e.getState().remainingSeconds - (WORK - 20))).toBeLessThanOrEqual(1)
  })
})
