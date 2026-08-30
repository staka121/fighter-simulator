import { describe, it, expect } from 'vitest'
import { formatGoalNav } from './format'
import { createStore, type Store } from '../../store'

/** A store at the origin with a single active goal at `g`. */
function atOriginWithGoal(g: { lat: number; lon: number; alt?: number }): Store {
  const t = createStore()
  t.lat = 0
  t.lon = 0
  t.goals = [g]
  t.activeGoalIndex = 0
  return t
}

describe('formatGoalNav', () => {
  it('shows all placeholders without a goal or a fix', () => {
    expect(formatGoalNav(createStore())).toBe('R --\nAL --\nB --\nT --:--\nSP --')
  })

  it('still placeholders when a goal is set but no position yet', () => {
    const t = createStore()
    t.goals = [{ lat: 35, lon: 139 }]
    t.activeGoalIndex = 0
    expect(formatGoalNav(t)).toBe('R --\nAL --\nB --\nT --:--\nSP --')
  })

  it('renders range, bearing and steerpoint once position + goal exist', () => {
    const lines = formatGoalNav(atOriginWithGoal({ lat: 0, lon: 1 })).split('\n') // due east
    expect(lines[0]).toMatch(/^R /)
    expect(lines[2]).toBe('B 090')
    expect(lines[4]).toBe('SP 00>01') // start (00) → first goal (01)
  })

  it('keeps `from` at the last reached steerpoint, not the previous index', () => {
    const t = atOriginWithGoal({ lat: 0, lon: 1 })
    t.goals.push({ lat: 0, lon: 2 }, { lat: 0, lon: 3 })
    // Switched to goal 02 before reaching 01 → still departing from the start.
    t.activeGoalIndex = 1
    expect(formatGoalNav(t).split('\n')[4]).toBe('SP 00>02')
    // After actually reaching 01, `from` is 01.
    t.fromSteerpoint = 1
    expect(formatGoalNav(t).split('\n')[4]).toBe('SP 01>02')
  })

  it('shows goal altitude when provided, -- otherwise', () => {
    expect(formatGoalNav(atOriginWithGoal({ lat: 0, lon: 1, alt: 500 })).split('\n')[1]).toBe(
      'AL 500',
    )
    expect(formatGoalNav(atOriginWithGoal({ lat: 0, lon: 1 })).split('\n')[1]).toBe('AL --')
  })

  it('shows -- time when not moving and MM:SS when moving', () => {
    const t = atOriginWithGoal({ lat: 0, lon: 1 })
    expect(formatGoalNav(t).split('\n')[3]).toBe('T --:--')
    t.avgSum = 3.6 // 3.6 km/h → 1 m/s over one sample
    t.avgCount = 1
    expect(formatGoalNav(t).split('\n')[3]).toMatch(/^T \d\d:\d\d$/)
  })
})
