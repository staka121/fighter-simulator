import { ImageRawDataUpdate, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { HUD_GFX } from './view'
import { renderToPngBytes, drawHud, PITCH_PX_PER_DEG } from './render'
import type { ImuSample } from './event-handlers/registerImuSampler'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const DEG = 180 / Math.PI

// Tuning — refine on-device.
const FRAME_MS = 120 // ~8 Hz; images can't be sent too often (glasses memory).

// Flight path marker (velocity vector) — spring-damper for inertia.
const FPM_MAX = 52 // max deflection (px) — hard cap, always on-screen
const FPM_VMAX = 7 // max speed (px/frame)
const FPM_GAIN = 240 // IMU g-delta -> px
const FPM_SMOOTH = 0.25 // low-pass on raw IMU
const FPM_STIFF = 0.1
const FPM_DAMP = 0.86
const SIGN_YAW = -1 // imu.y -> horizontal
const SIGN_PITCH_FPM = 1 // imu.x -> vertical

// Horizon / pitch ladder. (PITCH_PX_PER_DEG is shared from render.ts.)
const ANGLE_SMOOTH = 0.2 // low-pass on pitch/roll angles
const SIGN_HORIZON = 1 // pitch angle -> vertical px (look up => horizon up)
const SIGN_ROLL = -1 // roll angle -> rotation (head right => horizon counter-clockwise)

/**
 * Drive all dynamic central HUD symbology from the IMU in one throttled loop:
 * the flight path marker (spring-damper inertia) and the horizon (pitch/roll).
 * Re-renders + sends the image only when something actually changed. Returns a
 * stop fn.
 */
export function startHudDriver(bridge: EvenAppBridge, imu: ImuSample): () => void {
  let running = true

  // FPM state
  const pos = { x: 0, y: 0 }
  const vel = { x: 0, y: 0 }
  const filt = { x: 0, y: 0 }
  let baseFpm: { x: number; y: number } | null = null

  // horizon state (smoothed angles + rest calibration)
  let sPitch = 0
  let sRoll = 0
  let baseAngle: { pitch: number; roll: number } | null = null

  let last = { fx: NaN, fy: NaN, hy: NaN, rr: NaN }

  async function loop() {
    while (running) {
      // --- flight path marker ---
      filt.x += (imu.x - filt.x) * FPM_SMOOTH
      filt.y += (imu.y - filt.y) * FPM_SMOOTH
      if (imu.received && !baseFpm) baseFpm = { x: filt.x, y: filt.y }
      const tx = baseFpm ? clamp(SIGN_YAW * (filt.y - baseFpm.y) * FPM_GAIN, -FPM_MAX, FPM_MAX) : 0
      const ty = baseFpm ? clamp(SIGN_PITCH_FPM * (filt.x - baseFpm.x) * FPM_GAIN, -FPM_MAX, FPM_MAX) : 0
      vel.x = clamp((vel.x + (tx - pos.x) * FPM_STIFF) * FPM_DAMP, -FPM_VMAX, FPM_VMAX)
      vel.y = clamp((vel.y + (ty - pos.y) * FPM_STIFF) * FPM_DAMP, -FPM_VMAX, FPM_VMAX)
      pos.x = clamp(pos.x + vel.x, -FPM_MAX, FPM_MAX)
      pos.y = clamp(pos.y + vel.y, -FPM_MAX, FPM_MAX)

      // --- horizon (pitch/roll from the accelerometer) ---
      const pitchDeg = Math.atan2(imu.x, imu.z) * DEG
      const rollDeg = Math.atan2(imu.y, imu.z) * DEG
      sPitch += (pitchDeg - sPitch) * ANGLE_SMOOTH
      sRoll += (rollDeg - sRoll) * ANGLE_SMOOTH
      if (imu.received && !baseAngle) baseAngle = { pitch: sPitch, roll: sRoll }
      const horizonPx = baseAngle ? SIGN_HORIZON * (sPitch - baseAngle.pitch) * PITCH_PX_PER_DEG : 0
      const rollRad = baseAngle ? (SIGN_ROLL * (sRoll - baseAngle.roll)) / DEG : 0

      // --- render only on change ---
      const fx = Math.round(pos.x)
      const fy = Math.round(pos.y)
      const hy = Math.round(horizonPx)
      const rr = Math.round(rollRad * DEG * 2) // 0.5° resolution
      if (fx !== last.fx || fy !== last.fy || hy !== last.hy || rr !== last.rr) {
        last = { fx, fy, hy, rr }
        try {
          const bytes = await renderToPngBytes(HUD_GFX.width, HUD_GFX.height, (ctx, w, h) =>
            drawHud(ctx, w, h, { fpm: { x: fx, y: fy }, horizonPx: hy, rollRad }),
          )
          await bridge.updateImageRawData(
            new ImageRawDataUpdate({
              containerID: HUD_GFX.id,
              containerName: HUD_GFX.name,
              imageData: bytes,
            }),
          )
        } catch (e) {
          console.error('hud render failed:', e)
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
