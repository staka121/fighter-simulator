import { describe, it, expect } from 'vitest'
import { formatClock } from './clock'

describe('formatClock', () => {
  it('formats local time as HH:MM:SS, zero-padded', () => {
    const d = new Date(2026, 0, 2, 9, 5, 3) // 09:05:03 local
    expect(formatClock(d)).toBe('09:05:03')
  })

  it('handles midnight and afternoon', () => {
    expect(formatClock(new Date(2026, 0, 2, 0, 0, 0))).toBe('00:00:00')
    expect(formatClock(new Date(2026, 0, 2, 23, 59, 59))).toBe('23:59:59')
  })
})
