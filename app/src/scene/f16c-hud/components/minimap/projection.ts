import { distanceMeters, initialBearing, norm, type LatLon } from '../../geo'
import type { GoalPoint } from '../../store'
import { RADIUS, FIT_FRACTION, MIN_RANGE_M, DEFAULT_RANGE_M } from './types'

export interface MiniPoint {
  x: number
  y: number
  active: boolean
  clamped: boolean // beyond range → pinned to the ring edge
}

export interface MiniView {
  points: MiniPoint[]
  rangeM: number
  northAngleRad: number // where north sits, heading-up (0 = up)
}

/**
 * Project goals onto a heading-up minimap: the wearer is at the centre facing
 * up, goals are placed by their bearing relative to the current heading and
 * their distance scaled to the range. The range fits the active goal (or the
 * farthest one) at FIT_FRACTION of the radius; goals beyond it pin to the edge.
 */
export function projectMinimap(
  here: LatLon,
  headingDeg: number,
  goals: GoalPoint[],
  activeIndex: number,
  cx: number,
  cy: number,
): MiniView {
  const dists = goals.map(g => distanceMeters(here, g))
  const activeDist = activeIndex >= 0 && activeIndex < goals.length ? dists[activeIndex] : null
  const fitDist = activeDist ?? (dists.length ? Math.max(...dists) : 0)
  const rangeM = fitDist > 0 ? Math.max(MIN_RANGE_M, fitDist / FIT_FRACTION) : DEFAULT_RANGE_M

  const points: MiniPoint[] = goals.map((g, i) => {
    const rel = norm(initialBearing(here, g) - headingDeg)
    const rad = (rel * Math.PI) / 180
    const rr = Math.min(RADIUS, (dists[i] / rangeM) * RADIUS)
    return {
      x: cx + rr * Math.sin(rad),
      y: cy - rr * Math.cos(rad),
      active: i === activeIndex,
      clamped: dists[i] > rangeM,
    }
  })

  return { points, rangeM, northAngleRad: (norm(-headingDeg) * Math.PI) / 180 }
}
