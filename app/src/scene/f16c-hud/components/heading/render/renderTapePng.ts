import { HEADING_TILE } from '../types'
import { drawHeadingTape } from './drawHeadingTape'

/** Render the heading tape to PNG bytes (white-on-black); the host converts to
 * 4-bit greyscale. `heading` is null before the first GPS course fix. */
export async function renderTapePng(heading: number | null): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = HEADING_TILE.w
  canvas.height = HEADING_TILE.h

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas context unavailable')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, HEADING_TILE.w, HEADING_TILE.h)
  drawHeadingTape(ctx, HEADING_TILE.w, heading)

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}
