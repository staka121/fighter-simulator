import { ImageContainerProperty } from '@evenrealities/even_hub_sdk'
import { MINIMAP_TILE } from './types'

/** The minimap's image container (pixels pushed by the driver via
 * updateImageRawData). */
export function buildMinimapImageContainer(): ImageContainerProperty {
  return new ImageContainerProperty({
    xPosition: MINIMAP_TILE.x,
    yPosition: MINIMAP_TILE.y,
    width: MINIMAP_TILE.w,
    height: MINIMAP_TILE.h,
    containerID: MINIMAP_TILE.id,
    containerName: MINIMAP_TILE.name,
  })
}
