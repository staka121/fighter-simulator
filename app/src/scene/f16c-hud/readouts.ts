import { TextContainerProperty } from '@evenrealities/even_hub_sdk'

// Text readouts around the central graphics panel (panel edges: left 144,
// right 432, bottom 216). Text containers can be full-width and update
// independently, so they don't tear like tiled images. Values are placeholders
// until wired to real data; ammo is updated live by the missile handler.
//
// Budget: max 8 text containers per page. Event layer (1) + these (6) = 7.
export const READOUTS = {
  airspeed: { id: 3, name: 'airspeed' },
  altitude: { id: 4, name: 'altitude' },
  leftData: { id: 5, name: 'leftData' },
  rightData: { id: 6, name: 'rightData' },
  heading: { id: 7, name: 'heading' },
  ammo: { id: 8, name: 'ammo' },
} as const

export const AMMO_START = 6

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
    // Airspeed box, a few px left of the panel edge (144). No text-align field
    // exists, so the box is sized snug to the digits to fake centering.
    container({
      id: r.airspeed.id,
      name: r.airspeed.name,
      x: 88,
      y: 125,
      w: 52,
      h: 32,
      content: '0',
      boxed: true,
      pad: 1,
    }),
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
    // Left data block (below the airspeed box): walking telemetry, filled live
    // by the left-data driver. ARM / avg speed / intensity / movement / goal.
    container({
      id: r.leftData.id,
      name: r.leftData.name,
      x: 8,
      y: 162,
      w: 134,
      h: 92,
      content: 'AVG 0.0\nINT 0\nSTOP',
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
    // Heading tape + bank, below the panel.
    container({
      id: r.heading.id,
      name: r.heading.name,
      x: 180,
      y: 222,
      w: 216,
      h: 40,
      content: '     ▲\n 12   [139]   15',
    }),
    // Missile ammo, bottom-left.
    container({
      id: r.ammo.id,
      name: r.ammo.name,
      x: 10,
      y: 262,
      w: 90,
      h: 22,
      content: `MSL ${AMMO_START}`,
    }),
  ]
}
