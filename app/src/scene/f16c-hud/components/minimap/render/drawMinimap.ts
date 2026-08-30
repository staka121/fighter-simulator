import { RADIUS } from '../types'
import { projectMinimap } from '../projection'
import type { Store } from '../../../store'

const WHITE = '#ffffff'
const DIM = '#8a8a8a'

/**
 * Draw the heading-up minimap into a tile-local canvas (origin top-left). The
 * wearer is a fixed up-pointing marker at the centre; the compass rotates so
 * "ahead" is up. Goals are dots (active bright, others dim; off-range pinned to
 * the ring). A small N tick shows where north is. `headingDeg` is the smoothed
 * heading; goals need a GPS fix (store.lat/lon).
 */
export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  size: number,
  store: Store,
  headingDeg: number,
): void {
  const cx = size / 2
  const cy = size / 2

  ctx.strokeStyle = WHITE
  ctx.fillStyle = WHITE

  // Outer range ring.
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2)
  ctx.stroke()

  if (store.lat != null && store.lon != null) {
    const view = projectMinimap(
      { lat: store.lat, lon: store.lon },
      headingDeg,
      store.goals,
      store.activeGoalIndex,
      cx,
      cy,
    )

    // North tick on the ring, with an N just inside.
    const s = Math.sin(view.northAngleRad)
    const c = Math.cos(view.northAngleRad)
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx + (RADIUS - 6) * s, cy - (RADIUS - 6) * c)
    ctx.lineTo(cx + RADIUS * s, cy - RADIUS * c)
    ctx.stroke()
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('N', cx + (RADIUS - 13) * s, cy - (RADIUS - 13) * c)

    for (const p of view.points) {
      ctx.beginPath()
      if (p.active) {
        ctx.fillStyle = WHITE
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.clamped) {
        ctx.strokeStyle = DIM
        ctx.lineWidth = 1.5
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        ctx.stroke()
      } else {
        ctx.fillStyle = DIM
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // The wearer at the centre, always pointing up (heading-up).
  ctx.fillStyle = WHITE
  ctx.beginPath()
  ctx.moveTo(cx, cy - 5)
  ctx.lineTo(cx - 4, cy + 4)
  ctx.lineTo(cx + 4, cy + 4)
  ctx.closePath()
  ctx.fill()
}
