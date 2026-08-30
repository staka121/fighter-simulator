import { PX_PER_DEG } from '../types'
import { visibleTicks, headingDigits } from '../tape-math'

const WHITE = '#ffffff'

const BOX_W = 46 // current-heading box
const BOX_H = 18
const BOX_TOP = 2
const TICK_TOP = 24 // where every tick starts (hangs downward)
const MINOR_LEN = 8 // 5° tick length
const MAJOR_LEN = 13 // 10° tick length (a touch longer)
const LABEL_Y = TICK_TOP + MAJOR_LEN + 8 // baseline for the plain tens labels

/**
 * Draw the heading tape into a tile-local canvas (origin top-left). The current
 * heading sits boxed at the centre; below it a compass scale scrolls: short 5°
 * ticks, slightly longer 10° ticks, and each 10° gridline's tens label plain
 * (unboxed) beneath its tick. `heading` is null before the first course fix.
 */
export function drawHeadingTape(
  ctx: CanvasRenderingContext2D,
  w: number,
  heading: number | null,
): void {
  const cx = w / 2

  ctx.strokeStyle = WHITE
  ctx.fillStyle = WHITE

  // Scrolling compass scale (only once we have a fix).
  if (heading != null) {
    ctx.font = '12px sans-serif'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    for (const t of visibleTicks(heading)) {
      const x = cx + t.delta * PX_PER_DEG
      if (x < 8 || x > w - 8) continue

      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, TICK_TOP)
      ctx.lineTo(x, TICK_TOP + (t.major ? MAJOR_LEN : MINOR_LEN))
      ctx.stroke()

      if (t.label) ctx.fillText(t.label, x, LABEL_Y)
    }
  }

  // Current heading, boxed, fixed at the centre (only value that gets a box).
  ctx.lineWidth = 1
  ctx.strokeRect(cx - BOX_W / 2, BOX_TOP, BOX_W, BOX_H)
  ctx.font = '15px sans-serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(heading == null ? '---' : headingDigits(heading), cx, BOX_TOP + BOX_H / 2 + 1)
}
