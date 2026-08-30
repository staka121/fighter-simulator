import { describe, it, expect } from 'vitest'
import { formatHeading } from './heading'
import { createStore } from '../../store'

describe('formatHeading', () => {
  it('shows a placeholder before the first course fix', () => {
    expect(formatHeading(createStore())).toBe('          ▲\n--   [---]   --')
  })

  it('boxes the heading between its bracketing 30° gridlines', () => {
    const t = createStore()
    t.heading = 139
    expect(formatHeading(t)).toBe('          ▲\n12   [139]   15')
  })

  it('pads north to three digits', () => {
    const t = createStore()
    t.heading = 0
    expect(formatHeading(t)).toBe('          ▲\n00   [000]   03')
  })

  it('wraps the upper gridline past 360', () => {
    const t = createStore()
    t.heading = 350
    expect(formatHeading(t)).toBe('          ▲\n33   [350]   00')
  })

  it('normalizes out-of-range headings', () => {
    const t = createStore()
    t.heading = -10
    expect(formatHeading(t)).toBe('          ▲\n33   [350]   00')
  })
})
