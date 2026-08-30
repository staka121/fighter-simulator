import { describe, it, expect } from 'vitest'
import { updateNavProgress } from './progress'
import { createStore } from '../../store'

describe('updateNavProgress', () => {
  it('does not advance `from` while still far from the active goal', () => {
    const t = createStore()
    t.lat = 0
    t.lon = 0
    t.goals = [{ lat: 0, lon: 1 }] // ~111 km east
    t.activeGoalIndex = 0
    updateNavProgress(t)
    expect(t.fromSteerpoint).toBe(0)
  })

  it('advances `from` to the active steerpoint on arrival', () => {
    const t = createStore()
    t.goals = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 1 },
    ]
    t.activeGoalIndex = 1
    t.lat = 0
    t.lon = 1 // standing on goal 02
    updateNavProgress(t)
    expect(t.fromSteerpoint).toBe(2)
  })

  it('is a no-op without an active goal or a fix', () => {
    const t = createStore()
    t.goals = [{ lat: 0, lon: 0 }]
    t.activeGoalIndex = 0
    updateNavProgress(t) // no lat/lon yet
    expect(t.fromSteerpoint).toBe(0)
  })
})
