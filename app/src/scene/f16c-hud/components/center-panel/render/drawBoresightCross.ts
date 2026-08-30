/** Boresight cross: a small centered plus, the fixed airframe reference. */
export function drawBoresightCross(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const arm = 11
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - arm, cy)
  ctx.lineTo(cx + arm, cy)
  ctx.moveTo(cx, cy - arm)
  ctx.lineTo(cx, cy + arm)
  ctx.stroke()
}
