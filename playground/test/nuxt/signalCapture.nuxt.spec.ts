// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useEvents } from '@incubrain/foundry/modules/events/runtime/composables/useEvents'
import { pageContext } from '@incubrain/foundry/modules/events/runtime/utils/signal'
import { SIGNAL_TEXT_MAX, type SignalInput } from '@incubrain/foundry/modules/events/runtime/types/signal'

// Everything the running app's plugins enqueue is read back off the wire: a
// `pagehide` makes the app's own queue beacon its rows, and `sendBeacon` is stubbed.
let sent: SignalInput[] = []
let sendBeacon: ReturnType<typeof vi.fn>

const drain = async () => {
  const before = sendBeacon.mock.calls.length
  window.dispatchEvent(new Event('pagehide'))
  for (const call of sendBeacon.mock.calls.slice(before)) {
    sent.push(...JSON.parse(await (call[1] as Blob).text()).rows)
  }
}
const named = (name: string) => sent.filter(row => row.name === name)

beforeEach(async () => {
  sendBeacon = vi.fn().mockReturnValue(true)
  vi.stubGlobal('navigator', { ...navigator, sendBeacon })
  await drain() // rows queued by the app's own plugins (ui.page, …)
  sent = []
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.history.replaceState({}, '', '/')
})

describe('page + referrer are truncated to the ingest limit', () => {
  it('shares one 512 limit with ingest', () => {
    expect(SIGNAL_TEXT_MAX).toBe(512)
  })

  it('truncates a long referrer and a long path', () => {
    vi.spyOn(document, 'referrer', 'get').mockReturnValue(`https://example.com/${'r'.repeat(900)}`)
    window.history.replaceState({}, '', `/${'p'.repeat(900)}`)

    const { page, referrer } = pageContext()

    expect(page).toHaveLength(SIGNAL_TEXT_MAX)
    expect(referrer).toHaveLength(SIGNAL_TEXT_MAX)
  })

  it('leaves short values and a missing referrer alone', () => {
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('')
    window.history.replaceState({}, '', '/pricing')

    expect(pageContext()).toMatchObject({ page: '/pricing', referrer: undefined })
  })
})

describe('form_error carries its message', () => {
  const track = (error: unknown) =>
    useEvents().trackEvent({
      type: 'form_error',
      target: 'payment_internal',
      data: { formData: { formId: 'hero' } },
      error,
    })

  it('puts the message in data.error', async () => {
    await track('Submission failed: 503')
    await drain()

    expect(named('form_error')[0]!.data).toMatchObject({ error: 'Submission failed: 503' })
  })

  it('takes only the message of an Error (no stack) and truncates it to 200', async () => {
    await track(new Error('x'.repeat(500)))
    await drain()

    const { error } = named('form_error')[0]!.data as { error: string }
    expect(error).toHaveLength(200)
    expect(JSON.stringify(named('form_error')[0])).not.toContain('at ')
  })

  it('never stringifies an arbitrary object — field values cannot leak through `error`', async () => {
    await track({ email: 'founder@example.com' })
    await drain()

    expect(named('form_error')[0]!.data).not.toHaveProperty('error')
    expect(JSON.stringify(named('form_error')[0])).not.toContain('founder@example.com')
  })
})

describe('chunk and app errors are captured', () => {
  const chunkError = (message: string) =>
    useNuxtApp().callHook('app:chunkError', { error: new Error(message) })

  it('records app:chunkError as chunk_error with its message', async () => {
    await chunkError('Failed to fetch dynamically imported module: /_nuxt/a1.js')
    await drain()

    expect(named('chunk_error')).toHaveLength(1)
    expect(named('chunk_error')[0]).toMatchObject({
      kind: 'log',
      severity: 'error',
      data: { message: 'Failed to fetch dynamically imported module: /_nuxt/a1.js' },
    })
  })

  it('records app:error', async () => {
    await useNuxtApp().callHook('app:error', new Error('render exploded'))
    await drain()

    expect(named('app_error')[0]!.data).toMatchObject({ message: 'render exploded' })
  })

  it('dedupes an identical (name, message) pair within 10s, then lets it through again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })

    await chunkError('loop: chunk 9 failed')
    await chunkError('loop: chunk 9 failed')
    await chunkError('loop: chunk 9 failed')
    await chunkError('a different chunk failed')
    await drain()
    expect(named('chunk_error').map(row => row.data!.message)).toEqual(['loop: chunk 9 failed', 'a different chunk failed'])

    vi.advanceTimersByTime(9_000)
    await chunkError('loop: chunk 9 failed')
    await drain()
    expect(named('chunk_error')).toHaveLength(2) // still inside the window

    vi.advanceTimersByTime(1_500)
    await chunkError('loop: chunk 9 failed')
    await drain()
    expect(named('chunk_error')).toHaveLength(3)
  })

  it('does not dedupe the same message under a different error name', async () => {
    await chunkError('shared text')
    await useNuxtApp().callHook('app:error', new Error('shared text'))
    await drain()

    expect(named('chunk_error')).toHaveLength(1)
    expect(named('app_error')).toHaveLength(1)
  })
})
