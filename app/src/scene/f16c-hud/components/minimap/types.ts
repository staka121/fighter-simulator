/**
 * Circular heading-up minimap image tile, top-right of the HUD (clear of the
 * altitude box at y96). Its own image tile; sends are serialised with the panel
 * and heading tape through the shared image sender. Width must stay ≤ 288.
 */
export const MINIMAP_TILE = { id: 8, name: 'minimap', x: 496, y: 0, w: 72, h: 72 } as const

export const RADIUS = 32 // ring radius (px); tile centre is w/2 = 36
export const FIT_FRACTION = 0.82 // the goal we fit sits at this fraction of the radius
export const MIN_RANGE_M = 30 // don't over-zoom for a very close goal
export const DEFAULT_RANGE_M = 200 // range shown when there is no goal to fit
export const SCROLL_SMOOTH = 0.2 // heading lerp toward the GPS course (smooth rotation)
