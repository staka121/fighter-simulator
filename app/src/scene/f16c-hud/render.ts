// HUD symbology rendering for the G2 display.
//
// `bridge.updateImageRawData` accepts a Uint8Array of *encoded* image bytes
// (PNG/JPEG); the SDK/host decodes, resizes and converts to 4-bit greyscale
// (16 shades of green on black) internally. So we just draw white-on-black with
// the Canvas 2D API and export PNG bytes — perfect for vector HUD symbology.
//
// A single image is capped at 288×144 and a page allows at most 4 image
// containers, so all central symbology is composited into ONE 288×144 layer
// (`drawHud`) rather than one container per symbol.

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

/** Boresight cross: a small centered plus, the fixed airframe reference. */
export function drawBoresightCross(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const arm = 9
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - arm, cy)
  ctx.lineTo(cx + arm, cy)
  ctx.moveTo(cx, cy - arm)
  ctx.lineTo(cx, cy + arm)
  ctx.stroke()
}

/** Flight path marker: the "winged circle" velocity vector — a circle with two
 * horizontal wings and a short vertical stub on top. */
export function drawFlightPathMarker(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const r = 8
  const wing = 15
  const stub = 10

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.moveTo(cx - r, cy)
  ctx.lineTo(cx - r - wing, cy)
  ctx.moveTo(cx + r, cy)
  ctx.lineTo(cx + r + wing, cy)
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx, cy - r - stub)
  ctx.stroke()
}

/**
 * Composite the central HUD symbology onto the graphics layer (local coords).
 * The boresight cross is fixed; the flight path marker is offset by `fpm`
 * (its live velocity-vector deflection from boresight).
 */
export function drawHud(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fpm: { x: number; y: number } = { x: 0, y: 0 },
): void {
  const cx = w / 2
  drawBoresightCross(ctx, cx, Math.round(h * 0.28))
  drawFlightPathMarker(ctx, cx + fpm.x, Math.round(h / 2) + fpm.y)
}
