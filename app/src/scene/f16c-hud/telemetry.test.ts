import { describe, it, expect } from 'vitest'
import { createTelemetry, formatLeftData } from './telemetry'

describe('formatLeftData', () => {
  it('shows armed full load, zero average and STOP when idle', () => {
    expect(formatLeftData(createTelemetry())).toBe('ARM 6\nAVG 0.0\nINT 0\nSTOP')
  })

  it('averages moving speed and classifies walking', () => {
    const t = createTelemetry()
    t.speedKmh = 4
    t.avgSum = 8
    t.avgCount = 2
    const out = formatLeftData(t)
    expect(out).toContain('AVG 4.0')
    expect(out).toContain('WALK')
  })

  it('classifies running and vehicle speeds', () => {
    const run = createTelemetry()
    run.speedKmh = 10
    expect(formatLeftData(run)).toContain('RUN')

    const car = createTelemetry()
    car.speedKmh = 40
    expect(formatLeftData(car)).toContain('VEHICLE')
  })

  it('caps intensity at 100', () => {
    const t = createTelemetry()
    t.energy = 5
    expect(formatLeftData(t)).toContain('INT 100')
  })
})
