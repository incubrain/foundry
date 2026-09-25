// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useEvents } from '@incubrain/foundry/modules/events/runtime/composables/useEvents'
import { toSignalRow } from '@incubrain/foundry/modules/events/runtime/utils/signal'

// Visitor identity is a server-side daily hash (product-validator-ev2.1): the
// client must neither store an ID nor send one.
describe('useEvents: no client-side visitor identity', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('tracks an event without writing to localStorage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    await useEvents().trackEvent({ type: 'ui.page', data: { from: '/' } })

    expect(setItem).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })

  it('sends no userId and no visitor on the signal row', () => {
    const row = toSignalRow({ id: 'e1', type: 'ui.page', timestamp: 1, data: { from: '/' } })

    expect(row.visitor).toBeUndefined()
    expect(row.data).not.toHaveProperty('userId')
  })
})
