import {
  ImageRawDataUpdate,
  ImageRawDataUpdateResult,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk'
import type { Scene } from '../types'
import { buildView, BORESIGHT } from './view'
import { renderToPngBytes, drawBoresightCross } from './render'
import { registerExitOnDoubleTap } from './event-handlers/registerExitOnDoubleTap'

/**
 * The F-16C HUD scene: renders fighter HUD symbology and keeps it up while the
 * wearer walks around. Double-tap to exit.
 *
 * Symbology is drawn with the Canvas 2D API and sent as PNG bytes; the host
 * converts to 4-bit greyscale. See render.ts.
 */
export function createF16cHudScene(): Scene {
  let cleanups: Array<() => void> = []

  return {
    async enter(bridge: EvenAppBridge) {
      const created = await bridge.createStartUpPageContainer(buildView())
      if (created !== 0) console.error('HUD page create failed:', created)

      const bytes = await renderToPngBytes(BORESIGHT.width, BORESIGHT.height, drawBoresightCross)
      const drawn = await bridge.updateImageRawData(
        new ImageRawDataUpdate({
          containerID: BORESIGHT.id,
          containerName: BORESIGHT.name,
          imageData: bytes,
        }),
      )
      if (drawn !== ImageRawDataUpdateResult.success) console.error('boresight draw failed:', drawn)

      cleanups = [registerExitOnDoubleTap(bridge)]
    },

    leave() {
      cleanups.forEach(unsubscribe => unsubscribe())
      cleanups = []
    },
  }
}
