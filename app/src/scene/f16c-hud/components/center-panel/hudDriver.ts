import { ImageRawDataUpdate, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { renderTilePng } from './render/renderTilePng'
import { TILES, PITCH_PX_PER_DEG, type HudState } from './types'
import type { ImuSample } from '../../event-handlers/registerImuSampler'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const DEG = 180 / Math.PI

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

// Tuning — refine on-device.
const FRAME_MS = 120 // ~8 Hz; one tile, so smooth and within the send budget.

// Flight path marker (velocity vector) — spring-damper for inertia.
const FPM_MAX_X = 80 // max horizontal deflection (px)
const FPM_MAX_Y = 48 // max vertical deflection (px) — stay inside the 144-tall band
const FPM_VMAX = 8 // max speed (px/frame)
const FPM_GAIN = 360 // IMU g-delta -> px
const FPM_SMOOTH = 0.25 // low-pass on raw IMU
const FPM_STIFF = 0.1
const FPM_DAMP = 0.86
const SIGN_YAW = -1 // imu.y -> horizontal
const SIGN_PITCH_FPM = 1 // imu.x -> vertical

// Horizon / pitch ladder. (PITCH_PX_PER_DEG is shared from render.ts.)
const ANGLE_SMOOTH = 0.2 // low-pass on pitch/roll angles
const SIGN_HORIZON = 1 // pitch angle -> vertical px (look up => horizon up)
const SIGN_ROLL = -1 // roll angle -> rotation

/**
 * Drive all dynamic HUD symbology from the IMU in one throttled loop: the
 * flight path marker (spring-damper inertia) and the horizon/ladder (pitch/
 * roll). Re-renders the 2×2 tiles only when state changed, and sends only the
 * tiles whose pixels actually changed. Returns a stop fn.
 */
export function startHudDriver(bridge: EvenAppBridge, imu: ImuSample): () => void {
  let running = true

  const pos = { x: 0, y: 0 }
  const vel = { x: 0, y: 0 }
  const filt = { x: 0, y: 0 }
  let baseFpm: { x: number; y: number } | null = null

  let sPitch = 0
  let sRoll = 0
  let baseAngle: { pitch: number; roll: number } | null = null

  let last = { fx: NaN, fy: NaN, hy: NaN, rr: NaN }
  const lastBytes = new Map<number, Uint8Array>()

  async function loop() {
    while (running) {
      // --- flight path marker ---
      filt.x += (imu.x - filt.x) * FPM_SMOOTH
      filt.y += (imu.y - filt.y) * FPM_SMOOTH
      if (imu.received && !baseFpm) baseFpm = { x: filt.x, y: filt.y }
      const tx = baseFpm
        ? clamp(SIGN_YAW * (filt.y - baseFpm.y) * FPM_GAIN, -FPM_MAX_X, FPM_MAX_X)
        : 0
      const ty = baseFpm
        ? clamp(SIGN_PITCH_FPM * (filt.x - baseFpm.x) * FPM_GAIN, -FPM_MAX_Y, FPM_MAX_Y)
        : 0
      vel.x = clamp((vel.x + (tx - pos.x) * FPM_STIFF) * FPM_DAMP, -FPM_VMAX, FPM_VMAX)
      vel.y = clamp((vel.y + (ty - pos.y) * FPM_STIFF) * FPM_DAMP, -FPM_VMAX, FPM_VMAX)
      pos.x = clamp(pos.x + vel.x, -FPM_MAX_X, FPM_MAX_X)
      pos.y = clamp(pos.y + vel.y, -FPM_MAX_Y, FPM_MAX_Y)

      // --- horizon (pitch/roll from the accelerometer) ---
      const pitchDeg = Math.atan2(imu.x, imu.z) * DEG
      const rollDeg = Math.atan2(imu.y, imu.z) * DEG
      sPitch += (pitchDeg - sPitch) * ANGLE_SMOOTH
      sRoll += (rollDeg - sRoll) * ANGLE_SMOOTH
      if (imu.received && !baseAngle) baseAngle = { pitch: sPitch, roll: sRoll }
      const horizonPx = baseAngle ? SIGN_HORIZON * (sPitch - baseAngle.pitch) * PITCH_PX_PER_DEG : 0
      const rollRad = baseAngle ? (SIGN_ROLL * (sRoll - baseAngle.roll)) / DEG : 0

      // --- render on change; send only tiles whose pixels changed ---
      const fx = Math.round(pos.x)
      const fy = Math.round(pos.y)
      const hy = Math.round(horizonPx)
      const rr = Math.round(rollRad * DEG * 2) // 0.5° resolution
      if (fx !== last.fx || fy !== last.fy || hy !== last.hy || rr !== last.rr) {
        last = { fx, fy, hy, rr }
        const state: HudState = { fpm: { x: fx, y: fy }, horizonPx: hy, rollRad }
        for (const tile of TILES) {
          try {
            const bytes = await renderTilePng(tile, state)
            const prev = lastBytes.get(tile.id)
            if (prev && bytesEqual(prev, bytes)) continue
            lastBytes.set(tile.id, bytes)
            await bridge.updateImageRawData(
              new ImageRawDataUpdate({
                containerID: tile.id,
                containerName: tile.name,
                imageData: bytes,
              }),
            )
          } catch (e) {
            console.error('hud tile render failed:', e)
          }
        }
      }

      await sleep(FRAME_MS)
    }
  }

  void loop()
  return () => {
    running = false
  }
}
