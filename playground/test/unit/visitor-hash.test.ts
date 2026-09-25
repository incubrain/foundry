import { describe, it, expect } from 'vitest'
import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import {
  createSaltKeeper,
  hashVisitor,
  utcDay,
} from '@incubrain/foundry/modules/events/server/utils/visitor-hash'

const DAY_MS = 24 * 60 * 60 * 1000
const MONDAY_NOON = Date.UTC(2026, 8, 21, 12)

const IP = '203.0.113.7'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'

/** A salt keeper over a fresh memory store, with a clock the test can move. */
const setup = (start = MONDAY_NOON) => {
  const storage = createStorage({ driver: memoryDriver() })
  const clock = { now: start }
  const salts = createSaltKeeper(storage, () => clock.now)
  const hashAt = async (ip = IP, userAgent: string | undefined = UA) =>
    hashVisitor({ salt: await salts.current(), site: 'acme', ip, userAgent })
  return { storage, clock, salts, hashAt }
}

describe('visitor hash (cookieless daily-salted identity)', () => {
  it('gives the same IP + UA the same hash all day', async () => {
    const { clock, hashAt } = setup()

    const morning = await hashAt()
    clock.now += 11 * 60 * 60 * 1000 // 23:00 UTC, same day
    const evening = await hashAt()

    expect(morning).toBe(evening)
    expect(morning).toMatch(/^[0-9a-f]{16}$/)
  })

  it('gives the same IP + UA a different hash the next UTC day', async () => {
    const { clock, hashAt } = setup()

    const today = await hashAt()
    clock.now += DAY_MS
    const tomorrow = await hashAt()

    expect(tomorrow).not.toBe(today)
  })

  it('separates visitors by IP, by UA and by site', async () => {
    const { salts, hashAt } = setup()
    const salt = await salts.current()

    const base = await hashAt()
    expect(await hashAt('198.51.100.1')).not.toBe(base)
    expect(await hashAt(IP, 'curl/8.4.0')).not.toBe(base)
    expect(await hashVisitor({ salt, site: 'other', ip: IP, userAgent: UA })).not.toBe(base)
  })

  it('keeps one salt in storage and deletes the previous one on rotation', async () => {
    const { storage, clock, salts } = setup()

    const first = await salts.current()
    clock.now += DAY_MS
    const second = await salts.current()

    expect(second).not.toBe(first)
    expect(await storage.getKeys()).toEqual(['visitor-salt'])
    expect(JSON.stringify(await storage.getItem('visitor-salt'))).not.toContain(first)
  })

  it('reuses the stored salt after a restart on the same day', async () => {
    const { storage, salts } = setup()
    const before = await salts.current()

    const restarted = createSaltKeeper(storage, () => MONDAY_NOON + 60_000)

    expect(await restarted.current()).toBe(before)
  })

  it('mints exactly one salt when the first calls of a day race', async () => {
    const { salts } = setup()

    const all = await Promise.all(Array.from({ length: 5 }, () => salts.current()))

    expect(new Set(all).size).toBe(1)
  })

  it('never stores the raw IP or UA', async () => {
    const { storage, hashAt } = setup()
    await hashAt()

    const stored = JSON.stringify(await storage.getItem('visitor-salt'))

    expect(stored).not.toContain(IP)
    expect(stored).not.toContain('Mozilla')
  })

  it('rotates on the UTC calendar day', () => {
    expect(utcDay(Date.UTC(2026, 8, 21, 23, 59, 59))).toBe('2026-09-21')
    expect(utcDay(Date.UTC(2026, 8, 22, 0, 0, 0))).toBe('2026-09-22')
  })
})
