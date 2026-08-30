/**
 * Heading readout, bottom-centre. On the glasses image containers render *in
 * front of* text, so the tick scale is split into two static image strips that
 * flank the number box rather than covering it — the live value stays a text
 * box in the gap and updates off the image send channel. Only the panel and
 * minimap animate on that channel. Image width must stay ≤ 288.
 */
export const HEADING_NUM = { id: 10, name: 'headingNum', x: 262, y: 222, w: 52, h: 32 } as const

/** Two static tick strips flanking the number box, same height. `anchor` is the
 * side nearest the box; ticks grow outward from it, so the two strips mirror. */
export const HEADING_TICKS = [
  { id: 7, name: 'headingTicksL', x: 144, y: 222, w: 108, h: 32, anchor: 'right' },
  { id: 11, name: 'headingTicksR', x: 324, y: 222, w: 108, h: 32, anchor: 'left' },
] as const

export const TICK_MINOR = 16 // px between ticks
export const TICK_MAJOR_EVERY = 3 // every third tick is longer
