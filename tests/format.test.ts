import { describe, it, expect } from 'vitest'
import { formatTime } from '../src/shared/format.js'

describe('formatTime', () => {
  it('formats 25 minutes as 25:00', () => {
    expect(formatTime(1500)).toBe('25:00')
  })
  it('zero-pads minutes and seconds', () => {
    expect(formatTime(65)).toBe('01:05')
  })
  it('formats zero as 00:00', () => {
    expect(formatTime(0)).toBe('00:00')
  })
  it('formats 09:59', () => {
    expect(formatTime(599)).toBe('09:59')
  })
  it('clamps negatives to 00:00', () => {
    expect(formatTime(-5)).toBe('00:00')
  })
})
