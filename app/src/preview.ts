// Dev-only browser preview of the HUD graphics — NOT part of the packaged app.
// Renders the real draw functions to a canvas, tinted green-on-black to emulate
// the glasses, with sliders so we can match the reference UI without scanning.
import { drawHud, PITCH_PX_PER_DEG } from './scene/f16c-hud/render'

const SCALE = 2
const W = 576
const H = 288
const GW = 288 // central graphics layer
const GH = 144

const canvas = document.getElementById('hud') as HTMLCanvasElement
canvas.width = W * SCALE
canvas.height = H * SCALE
const ctx = canvas.getContext('2d')!

const state = { pitch: 0, roll: 0, fpmx: 0, fpmy: 0 }

function render(): void {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, W, H)

  // The central graphics layer is placed at the canvas center.
  ctx.save()
  ctx.translate((W - GW) / 2, (H - GH) / 2)
  drawHud(ctx, GW, GH, {
    fpm: { x: state.fpmx, y: state.fpmy },
    horizonPx: state.pitch * PITCH_PX_PER_DEG,
    rollRad: (state.roll * Math.PI) / 180,
  })
  ctx.restore()

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
