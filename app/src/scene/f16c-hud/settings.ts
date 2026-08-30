import { AMMO_START, type Store } from './store'

interface Item {
  label: (s: Store) => string
  run: () => void
}

/**
 * The scroll-down settings screen: a cursor-navigated list rendered as plain
 * text (scroll moves the cursor, tap activates). Master Arm / Reload mutate the
 * shared store directly; Close is delegated to the scene.
 */
export function createSettings(store: Store, actions: { close: () => void }) {
  const items: Item[] = [
    {
      label: s => `Master Arm : ${s.armed ? 'ARM' : 'SAFE'}`,
      run: () => {
        store.armed = !store.armed
      },
    },
    {
      label: s => `Reload     : ${s.ammo} rds`,
      run: () => {
        store.ammo = AMMO_START
      },
    },
    { label: () => 'Close', run: actions.close },
  ]
  let cursor = 0

  return {
    /** Reset the cursor to the top (call on open). */
    reset() {
      cursor = 0
    },
    /** Body text with the cursor marker on the current row. */
    text(): string {
      const rows = items.map((it, i) => `${i === cursor ? '>' : ' '} ${it.label(store)}`)
      return `SETTINGS\n\n${rows.join('\n')}`
    },
    /** Move the cursor (wraps). */
    move(delta: number) {
      cursor = (cursor + delta + items.length) % items.length
    },
    /** Run the current row's action. */
    activate() {
      items[cursor].run()
    },
  }
}
