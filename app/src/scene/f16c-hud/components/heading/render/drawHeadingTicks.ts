import { TICK_MINOR, TICK_MAJOR_EVERY, TICK_CLEAR } from '../types'

const WHITE = '#ffffff'

/**
 * Draw the static decorative tick scale that flanks the heading box. Purely
 * atmospheric — it never moves, so it is rendered once. Symmetric about the
 * centre, with a clear zone in the middle for the number box; every third tick
 * is longer.
 */
export function drawHeadingTicks(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2
  const midY = h / 2
  const maxOffset = w / 2 - 8

  ctx.strokeStyle = WHITE
  ctx.lineWidth = 1.5
  for (let o = 0; o <= maxOffset; o += TICK_MINOR) {
    if (o < TICK_CLEAR) continue
    const half = o % TICK_MAJOR_EVERY === 0 ? 8 : 5
    for (const x of [cx - o, cx + o]) {
      ctx.beginPath()
      ctx.moveTo(x, midY - half)
      ctx.lineTo(x, midY + half)
      ctx.stroke()
    }
  }
}
