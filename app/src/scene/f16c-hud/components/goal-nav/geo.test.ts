import { describe, it, expect } from 'vitest'
import { distanceMeters, initialBearing } from './geo'

describe('distanceMeters', () => {
  it('is zero for the same point', () => {
    expect(distanceMeters({ lat: 35, lon: 139 }, { lat: 35, lon: 139 })).toBe(0)
  })

  it('is ~111 km for one degree of latitude', () => {
    const d = distanceMeters({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })
    expect(d).toBeGreaterThan(111_000)
    expect(d).toBeLessThan(111_400)
  })
})

describe('initialBearing', () => {
  it('points north / east / south / west', () => {
    expect(initialBearing({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(0, 5)
    expect(initialBearing({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90, 5)
    expect(initialBearing({ lat: 0, lon: 0 }, { lat: -1, lon: 0 })).toBeCloseTo(180, 5)
    expect(initialBearing({ lat: 0, lon: 0 }, { lat: 0, lon: -1 })).toBeCloseTo(270, 5)
  })
})
