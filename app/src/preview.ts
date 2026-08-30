// Dev-only browser preview of the HUD — NOT part of the packaged app.
// Renders the real graphical draw code (clipped to the 288×144 center tile the
// glasses actually show) plus a MOCKUP of the surrounding full-width text
// readouts, tinted green-on-black. Sliders drive pitch/roll/FPM. Use it to
// design the layout before wiring text containers on-device. Values are dummy.
import { drawHud, PITCH_PX_PER_DEG } from './scene/f16c-hud/components/graphics/render'

const SCALE = 2
const W = 576
const H = 288
const TILE_W = 288
const TILE_H = 144
const TILE_X = (W - TILE_W) / 2 // 144
const TILE_Y = (H - TILE_H) / 2 // 72

const canvas = document.getElementById('hud') as HTMLCanvasElement
canvas.width = W * SCALE
canvas.height = H * SCALE
const ctx = canvas.getContext('2d')!

const state = { pitch: 0, roll: 0, fpmx: 0, fpmy: 0 }

const MONO = "bold 13px 'Courier New', monospace"

function text(s: string, x: number, y: number, align: CanvasTextAlign = 'left'): void {
  ctx.textAlign = align
  ctx.fillText(s, x, y)
}

/** Mockup of the surrounding text readouts (reference F-16C layout, dummy data). */
function drawReadouts(): void {
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.font = MONO
  ctx.textBaseline = 'middle'

  // Panel edges: left 144, right 432. Readouts hug just outside these.
  // --- LEFT of the panel ---
  text('1.1', 138, 110, 'right') // acceleration (G)
  ctx.strokeRect(92, 134, 46, 20) // airspeed box
  text('459', 134, 144, 'right')
  text('▸', 140, 144, 'left') // caret pointing in toward the FPM
  let y = 176
  for (const s of ['ARM', '0.78', '3.7', 'NAV']) {
    text(s, 138, y, 'right')
    y += 15
  }
  text('089 089', 138, 250, 'right') // bullseye bearing / distance

  // --- RIGHT of the panel ---
  text('◂', 436, 144, 'right') // caret pointing in toward the FPM
  ctx.strokeRect(438, 134, 46, 20) // altitude box
  text('6590', 442, 144, 'left')
  y = 176
  for (const s of ['R 4030', 'AL 500', 'B030.9', '003:38', '030>001']) {
    text(s, 438, y, 'left')
    y += 15
  }

  // --- BELOW the panel ---
  text('▲', 288, 226, 'center') // roll bank angle indicator
  // Magnetic heading tape — a little narrower than the panel, boxed heading.
  const hy = 246
  ctx.beginPath()
  for (let x = 160; x <= 416; x += 16) {
    ctx.moveTo(x, hy - 6)
    ctx.lineTo(x, hy - 2)
  }
  ctx.stroke()
  text('12', 192, hy + 8, 'center')
  text('15', 384, hy + 8, 'center')
  ctx.strokeRect(272, hy - 1, 32, 18)
  text('139', 288, hy + 8, 'center')

  // Missile ammo (bottom-left corner).
  ctx.font = "bold 15px 'Courier New', monospace"
  text('MSL 6', 12, 274, 'left')
}

function render(): void {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, W, H)

  // Central graphical HUD, clipped to the tile the glasses actually show.
  ctx.save()
  ctx.beginPath()
  ctx.rect(TILE_X, TILE_Y, TILE_W, TILE_H)
  ctx.clip()
  drawHud(ctx, W, H, {
    fpm: { x: state.fpmx, y: state.fpmy },
    horizonPx: state.pitch * PITCH_PX_PER_DEG,
    rollRad: (state.roll * Math.PI) / 180,
  })
  ctx.restore()

  // Surrounding text readouts (mockup).
  drawReadouts()

  // Tint white -> green (luminance into the green channel), like the HUD.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const lum = d[i]
    d[i] = 0
    d[i + 1] = lum
    d[i + 2] = 0
  }
  ctx.putImageData(img, 0, 0)

  // Guide: outline the 288×144 image tile actually shown on the glasses.
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.setLineDash([4, 4])
  ctx.strokeRect(TILE_X, TILE_Y, TILE_W, TILE_H)
  ctx.setLineDash([])
}

function bind(id: keyof typeof state): void {
  const input = document.getElementById(id) as HTMLInputElement
  const out = document.getElementById(`${id}v`) as HTMLOutputElement
  const update = () => {
    state[id] = Number(input.value)
    out.textContent = input.value
    render()
  }
  input.addEventListener('input', update)
}

;(['pitch', 'roll', 'fpmx', 'fpmy'] as const).forEach(bind)

document.getElementById('reset')!.addEventListener('click', () => {
  for (const id of ['pitch', 'roll', 'fpmx', 'fpmy'] as const) {
    const input = document.getElementById(id) as HTMLInputElement
    input.value = '0'
    input.dispatchEvent(new Event('input'))
  }
})

render()
