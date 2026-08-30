import { drawHeadingTicks } from './drawHeadingTicks'

/** Render one static heading tick strip to PNG bytes (white-on-black). */
export async function renderTicksPng(
  w: number,
  h: number,
  anchor: 'left' | 'right',
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas context unavailable')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)
  drawHeadingTicks(ctx, w, h, anchor)

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}
