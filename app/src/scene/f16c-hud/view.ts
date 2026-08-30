import {
  TextContainerProperty,
  ImageContainerProperty,
  CreateStartUpPageContainer,
} from '@evenrealities/even_hub_sdk'
import { CANVAS, TILES } from './components/center-panel'
import { buildSpeedContainer } from './components/speed'
import { buildHeadingImageContainer } from './components/heading'
import { buildLeftDataContainer } from './components/left-data'
import { buildReadoutContainers } from './readouts'
import { buildMenu } from './components/weapons'

/** Image containers can't capture input, so a full-canvas transparent text
 * container sits behind them to receive taps. */
export const EVENT_LAYER = { id: 2, name: 'events' } as const

/** Build the initial HUD page: the HUD image tile + a transparent event layer. */
export function buildView(): CreateStartUpPageContainer {
  const images = TILES.map(
    t =>
      new ImageContainerProperty({
        xPosition: t.x,
        yPosition: t.y,
        width: t.w,
        height: t.h,
        containerID: t.id,
        containerName: t.name,
      }),
  )

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

  const readouts = [buildSpeedContainer(), buildLeftDataContainer(), ...buildReadoutContainers()]

  // The heading tape is its own image tile below the panel (see components/heading).
  const imageObject = [...images, buildHeadingImageContainer()]

  return new CreateStartUpPageContainer({
    containerTotalNum: imageObject.length + 1 + readouts.length,
    textObject: [eventLayer, ...readouts],
    imageObject,
    menuObject: buildMenu(),
  })
}
