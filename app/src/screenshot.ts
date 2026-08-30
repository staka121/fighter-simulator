// Dev-only tool: compose the real HUD (all components) onto a single
// 576×288 canvas and export PNGs for the store listing. Green on a transparent
// background so the store can overlay it on an "environment" photo. NOT part of
// the packaged app.
import { drawHud, TILES, type HudState } from './scene/f16c-hud/components/center-panel'
import { drawHeadingTicks } from './scene/f16c-hud/components/heading/render/drawHeadingTicks'
import {
  HEADING_TICKS,
  HEADING_NUM,
  formatHeadingNumber,
} from './scene/f16c-hud/components/heading'
import { drawMinimap } from './scene/f16c-hud/components/minimap/render/drawMinimap'
import { MINIMAP_TILE } from './scene/f16c-hud/components/minimap'
import { createStore, type Store } from './scene/f16c-hud/store'
import { formatClock } from './scene/f16c-hud/components/clock'
import { formatSpeed } from './scene/f16c-hud/components/speed'
import { formatAltitude } from './scene/f16c-hud/components/altitude'
import { formatLeftData } from './scene/f16c-hud/components/left-data'
import { formatGoalNav } from './scene/f16c-hud/components/goal-nav'

const W = 576
const H = 288
const GREEN = '#5cff9e'
const FONT = "15px 'Courier New', monospace"
const LINE_H = 26

interface Scene {
  name: string
  store: Store
  hud: HudState
  date: Date
}

/** Draw white symbology onto an offscreen tile canvas and blit it into `ctx`. */
function tile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D) => void,
): void {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const cc = c.getContext('2d')!
  draw(cc)
  ctx.drawImage(c, x, y)
}

function multiline(ctx: CanvasRenderingContext2D, s: string, x: number, y: number): void {
  s.split('\n').forEach((line, i) => ctx.fillText(line, x, y + i * LINE_H))
}

/** Compose one scene into a fresh 576×288 canvas, tinted green on transparent. */
function compose(scene: Scene): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const { store, hud, date } = scene
  const heading = store.heading ?? 0

  // Graphics tiles (drawn white on transparent, matching the on-glass layout).
  const panel = TILES[0]
  tile(ctx, panel.x, panel.y, panel.w, panel.h, c => {
    c.translate(-panel.x, -panel.y)
    drawHud(c, W, H, hud)
  })
  for (const t of HEADING_TICKS) {
    tile(ctx, t.x, t.y, t.w, t.h, c => drawHeadingTicks(c, t.w, t.h, t.anchor))
  }
  tile(ctx, MINIMAP_TILE.x, MINIMAP_TILE.y, MINIMAP_TILE.w, MINIMAP_TILE.h, c =>
    drawMinimap(c, MINIMAP_TILE.w, store, heading),
  )

  // Text readouts.
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#ffffff'
  ctx.font = FONT
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  multiline(ctx, formatClock(date), 10, 8) // top-left clock
  multiline(ctx, formatLeftData(store), 10, 137) // left block
  multiline(ctx, formatGoalNav(store), 438, 137) // right block

  // Boxed readouts (speed / altitude / heading), centred in their frames.
  const box = (x: number, y: number, w: number, h: number, content: string) => {
    ctx.strokeRect(x, y, w, h)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(content, x + w / 2, y + h / 2 + 1)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
  }
  box(72, 96, 68, 32, formatSpeed(store))
  box(436, 96, 68, 32, formatAltitude(store))
  box(HEADING_NUM.x, HEADING_NUM.y, HEADING_NUM.w, HEADING_NUM.h, formatHeadingNumber(store))

  // Tint every drawn (non-transparent) pixel green, keep the transparent bg.
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = GREEN
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'source-over'

  return canvas
}

function scenes(): Scene[] {
  const nav = createStore()
  Object.assign(nav, {
    locationOk: true,
    speedKmh: 5.2,
    avgSum: 4.8,
    avgCount: 1,
    energy: 0.21,
    altitude: 38,
    lat: 35.6812,
    lon: 139.7671,
    heading: 42,
    goals: [
      { lat: 35.6849, lon: 139.7712, alt: 41 },
      { lat: 35.6788, lon: 139.7625 },
    ],
    activeGoalIndex: 0,
    fromSteerpoint: 0,
  })

  const cruise = createStore()
  Object.assign(cruise, {
    locationOk: true,
    speedKmh: 3.9,
    avgSum: 4.1,
    avgCount: 1,
    energy: 0.12,
    altitude: 45,
    lat: 35.6812,
    lon: 139.7671,
    heading: 118,
  })

  return [
    {
      name: 'navigate',
      store: nav,
      hud: { fpm: { x: 14, y: -8 }, horizonPx: 10, rollRad: 0.09 },
      date: new Date(2026, 0, 2, 7, 42, 15),
    },
    {
      name: 'cruise',
      store: cruise,
      hud: { fpm: { x: -10, y: 6 }, horizonPx: -14, rollRad: -0.12 },
      date: new Date(2026, 0, 2, 17, 5, 40),
    },
  ]
}

const root = document.getElementById('shots')!
for (const scene of scenes()) {
  const canvas = compose(scene)
  canvas.style.width = `${W}px` // shown at 1× on a checkerboard so transparency is visible
  canvas.className = 'shot'

  const link = document.createElement('a')
  link.textContent = `Download ${scene.name}.png (576×288)`
  link.download = `fighter-hud-${scene.name}.png`
  link.href = '#'
  link.className = 'dl'
  link.addEventListener('click', e => {
    e.preventDefault()
    link.href = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = link.href
    a.download = link.download
    a.click()
  })

  const wrap = document.createElement('div')
  wrap.className = 'wrap'
  wrap.append(canvas, link)
  root.append(wrap)
}
