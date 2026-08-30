import {
  TextContainerProperty,
  ImageContainerProperty,
  CreateStartUpPageContainer,
  RebuildPageContainer,
} from '@evenrealities/even_hub_sdk'
import { CANVAS, TILES } from './components/center-panel'
import { buildSpeedContainer } from './components/speed'
import { buildAltitudeContainer } from './components/altitude'
import { buildHeadingTickContainers, buildHeadingNumberContainer } from './components/heading'
import { buildMinimapImageContainer } from './components/minimap'
import { buildLeftDataContainer } from './components/left-data'
import { buildGoalNavContainer } from './components/goal-nav'
import { buildClockContainer } from './components/clock'

/** Image containers can't capture input, so a full-canvas transparent text
 * container sits behind them to receive taps/scrolls. */
export const EVENT_LAYER = { id: 2, name: 'events' } as const

/** The settings screen's body text (the scene rewrites it as the cursor moves).
 * Reuses an id from the HUD page — safe because the pages never coexist. */
export const SETTINGS_BODY = { id: 3, name: 'settings' } as const

/** Full-canvas transparent input-capture layer. */
function captureLayer(): TextContainerProperty {
  return new TextContainerProperty({
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
}

/** The HUD page's containers (shared by create and rebuild). */
function hudPage(): { textObject: TextContainerProperty[]; imageObject: ImageContainerProperty[] } {
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
  const readouts = [
    buildClockContainer(),
    buildSpeedContainer(),
    buildAltitudeContainer(),
    buildHeadingNumberContainer(),
    buildLeftDataContainer(),
    buildGoalNavContainer(),
  ]
  return {
    textObject: [captureLayer(), ...readouts],
    // Heading tick strips + minimap are their own image tiles (see components/).
    imageObject: [...images, ...buildHeadingTickContainers(), buildMinimapImageContainer()],
  }
}

/** Build the initial HUD page (createStartUpPageContainer — called once). No
 * custom menu: settings moved to the scroll-down screen. */
export function buildView(): CreateStartUpPageContainer {
  const { textObject, imageObject } = hudPage()
  return new CreateStartUpPageContainer({
    containerTotalNum: imageObject.length + textObject.length,
    textObject,
    imageObject,
  })
}

/** Rebuild back to the HUD page (after leaving settings). */
export function buildHudRebuild(): RebuildPageContainer {
  const { textObject, imageObject } = hudPage()
  return new RebuildPageContainer({
    containerTotalNum: imageObject.length + textObject.length,
    textObject,
    imageObject,
  })
}

/** Rebuild to the settings screen (scroll down). `content` is the cursor-
 * rendered body; the scene updates it in place as the cursor moves. */
export function buildSettingsRebuild(content: string): RebuildPageContainer {
  const body = new TextContainerProperty({
    xPosition: 70,
    yPosition: 54,
    width: 436,
    height: 180,
    borderWidth: 1,
    borderColor: 5,
    borderRadius: 8,
    paddingLength: 8,
    containerID: SETTINGS_BODY.id,
    containerName: SETTINGS_BODY.name,
    content,
    isEventCapture: 0,
  })
  return new RebuildPageContainer({
    containerTotalNum: 2,
    textObject: [captureLayer(), body],
  })
}
