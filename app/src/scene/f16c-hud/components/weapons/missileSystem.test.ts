import { describe, it, expect, vi } from 'vitest'
import { createMissileSystem } from './missileSystem'
import { createStore, AMMO_START } from '../../store'

function setup() {
  const store = createStore()
  const refresh = vi.fn()
  return { store, refresh, m: createMissileSystem(store, refresh) }
}

describe('missile system', () => {
  it('starts armed with a full load', () => {
    const { m } = setup()
    expect(m.isArmed()).toBe(true)
    expect(m.getAmmo()).toBe(AMMO_START)
  })

  it('decrements and refreshes on fire', () => {
    const { m, refresh } = setup()
    m.fire()
    expect(m.getAmmo()).toBe(AMMO_START - 1)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('never fires below zero', () => {
    const { m } = setup()
    for (let i = 0; i < AMMO_START + 5; i++) m.fire()
    expect(m.getAmmo()).toBe(0)
  })

  it('does not fire while safe', () => {
    const { m } = setup()
    m.toggleArm()
    expect(m.isArmed()).toBe(false)
    m.fire()
    expect(m.getAmmo()).toBe(AMMO_START)
  })

  it('reloads to a full load', () => {
    const { m } = setup()
    m.fire()
    m.fire()
    m.reload()
    expect(m.getAmmo()).toBe(AMMO_START)
  })
})
