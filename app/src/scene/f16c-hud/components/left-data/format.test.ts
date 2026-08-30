import { describe, it, expect } from 'vitest'
import { formatLeftData } from './format'
import { createStore } from '../../store'

describe('formatLeftData', () => {
  it('shows armed full load, zero average and STOP when idle', () => {
    expect(formatLeftData(createStore())).toBe('ARM 6\nAVG 0.0\nINT 0\nSTOP')
  })

  it('averages moving speed and classifies walking', () => {
    const t = createStore()
    t.speedKmh = 4
    t.avgSum = 8
    t.avgCount = 2
    const out = formatLeftData(t)
    expect(out).toContain('AVG 4.0')
    expect(out).toContain('WALK')
  })

  it('classifies running and vehicle speeds', () => {
    const run = createStore()
    run.speedKmh = 10
    expect(formatLeftData(run)).toContain('RUN')

    const car = createStore()
    car.speedKmh = 40
    expect(formatLeftData(car)).toContain('VEHICLE')
  })

  it('caps intensity at 100', () => {
    const t = createStore()
    t.energy = 5
    expect(formatLeftData(t)).toContain('INT 100')
  })
})
