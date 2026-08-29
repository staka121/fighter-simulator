// HUD symbology rendering for the G2 display.
//
// `bridge.updateImageRawData` accepts a Uint8Array of *encoded* image bytes
// (PNG/JPEG); the SDK/host decodes, resizes and converts to 4-bit greyscale
// (16 shades of green on black) internally. So we just draw white-on-black with
// the Canvas 2D API and export PNG bytes — perfect for vector HUD symbology.

/** Draw onto a fresh black canvas and return encoded PNG bytes. */
export async function renderToPngBytes(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas context unavailable')

  // Black = "off" (transparent on the HUD); white = fully lit green.
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  draw(ctx, width, height)

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}

/** Boresight cross: a simple centered plus, the fixed airframe reference. */
export function drawBoresightCross(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2
  const cy = h / 2
  const arm = Math.min(w, h) * 0.4

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - arm, cy)
  ctx.lineTo(cx + arm, cy)
  ctx.moveTo(cx, cy - arm)
  ctx.lineTo(cx, cy + arm)
  ctx.stroke()
}
