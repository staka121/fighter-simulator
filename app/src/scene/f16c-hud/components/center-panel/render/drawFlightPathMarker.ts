/** Flight path marker: the "winged circle" velocity vector — a circle with two
 * horizontal wings and a short vertical stub on top. */
export function drawFlightPathMarker(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const r = 10
  const wing = 18
  const stub = 12

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
