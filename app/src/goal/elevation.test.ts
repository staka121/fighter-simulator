import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchElevation } from './elevation'

const stubFetch = (impl: () => unknown) => vi.stubGlobal('fetch', vi.fn(impl))

afterEach(() => vi.unstubAllGlobals())

describe('fetchElevation', () => {
  it('returns the first elevation value', async () => {
    stubFetch(async () => ({ ok: true, json: async () => ({ elevation: [38] }) }))
    expect(await fetchElevation(35, 139)).toBe(38)
  })

  it('returns null on a non-ok response', async () => {
    stubFetch(async () => ({ ok: false, json: async () => ({}) }))
    expect(await fetchElevation(35, 139)).toBeNull()
  })

  it('returns null on a network error', async () => {
    stubFetch(async () => {
      throw new Error('network')
    })
    expect(await fetchElevation(35, 139)).toBeNull()
  })

  it('returns null when the payload has no elevation', async () => {
    stubFetch(async () => ({ ok: true, json: async () => ({}) }))
    expect(await fetchElevation(35, 139)).toBeNull()
  })
})
