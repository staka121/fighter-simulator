import { describe, it, expect } from 'vitest'
import { projectMinimap } from './projection'

const HERE = { lat: 0, lon: 0 }
const NORTH = { lat: 0.001, lon: 0 } // ~111 m due north
const CX = 44
const CY = 44

describe('projectMinimap', () => {
  it('puts a goal dead ahead at the top when heading toward it', () => {
    const { points } = projectMinimap(HERE, 0, [NORTH], 0, CX, CY)
    expect(points[0].x).toBeCloseTo(CX, 1) // centred horizontally
    expect(points[0].y).toBeLessThan(CY) // above the centre
    expect(points[0].active).toBe(true)
  })

  it('rotates the goal to the left when facing east (heading 90)', () => {
    const { points } = projectMinimap(HERE, 90, [NORTH], 0, CX, CY)
    expect(points[0].x).toBeLessThan(CX) // north is now to the left
    expect(points[0].y).toBeCloseTo(CY, 1)
  })

  it('marks goals beyond the range as clamped', () => {
    // No active goal (index -1) → range fits the farthest; a much nearer and a
    // far goal, range fits the far one, so the near one is well inside.
    const far = { lat: 0.02, lon: 0 } // ~2.2 km
    const { points } = projectMinimap(HERE, 0, [NORTH, far], 1, CX, CY)
    expect(points[1].active).toBe(true)
    expect(points[0].clamped).toBe(false)
  })

  it('points the north tick up when heading north, left when facing east', () => {
    expect(projectMinimap(HERE, 0, [], -1, CX, CY).northAngleRad).toBeCloseTo(0, 5)
    expect(projectMinimap(HERE, 90, [], -1, CX, CY).northAngleRad).toBeCloseTo((3 * Math.PI) / 2, 5)
  })
})
