import { TextContainerProperty } from '@evenrealities/even_hub_sdk'

// Static text readouts around the central graphics panel (panel edges: left
// 144, right 432, bottom 216). Text containers update independently, so they
// don't tear like tiled images. Live readouts (speed, heading, left data) own
// their own component; what remains here are the still-dummy altitude and right
// data blocks.
//
// Budget: max 8 text containers per page. Event layer (1) + speed + heading +
// left-data components (3) + these (2) = 6.
export const READOUTS = {
  altitude: { id: 4, name: 'altitude' },
  rightData: { id: 6, name: 'rightData' },
} as const

interface TextSpec {
  id: number
  name: string
  x: number
  y: number
  w: number
  h: number
  content: string
  boxed?: boolean
  pad?: number
}

// NOTE: the glasses render text at a fixed OS font size — there is no per-
// container font-size field. Fit text by sizing the container (and trimming
// paddingLength), not by shrinking the font.
function container(s: TextSpec): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: s.x,
    yPosition: s.y,
    width: s.w,
    height: s.h,
    borderWidth: s.boxed ? 1 : 0,
    borderColor: 5,
    paddingLength: s.pad ?? 2,
    containerID: s.id,
    containerName: s.name,
    content: s.content,
    isEventCapture: 0,
  })
}

/** Build the readout text containers laid out around the panel. */
export function buildReadoutContainers(): TextContainerProperty[] {
  const r = READOUTS
  return [
    // Altitude box, a few px right of the panel edge (432). Same snug baseline
    // as the airspeed box, widened for 4 digits.
    container({
      id: r.altitude.id,
      name: r.altitude.name,
      x: 436,
      y: 125,
      w: 68,
      h: 32,
      content: '6590',
      boxed: true,
      pad: 1,
    }),
    // Right data block (below the altitude box).
    container({
      id: r.rightData.id,
      name: r.rightData.name,
      x: 436,
      y: 158,
      w: 74,
      h: 100,
      content: 'R 4030\nAL 500\nB030.9\n003:38\n030>001',
    }),
  ]
}
