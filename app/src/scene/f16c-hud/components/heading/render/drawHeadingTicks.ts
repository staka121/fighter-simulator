import { TICK_MINOR, TICK_MAJOR_EVERY } from '../types'

const WHITE = '#ffffff'

/**
 * Draw one static tick strip. Ticks are spaced from the edge nearest the number
 * box (`anchor`) outward, so the left and right strips mirror around the box.
 * Every third tick is longer. Purely decorative — rendered once.
 */
export function drawHeadingTicks(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  anchor: 'left' | 'right',
): void {
  const midY = h / 2
  ctx.strokeStyle = WHITE
  ctx.lineWidth = 1.5
  for (let k = 1; k * TICK_MINOR <= w - 3; k++) {
    const d = k * TICK_MINOR
    const x = anchor === 'left' ? d : w - d
    const half = k % TICK_MAJOR_EVERY === 0 ? 8 : 5
    ctx.beginPath()
    ctx.moveTo(x, midY - half)
    ctx.lineTo(x, midY + half)
    ctx.stroke()
  }
}
