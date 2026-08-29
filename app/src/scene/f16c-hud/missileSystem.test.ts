import { describe, it, expect, vi } from 'vitest'
import type { EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { createMissileSystem } from './missileSystem'
import { AMMO_START } from './readouts'

function fakeBridge() {
  const textContainerUpgrade = vi.fn(() => Promise.resolve(true))
  const bridge = { textContainerUpgrade } as unknown as EvenAppBridge
  return { bridge, textContainerUpgrade }
}

describe('missile system', () => {
  it('starts armed with a full load', () => {
    const m = createMissileSystem(fakeBridge().bridge)
    expect(m.getAmmo()).toBe(AMMO_START)
  })

  it('decrements and refreshes the readout on fire', () => {
    const { bridge, textContainerUpgrade } = fakeBridge()
    const m = createMissileSystem(bridge)
    m.fire()
    expect(m.getAmmo()).toBe(AMMO_START - 1)
    expect(textContainerUpgrade).toHaveBeenCalledTimes(1)
  })

  it('never fires below zero', () => {
    const { bridge, textContainerUpgrade } = fakeBridge()
    const m = createMissileSystem(bridge)
    for (let i = 0; i < AMMO_START + 5; i++) m.fire()
    expect(m.getAmmo()).toBe(0)
    // No upgrade once empty.
    expect(textContainerUpgrade).toHaveBeenCalledTimes(AMMO_START)
  })
})
