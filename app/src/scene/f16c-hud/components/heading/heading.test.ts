import { describe, it, expect } from 'vitest'
import { angularDiff, tensLabel, headingDigits, visibleTicks } from './tape-math'

describe('tensLabel', () => {
  it('renders gridlines as two-digit tens, wrapping at 360', () => {
    expect(tensLabel(120)).toBe('12')
    expect(tensLabel(0)).toBe('00')
    expect(tensLabel(350)).toBe('35')
    expect(tensLabel(360)).toBe('00')
  })
})

describe('headingDigits', () => {
  it('pads the digital readout to three digits and normalises', () => {
    expect(headingDigits(139)).toBe('139')
    expect(headingDigits(5)).toBe('005')
    expect(headingDigits(0)).toBe('000')
    expect(headingDigits(359.6)).toBe('000') // rounds to 360 → wraps to 0
    expect(headingDigits(-10)).toBe('350')
  })
})

describe('angularDiff', () => {
  it('takes the short way around 0/360', () => {
    expect(angularDiff(10, 350)).toBe(20)
    expect(angularDiff(350, 10)).toBe(-20)
    expect(angularDiff(139, 139)).toBe(0)
    expect(angularDiff(180, 0)).toBe(180)
  })
})

describe('visibleTicks', () => {
  it('puts a labelled major tick at the centre when heading is a 10° line', () => {
    const centre = visibleTicks(140).find(t => t.delta === 0)
    expect(centre).toEqual({ delta: 0, major: true, label: '14' })
  })

  it('labels every 10° and leaves 5° minor ticks unlabelled', () => {
    const ticks = visibleTicks(140)
    expect(ticks.find(t => t.delta === 10)).toEqual({ delta: 10, major: true, label: '15' })
    expect(ticks.find(t => t.delta === 5)).toEqual({ delta: 5, major: false, label: null })
  })

  it('wraps labels across north', () => {
    // heading 5°, the 0° gridline is 5° to the left and labels as "00".
    expect(visibleTicks(5).find(t => t.delta === -5)).toEqual({
      delta: -5,
      major: true,
      label: '00',
    })
  })
})
