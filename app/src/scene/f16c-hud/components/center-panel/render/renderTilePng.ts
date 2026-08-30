import { HudState, CANVAS } from '../types'
import { drawHud } from './drawHud'

/** Render one tile of the full HUD to PNG bytes (draw the whole HUD shifted so
 * this tile's region lands in the tile canvas). */
export async function renderTilePng(
  tile: { x: number; y: number; w: number; h: number },
  state: HudState,
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = tile.w
  canvas.height = tile.h

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas context unavailable')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, tile.w, tile.h)
  ctx.save()
  ctx.translate(-tile.x, -tile.y)

  drawHud(ctx, CANVAS.width, CANVAS.height, state)
  ctx.restore()

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}
