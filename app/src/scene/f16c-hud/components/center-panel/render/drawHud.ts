import { HudState } from '../types'

import { drawPitchLadder } from './drawPitchLadder'
import { drawBoresightCross } from './drawBoresightCross'
import { drawFlightPathMarker } from './drawFlightPathMarker'

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
