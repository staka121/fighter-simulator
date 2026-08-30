import { describe, it, expect } from 'vitest'
import { formatHeading } from './heading'
import { createTelemetry } from '../telemetry'

describe('formatHeading', () => {
  it('shows a placeholder before the first course fix', () => {
    expect(formatHeading(createTelemetry())).toBe('     ▲\n --   [---]   --')
  })

  it('boxes the heading between its bracketing 30° gridlines', () => {
    const t = createTelemetry()
    t.heading = 139
    expect(formatHeading(t)).toBe('     ▲\n 12   [139]   15')
  })

  it('pads north to three digits', () => {
    const t = createTelemetry()
    t.heading = 0
    expect(formatHeading(t)).toBe('     ▲\n 00   [000]   03')
  })

  it('wraps the upper gridline past 360', () => {
    const t = createTelemetry()
    t.heading = 350
    expect(formatHeading(t)).toBe('     ▲\n 33   [350]   00')
  })

  it('normalizes out-of-range headings', () => {
    const t = createTelemetry()
    t.heading = -10
    expect(formatHeading(t)).toBe('     ▲\n 33   [350]   00')
  })
})
