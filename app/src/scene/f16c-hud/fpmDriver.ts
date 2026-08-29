import { ImageRawDataUpdate, type EvenAppBridge } from '@evenrealities/even_hub_sdk'
import { HUD_GFX } from './view'
import { renderToPngBytes, drawHud } from './render'
import type { ImuSample } from './event-handlers/registerImuSampler'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// Tuning — refine on-device.
const FRAME_MS = 120 // ~8 Hz; images can't be sent too often (glasses memory).
const MAX = 52 // max FPM deflection from boresight (px) — hard cap, always on-screen
const VMAX = 7 // max FPM speed (px/frame) — stops fast turns flinging it out
const GAIN = 240 // IMU g-delta -> px
const IMU_SMOOTH = 0.25 // low-pass on raw IMU (0..1); lower = smoother, laggier
const STIFF = 0.1 // spring pull toward target
const DAMP = 0.86 // velocity damping (inertia); higher = smoother, less overshoot
const SIGN_PITCH = 1 // imu.x (pitch) -> vertical offset
const SIGN_YAW = -1 // imu.y (yaw)   -> horizontal offset

/**
 * Drive the flight path marker from the IMU with a spring-damper so it drifts
 * with inertia and eases back to boresight — the velocity-vector feel.
 *
 * Runs an async loop that re-renders the HUD graphics layer only when the FPM
 * actually moved (so a still wearer sends no image frames). Returns a stop fn.
 */
export function startFpmDriver(bridge: EvenAppBridge, imu: ImuSample): () => void {
  let running = true
  const pos = { x: 0, y: 0 }
  const vel = { x: 0, y: 0 }
  const filt = { x: 0, y: 0 } // low-passed IMU
  let base: { x: number; y: number } | null = null
  let lastX = NaN
  let lastY = NaN

  async function loop() {
    while (running) {
      // Low-pass the raw IMU so fast-turn acceleration spikes don't jolt it.
      filt.x += (imu.x - filt.x) * IMU_SMOOTH
      filt.y += (imu.y - filt.y) * IMU_SMOOTH

      // Calibrate the rest pose from the first real sample (head level).
      if (imu.received && !base) base = { x: filt.x, y: filt.y }

      const targetX = base ? clamp(SIGN_YAW * (filt.y - base.y) * GAIN, -MAX, MAX) : 0
      const targetY = base ? clamp(SIGN_PITCH * (filt.x - base.x) * GAIN, -MAX, MAX) : 0

      // Spring-damper toward target, with a speed cap, then hard-clamp position
      // so a violent turn can never push the marker off the graphics layer.
      vel.x = clamp((vel.x + (targetX - pos.x) * STIFF) * DAMP, -VMAX, VMAX)
      vel.y = clamp((vel.y + (targetY - pos.y) * STIFF) * DAMP, -VMAX, VMAX)
      pos.x = clamp(pos.x + vel.x, -MAX, MAX)
      pos.y = clamp(pos.y + vel.y, -MAX, MAX)

      const rx = Math.round(pos.x)
      const ry = Math.round(pos.y)
      if (rx !== lastX || ry !== lastY) {
        lastX = rx
        lastY = ry
        try {
          const bytes = await renderToPngBytes(HUD_GFX.width, HUD_GFX.height, (ctx, w, h) =>
            drawHud(ctx, w, h, { x: rx, y: ry }),
          )
          await bridge.updateImageRawData(
            new ImageRawDataUpdate({
              containerID: HUD_GFX.id,
              containerName: HUD_GFX.name,
              imageData: bytes,
            }),
          )
        } catch (e) {
          console.error('fpm render failed:', e)
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
