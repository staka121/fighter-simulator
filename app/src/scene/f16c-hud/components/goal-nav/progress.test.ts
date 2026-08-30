import { describe, it, expect } from 'vitest'
import { updateNavProgress } from './progress'
import { createStore } from '../../store'

describe('updateNavProgress', () => {
  it('does nothing while far from the active goal', () => {
    const t = createStore()
    t.lat = 0
    t.lon = 0
    t.goals = [{ lat: 0, lon: 1 }] // ~111 km east
    t.activeGoalIndex = 0
    updateNavProgress(t)
    expect(t.goals[0].reached).toBeFalsy()
    expect(t.fromSteerpoint).toBe(0)
    expect(t.activeGoalIndex).toBe(0)
  })

  it('marks reached and auto-advances to the next goal on arrival', () => {
    const t = createStore()
    t.goals = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 1 },
    ]
    t.activeGoalIndex = 0
    t.lat = 0
    t.lon = 0 // standing on goal 01
    updateNavProgress(t)
    expect(t.goals[0].reached).toBe(true)
    expect(t.fromSteerpoint).toBe(1)
    expect(t.activeGoalIndex).toBe(1) // advanced to goal 02
  })

  it('marks reached but does not advance past the final goal', () => {
    const t = createStore()
    t.goals = [{ lat: 0, lon: 0 }]
    t.activeGoalIndex = 0
    t.lat = 0
    t.lon = 0
    updateNavProgress(t)
    expect(t.goals[0].reached).toBe(true)
    expect(t.fromSteerpoint).toBe(1)
    expect(t.activeGoalIndex).toBe(0) // stays put (final)
  })

  it('is a no-op without an active goal or a fix', () => {
    const t = createStore()
    t.goals = [{ lat: 0, lon: 0 }]
    t.activeGoalIndex = 0
    updateNavProgress(t) // no lat/lon yet
    expect(t.goals[0].reached).toBeFalsy()
  })
})
