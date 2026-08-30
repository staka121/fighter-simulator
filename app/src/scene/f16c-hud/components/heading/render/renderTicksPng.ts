import { HEADING_TILE } from '../types'
import { drawHeadingTicks } from './drawHeadingTicks'

/** Render the static heading tick scale to PNG bytes (white-on-black). */
export async function renderTicksPng(): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = HEADING_TILE.w
  canvas.height = HEADING_TILE.h

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas context unavailable')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, HEADING_TILE.w, HEADING_TILE.h)
  drawHeadingTicks(ctx, HEADING_TILE.w, HEADING_TILE.h)

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}
