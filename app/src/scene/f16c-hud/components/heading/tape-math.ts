import { TICK_STEP_DEG, MAJOR_STEP_DEG, SPAN_DEG } from './types'

export const norm = (deg: number) => ((deg % 360) + 360) % 360

/** Signed smallest angle from `b` to `a`, in (-180, 180]. Used to scroll the
 * displayed heading toward the GPS heading the short way around 0/360. */
export function angularDiff(a: number, b: number): number {
  const d = norm(a - b)
  return d > 180 ? d - 360 : d
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Two-digit tens label for a heading gridline (120 → "12", 0/360 → "00"). */
export function tensLabel(deg: number): string {
  return pad2(norm(deg) / 10)
}

/** Digital heading readout, always three digits (139 → "139", 5 → "005"). */
export function headingDigits(deg: number): string {
  return String(norm(Math.round(deg))).padStart(3, '0')
}

export interface Tick {
  delta: number // signed degrees from the centre (current heading)
  major: boolean // a labelled 10° gridline
  label: string | null // tens label when major
}

/**
 * Compass ticks within ±SPAN_DEG of the current heading at TICK_STEP_DEG
 * spacing. `delta` is the raw signed offset (no wrap needed inside the window,
 * so placement is exact); `major`/`label` use the normalised absolute degree so
 * they wrap correctly across 0/360.
 */
export function visibleTicks(heading: number): Tick[] {
  const ticks: Tick[] = []
  const start = Math.ceil((heading - SPAN_DEG) / TICK_STEP_DEG) * TICK_STEP_DEG
  for (let d = start; d <= heading + SPAN_DEG; d += TICK_STEP_DEG) {
    const major = norm(d) % MAJOR_STEP_DEG === 0
    ticks.push({ delta: d - heading, major, label: major ? tensLabel(d) : null })
  }
  return ticks
}
