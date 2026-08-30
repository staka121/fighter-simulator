import { MINIMAP_TILE } from '../types'
import { drawMinimap } from './drawMinimap'
import type { Store } from '../../../store'

/** Render the minimap to PNG bytes (white-on-black); the host converts to 4-bit
 * greyscale. `headingDeg` is the smoothed heading used for heading-up rotation. */
export async function renderMinimapPng(store: Store, headingDeg: number): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = MINIMAP_TILE.w
  canvas.height = MINIMAP_TILE.h

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas context unavailable')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, MINIMAP_TILE.w, MINIMAP_TILE.h)
  drawMinimap(ctx, MINIMAP_TILE.w, store, headingDeg)

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}
