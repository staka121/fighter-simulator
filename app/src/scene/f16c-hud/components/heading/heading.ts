import { ImageContainerProperty } from '@evenrealities/even_hub_sdk'
import { HEADING_TILE } from './types'

/** The heading tape's image container (the tape pixels are pushed later by the
 * driver via updateImageRawData). */
export function buildHeadingImageContainer(): ImageContainerProperty {
  return new ImageContainerProperty({
    xPosition: HEADING_TILE.x,
    yPosition: HEADING_TILE.y,
    width: HEADING_TILE.w,
    height: HEADING_TILE.h,
    containerID: HEADING_TILE.id,
    containerName: HEADING_TILE.name,
  })
}
