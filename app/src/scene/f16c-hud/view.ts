import {
  TextContainerProperty,
  ImageContainerProperty,
  CreateStartUpPageContainer,
} from '@evenrealities/even_hub_sdk'

/** The glasses canvas, per eye. Origin top-left, X right, Y down. */
export const CANVAS = { width: 576, height: 288 } as const

/** Geometric center of the canvas — the HUD boresight reference. */
export const CENTER = { x: CANVAS.width / 2, y: CANVAS.height / 2 } as const

/** Central HUD graphics layer. One image is capped at 288×144 (and a page
 * allows at most 4 images), so all central symbology is composited into this
 * single centered layer. */
export const HUD_GFX = { id: 1, name: 'hud', width: 288, height: 144 } as const

/** Image containers can't capture input, so a full-canvas transparent text
 * container sits behind them to receive taps. */
export const EVENT_LAYER = { id: 2, name: 'events' } as const

/** Build the initial HUD page: transparent event layer + boresight image. */
export function buildView(): CreateStartUpPageContainer {
  const gfx = new ImageContainerProperty({
    xPosition: CENTER.x - HUD_GFX.width / 2,
    yPosition: CENTER.y - HUD_GFX.height / 2,
    width: HUD_GFX.width,
    height: HUD_GFX.height,
    containerID: HUD_GFX.id,
    containerName: HUD_GFX.name,
  })

  const eventLayer = new TextContainerProperty({
    xPosition: 0,
    yPosition: 0,
    width: CANVAS.width,
    height: CANVAS.height,
    borderWidth: 0,
    borderColor: 0,
    paddingLength: 0,
    containerID: EVENT_LAYER.id,
    containerName: EVENT_LAYER.name,
    content: ' ',
    isEventCapture: 1,
  })

  return new CreateStartUpPageContainer({
    containerTotalNum: 2,
    textObject: [eventLayer],
    imageObject: [gfx],
  })
}
