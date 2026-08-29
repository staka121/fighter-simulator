// HUD symbology rendering for the G2 display.
//
// `bridge.updateImageRawData` accepts a Uint8Array of *encoded* image bytes
// (PNG/JPEG); the SDK/host decodes, resizes and converts to 4-bit greyscale
// (16 shades of green on black) internally. So we just draw white-on-black with
// the Canvas 2D API and export PNG bytes — perfect for vector HUD symbology.
//
// The continuous moving symbology (horizon, ladder, FPM, cross) lives in ONE
// centered 288×144 image. Splitting it across tiles tears at the seam: tiles
// are sent serially (not atomically), so a line crossing the boundary shows one
// half updated before the other. Discrete readouts (airspeed, altitude, ammo…)
// go in separate TEXT containers instead — independent updates don't tear.
// We draw the whole 576×288 HUD (`drawHud`) shifted so the tile shows its region.

/** The per-eye glasses canvas. Origin top-left, X right, Y down. */
export const CANVAS = { width: 576, height: 288 } as const

/**
 * HUD image tile. Confirmed on-device: an image wider than 288 is rejected and
 * breaks page creation, so the moving graphics live in ONE centered 288×144
 * image (no seam → no tearing). Full-width elements must be TEXT containers.
 */
export const TILES = [{ id: 1, name: 'hud', x: 144, y: 72, w: 288, h: 144 }] as const

/** Boresight cross: a small centered plus, the fixed airframe reference. */
export function drawBoresightCross(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const arm = 11
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - arm, cy)
  ctx.lineTo(cx + arm, cy)
  ctx.moveTo(cx, cy - arm)
  ctx.lineTo(cx, cy + arm)
  ctx.stroke()
}

/** Flight path marker: the "winged circle" velocity vector — a circle with two
 * horizontal wings and a short vertical stub on top. */
export function drawFlightPathMarker(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const r = 10
  const wing = 18
  const stub = 12

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.moveTo(cx - r, cy)
  ctx.lineTo(cx - r - wing, cy)
  ctx.moveTo(cx + r, cy)
  ctx.lineTo(cx + r + wing, cy)
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx, cy - r - stub)
  ctx.stroke()
}

/** Pixels per degree of pitch — shared by the driver (horizon position) and the
 * ladder (rung spacing) so they stay consistent. */
export const PITCH_PX_PER_DEG = 3

const LADDER_STEP_DEG = 10
const LADDER_MAX_DEG = 40
const RUNG_OUTER = 116 // outer end of a numbered rung, inside the 288-wide tile
const RUNG_SEG = 26 // length of each short rung segment (px)

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

/** Live dynamic state for the HUD symbology. */
export interface HudState {
  fpm: { x: number; y: number }
  horizonPx: number
  rollRad: number
}

/**
 * Composite the whole-canvas HUD symbology (local coords): horizon/pitch ladder
 * (pitch/roll), fixed boresight cross, and the flight path marker.
 */
export function drawHud(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: HudState,
): void {
  const cx = w / 2
  drawPitchLadder(ctx, w, h, state.horizonPx, state.rollRad)
  drawBoresightCross(ctx, cx, Math.round(h * 0.28))
  drawFlightPathMarker(ctx, cx + state.fpm.x, Math.round(h / 2) + state.fpm.y)
}

/** Render one tile of the full HUD to PNG bytes (draw the whole HUD shifted so
 * this tile's region lands in the tile canvas). */
export async function renderTilePng(
  tile: { x: number; y: number; w: number; h: number },
  state: HudState,
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = tile.w
  canvas.height = tile.h

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas context unavailable')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, tile.w, tile.h)
  ctx.save()
  ctx.translate(-tile.x, -tile.y)
  drawHud(ctx, CANVAS.width, CANVAS.height, state)
  ctx.restore()

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}
