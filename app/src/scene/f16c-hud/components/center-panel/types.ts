/** The per-eye glasses canvas. Origin top-left, X right, Y down. */
export const CANVAS = { width: 576, height: 288 } as const

/**
 * HUD image tile. Confirmed on-device: an image wider than 288 is rejected and
 * breaks page creation, so the moving graphics live in ONE centered 288×144
 * image (no seam → no tearing). Full-width elements must be TEXT containers.
 */
export const TILES = [{ id: 1, name: 'hud', x: 144, y: 72, w: 288, h: 144 }] as const

/** Pixels per degree of pitch — shared by the driver (horizon position) and the
 * ladder (rung spacing) so they stay consistent. */
export const PITCH_PX_PER_DEG = 3

export const LADDER_STEP_DEG = 10
export const LADDER_MAX_DEG = 40
export const RUNG_OUTER = 116 // outer end of a numbered rung, inside the 288-wide tile
export const RUNG_SEG = 26 // length of each short rung segment (px)

/** Live dynamic state for the HUD symbology. */
export interface HudState {
  fpm: { x: number; y: number }
  horizonPx: number
  rollRad: number
}
