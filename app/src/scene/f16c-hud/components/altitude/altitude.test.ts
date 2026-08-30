import { describe, it, expect } from 'vitest'
import { formatAltitude } from './altitude'
import { createStore } from '../../store'

describe('formatAltitude', () => {
  it('shows -- when location failed', () => {
    const t = createStore()
    t.locationOk = false
    t.altitude = 42
    expect(formatAltitude(t)).toBe('--')
  })

  it('shows -- before the first fix', () => {
    expect(formatAltitude(createStore())).toBe('--')
  })

  it('rounds altitude to whole metres', () => {
    const t = createStore()
    t.altitude = 42.6
    expect(formatAltitude(t)).toBe('43')
  })
})
