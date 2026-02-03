// server/utils/anti-spam.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { isValidUUID, validateAntiSpam, RateLimiter, type AntiSpamData } from '../server/utils/anti-spam'

describe('isValidUUID', () => {
  it('should validate correct UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(false) // v1
  })

  it('should reject invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
    expect(isValidUUID('')).toBe(false)
    expect(isValidUUID('123')).toBe(false)
  })

  it('should handle edge cases', () => {
    expect(isValidUUID(null as any)).toBe(false)
    expect(isValidUUID(undefined as any)).toBe(false)
    expect(isValidUUID(123 as any)).toBe(false)
  })
})

describe('validateAntiSpam', () => {
  it('should return clean flags for valid submission', () => {
    const data: AntiSpamData = {
      honeypot: '',
      timeOnForm: 5000,
      jsToken: '550e8400-e29b-41d4-a716-446655440000',
    }

    const flags = validateAntiSpam(data)

    expect(flags.honeypot).toBe(false)
    expect(flags.fast).toBe(false)
    expect(flags.noJs).toBe(false)
    expect(flags.score).toBe(0)
  })

  it('should detect honeypot with score 100', () => {
    const data: AntiSpamData = {
      honeypot: 'https://spam.com',
      timeOnForm: 5000,
      jsToken: '550e8400-e29b-41d4-a716-446655440000',
    }

    const flags = validateAntiSpam(data)

    expect(flags.honeypot).toBe(true)
    expect(flags.score).toBe(100)
  })

  it('should flag fast submission', () => {
    const data: AntiSpamData = {
      honeypot: '',
      timeOnForm: 1000, // < 2000ms
      jsToken: '550e8400-e29b-41d4-a716-446655440000',
    }

    const flags = validateAntiSpam(data)

    expect(flags.fast).toBe(true)
    expect(flags.score).toBe(40)
  })

  it('should flag missing JS token', () => {
    const data: AntiSpamData = {
      honeypot: '',
      timeOnForm: 5000,
      jsToken: '',
    }

    const flags = validateAntiSpam(data)

    expect(flags.noJs).toBe(true)
    expect(flags.score).toBe(30)
  })

  it('should flag invalid JS token', () => {
    const data: AntiSpamData = {
      honeypot: '',
      timeOnForm: 5000,
      jsToken: 'not-a-uuid',
    }

    const flags = validateAntiSpam(data)

    expect(flags.noJs).toBe(true)
    expect(flags.score).toBe(30)
  })

  it('should combine multiple flags', () => {
    const data: AntiSpamData = {
      honeypot: '',
      timeOnForm: 1000, // Fast
      jsToken: 'invalid', // No JS
    }

    const flags = validateAntiSpam(data)

    expect(flags.fast).toBe(true)
    expect(flags.noJs).toBe(true)
    expect(flags.score).toBe(70) // 40 + 30
  })

  it('should cap score at 100', () => {
    const data: AntiSpamData = {
      honeypot: 'spam',
      timeOnForm: 100,
      jsToken: '',
    }

    const flags = validateAntiSpam(data)

    expect(flags.score).toBe(100) // Not 170
  })

  it('should handle empty data', () => {
    const flags = validateAntiSpam({})

    expect(flags.noJs).toBe(true)
    expect(flags.score).toBe(30)
  })
})

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter(3, 1) // 3 submissions per 1 minute for testing
  })

  it('should allow submissions within limit', () => {
    expect(limiter.check('192.168.1.1')).toBe(false)
    expect(limiter.check('192.168.1.1')).toBe(false)
    expect(limiter.check('192.168.1.1')).toBe(false)
    expect(limiter.getCount('192.168.1.1')).toBe(3)
  })

  it('should block submissions exceeding limit', () => {
    limiter.check('192.168.1.1')
    limiter.check('192.168.1.1')
    limiter.check('192.168.1.1')

    expect(limiter.check('192.168.1.1')).toBe(true) // 4th attempt blocked
    expect(limiter.getCount('192.168.1.1')).toBe(3) // Still only 3 counted
  })

  it('should track different IPs separately', () => {
    limiter.check('192.168.1.1')
    limiter.check('192.168.1.1')
    limiter.check('192.168.1.1')

    expect(limiter.check('192.168.1.2')).toBe(false) // Different IP allowed
    expect(limiter.getCount('192.168.1.2')).toBe(1)
  })

  it('should reset rate limiter', () => {
    limiter.check('192.168.1.1')
    limiter.check('192.168.1.1')
    limiter.check('192.168.1.1')

    limiter.reset()

    expect(limiter.getCount('192.168.1.1')).toBe(0)
    expect(limiter.check('192.168.1.1')).toBe(false)
  })

  it('should expire old submissions', async () => {
    const fastLimiter = new RateLimiter(2, 0.01) // 2 per 0.6 seconds

    fastLimiter.check('192.168.1.1')
    fastLimiter.check('192.168.1.1')

    expect(fastLimiter.check('192.168.1.1')).toBe(true) // Blocked

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 700))

    expect(fastLimiter.check('192.168.1.1')).toBe(false) // Allowed again
  })
})
