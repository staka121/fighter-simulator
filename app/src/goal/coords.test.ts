import { describe, it, expect } from 'vitest'
import { parseGoalInput, formatCoord } from './coords'

describe('parseGoalInput', () => {
  it('parses valid coordinates', () => {
    expect(parseGoalInput('35.6812', '139.7671')).toEqual({ lat: 35.6812, lon: 139.7671 })
  })

  it('accepts negatives and the range extremes', () => {
    expect(parseGoalInput('-90', '180')).toEqual({ lat: -90, lon: 180 })
  })

  it('rejects blank inputs (so 0,0 is not silently accepted)', () => {
    expect(parseGoalInput('', '139')).toBeNull()
    expect(parseGoalInput('35', '  ')).toBeNull()
  })

  it('rejects non-numeric input', () => {
    expect(parseGoalInput('north', '139')).toBeNull()
  })

  it('rejects out-of-range coordinates', () => {
    expect(parseGoalInput('91', '0')).toBeNull()
    expect(parseGoalInput('0', '181')).toBeNull()
  })
})

describe('formatCoord', () => {
  it('formats to 5 dp', () => {
    expect(formatCoord(35.681236, 139.76713)).toBe('35.68124, 139.76713')
  })

  it('shows a dash when unknown', () => {
    expect(formatCoord(null, null)).toBe('—')
  })
})
