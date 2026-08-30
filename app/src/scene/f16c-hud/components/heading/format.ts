import type { Store } from '../../store'
import { norm } from '../../geo'

/** Current heading as a three-digit string, or --- before the first course fix. */
export function formatHeadingNumber(store: Store): string {
  return store.heading == null ? '---' : String(norm(Math.round(store.heading))).padStart(3, '0')
}
