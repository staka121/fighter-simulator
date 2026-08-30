/**
 * Heading readout, bottom-centre. The vertical tick marks are a *static* image
 * tile (drawn once, re-sent on a slow heartbeat), and the current heading is a
 * text box overlaid at the centre. So the live value updates off the image send
 * channel and never competes with the moving panel — only the panel and minimap
 * animate on that channel now. Image width must stay ≤ 288.
 */
export const HEADING_TILE = { id: 7, name: 'heading', x: 144, y: 222, w: 288, h: 32 } as const

/** The centred current-heading number box (text). */
export const HEADING_NUM = { id: 10, name: 'headingNum', x: 262, y: 222, w: 52, h: 32 } as const

export const TICK_MINOR = 16 // px between ticks
export const TICK_MAJOR_EVERY = 48 // every third tick is longer
export const TICK_CLEAR = 34 // half-width of the clear centre zone (for the box)
