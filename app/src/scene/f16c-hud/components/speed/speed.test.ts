import { describe, it, expect } from 'vitest'
import { formatSpeed } from './speed'
import { createStore } from '../../store'

describe('formatSpeed', () => {
  it('shows -- when location failed', () => {
    const t = createStore()
    t.locationOk = false
    expect(formatSpeed(t)).toBe('--')
  })

  it('shows 0.0 when running but speed is unknown / standing', () => {
    expect(formatSpeed(createStore())).toBe('0.0')
  })

  it('shows speed to one decimal', () => {
    const t = createStore()
    t.speedKmh = 4.25
    expect(formatSpeed(t)).toBe('4.3')
  })
})
