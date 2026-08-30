import { describe, it, expect } from 'vitest'
import { formatGoalNav } from './format'
import { createStore } from '../../store'

describe('formatGoalNav', () => {
  it('shows all placeholders without a goal or a fix', () => {
    expect(formatGoalNav(createStore())).toBe('R --\nAL --\nB --\nT --:--\nSP --')
  })

  it('still placeholders when a goal is set but no position yet', () => {
    const t = createStore()
    t.goal = { lat: 35, lon: 139 }
    expect(formatGoalNav(t)).toBe('R --\nAL --\nB --\nT --:--\nSP --')
  })

  it('renders range, bearing and steerpoint once position + goal exist', () => {
    const t = createStore()
    t.lat = 0
    t.lon = 0
    t.goal = { lat: 0, lon: 1 } // due east
    const lines = formatGoalNav(t).split('\n')
    expect(lines[0]).toMatch(/^R /)
    expect(lines[2]).toBe('B 090')
    expect(lines[4]).toBe('SP 001')
  })

  it('shows goal altitude when provided, -- otherwise', () => {
    const t = createStore()
    t.lat = 0
    t.lon = 0
    t.goal = { lat: 0, lon: 1, alt: 500 }
    expect(formatGoalNav(t).split('\n')[1]).toBe('AL 500')
    t.goal = { lat: 0, lon: 1 }
    expect(formatGoalNav(t).split('\n')[1]).toBe('AL --')
  })

  it('shows -- time when not moving and MM:SS when moving', () => {
    const t = createStore()
    t.lat = 0
    t.lon = 0
    t.goal = { lat: 0, lon: 1 }
    expect(formatGoalNav(t).split('\n')[3]).toBe('T --:--')
    t.avgSum = 3.6 // 3.6 km/h → 1 m/s over one sample
    t.avgCount = 1
    expect(formatGoalNav(t).split('\n')[3]).toMatch(/^T \d\d:\d\d$/)
  })
})
