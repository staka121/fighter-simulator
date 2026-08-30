import { RUNG_OUTER, RUNG_SEG, LADDER_MAX_DEG, LADDER_STEP_DEG, PITCH_PX_PER_DEG } from '../types'

/** One pitch-ladder rung at screen y. Angle 0 is the long horizon line with a
 * center gap; numbered rungs are short segments pushed to both ends with the
 * angle outboard and a tick bending toward the horizon (climb solid, dive
 * dashed). */
function drawRung(ctx: CanvasRenderingContext2D, w: number, angle: number, y: number): void {
  const neg = angle < 0
  const tick = neg ? -6 : 6

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.setLineDash(neg ? [5, 4] : [])
  ctx.beginPath()

  if (angle === 0) {
    const half = w / 2 - 6
    const gap = 24
    ctx.moveTo(-half, y)
    ctx.lineTo(-gap, y)
    ctx.moveTo(gap, y)
    ctx.lineTo(half, y)
    ctx.moveTo(-gap, y)
    ctx.lineTo(-gap, y + 6)
    ctx.moveTo(gap, y)
    ctx.lineTo(gap, y + 6)
    ctx.stroke()
    ctx.setLineDash([])
    return
  }

  const inner = RUNG_OUTER - RUNG_SEG
  ctx.moveTo(-RUNG_OUTER, y)
  ctx.lineTo(-inner, y)
  ctx.moveTo(inner, y)
  ctx.lineTo(RUNG_OUTER, y)
  ctx.moveTo(-inner, y)
  ctx.lineTo(-inner, y + tick)
  ctx.moveTo(inner, y)
  ctx.lineTo(inner, y + tick)
  ctx.stroke()
  ctx.setLineDash([])

  const label = String(Math.abs(angle))
  ctx.fillStyle = '#ffffff'
  ctx.font = '12px sans-serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  ctx.fillText(label, -RUNG_OUTER - 4, y)
  ctx.textAlign = 'left'
  ctx.fillText(label, RUNG_OUTER + 4, y)
}

/**
 * Pitch ladder: the horizon (0°) plus numbered climb/dive rungs, pitched by
 * `pitchPx` and rolled by `rollRad`. Rungs off the canvas are skipped.
 */
export function drawPitchLadder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pitchPx: number,
  rollRad: number,
): void {
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(rollRad)
  for (let a = -LADDER_MAX_DEG; a <= LADDER_MAX_DEG; a += LADDER_STEP_DEG) {
    const y = pitchPx - a * PITCH_PX_PER_DEG
    if (y < -h / 2 - 4 || y > h / 2 + 4) continue
    drawRung(ctx, w, a, y)
  }
  ctx.restore()
}
