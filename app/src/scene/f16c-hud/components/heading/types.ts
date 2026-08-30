/**
 * Heading tape image tile — a dedicated 288-wide image just below the panel
 * (panel bottom is y216). It is its own tile, not part of the panel, so it can
 * render a real scrolling compass scale; its sends are serialised with the
 * panel through the shared image sender. Image width must stay ≤ 288.
 */
export const HEADING_TILE = { id: 7, name: 'heading', x: 144, y: 218, w: 288, h: 54 } as const

export const PX_PER_DEG = 9 // scale zoom → ±15° fills the tile width (≈±135 px)
export const TICK_STEP_DEG = 5 // minor tick spacing
export const MAJOR_STEP_DEG = 10 // labelled (major) tick spacing
export const SPAN_DEG = 15 // show 15° either side of the current heading
export const SCROLL_SMOOTH = 0.2 // low-pass toward the GPS heading (smooth scroll)
