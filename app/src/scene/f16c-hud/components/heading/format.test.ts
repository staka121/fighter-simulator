import { describe, it, expect } from 'vitest'
import { formatHeadingNumber } from './format'
import { createStore } from '../../store'

describe('formatHeadingNumber', () => {
  it('shows --- before the first course fix', () => {
    expect(formatHeadingNumber(createStore())).toBe('---')
  })

  it('pads to three digits and normalises', () => {
    const t = createStore()
    t.heading = 5
    expect(formatHeadingNumber(t)).toBe('005')
    t.heading = 139
    expect(formatHeadingNumber(t)).toBe('139')
    t.heading = 359.6 // rounds to 360 → wraps to 0
    expect(formatHeadingNumber(t)).toBe('000')
    t.heading = -10
    expect(formatHeadingNumber(t)).toBe('350')
  })
})
