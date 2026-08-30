import { describe, it, expect, vi } from 'vitest'
import { createSettings } from './settings'
import { createStore, AMMO_START } from './store'

describe('createSettings', () => {
  it('renders the cursor on the first row and reflects store state', () => {
    const s = createSettings(createStore(), { close: () => {} })
    const lines = s.text().split('\n')
    expect(lines[0]).toBe('SETTINGS')
    expect(lines[2]).toBe('> Master Arm : ARM') // cursor on row 0
    expect(lines[3]).toBe('  Reload     : 6 rds')
    expect(lines[4]).toBe('  Close')
  })

  it('moves the cursor with wrap-around', () => {
    const s = createSettings(createStore(), { close: () => {} })
    s.move(-1) // wraps to the last row (Close)
    expect(s.text().split('\n')[4]).toBe('> Close')
    s.move(1) // wraps back to the top
    expect(s.text().split('\n')[2]).toMatch(/^> Master Arm/)
  })

  it('toggles master arm and reloads via activate', () => {
    const store = createStore()
    store.armed = true
    store.ammo = 2
    const s = createSettings(store, { close: () => {} })
    s.activate() // Master Arm
    expect(store.armed).toBe(false)
    s.move(1)
    s.activate() // Reload
    expect(store.ammo).toBe(AMMO_START)
  })

  it('delegates Close to the scene', () => {
    const close = vi.fn()
    const s = createSettings(createStore(), { close })
    s.move(-1) // Close row
    s.activate()
    expect(close).toHaveBeenCalledOnce()
  })
})
