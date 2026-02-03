// server/utils/anti-spam.ts

// Rate limiting configuration (power users can adjust)
export const RATE_LIMIT_CONFIG = {
  max: 5, // Max submissions per window
  windowMin: 15, // Time window (minutes)
  minFormTime: 2000, // Min time on form (ms)
} as const

export interface AntiSpamData {
  honeypot?: string
  timeOnForm?: number
  jsToken?: string
  turnstileToken?: string
}

export interface SpamFlags {
  honeypot: boolean
  fast: boolean
  noJs: boolean
  score: number // 0-100
}

/**
 * Validate UUID v4 format
 */
export function isValidUUID(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
}

/**
 * Validate anti-spam data and generate flags
 */
export function validateAntiSpam(data: AntiSpamData): SpamFlags {
  const flags: SpamFlags = {
    honeypot: false,
    fast: false,
    noJs: false,
    score: 0,
  }

  // Check honeypot
  if (data.honeypot?.trim()) {
    flags.honeypot = true
    flags.score = 100 // Instant bot detection
    return flags // Early return, no need to check other flags
  }

  // Check time on form
  if (data.timeOnForm !== undefined && data.timeOnForm < RATE_LIMIT_CONFIG.minFormTime) {
    flags.fast = true
    flags.score += 40
  }

  // Check JS token
  if (!data.jsToken || !isValidUUID(data.jsToken)) {
    flags.noJs = true
    flags.score += 30
  }

  flags.score = Math.min(flags.score, 100)
  return flags
}

/**
 * Rate limiter class for managing IP-based submission limits
 */
export class RateLimiter {
  private submissions = new Map<string, number[]>()

  constructor(
    private maxSubmissions = RATE_LIMIT_CONFIG.max,
    private windowMinutes = RATE_LIMIT_CONFIG.windowMin,
  ) {}

  /**
   * Check if IP has exceeded rate limit
   * Returns true if limit exceeded, false otherwise
   */
  check(ip: string): boolean {
    const now = Date.now()
    const windowMs = this.windowMinutes * 60 * 1000

    const submissions = this.submissions.get(ip) || []
    const recent = submissions.filter(time => now - time < windowMs)

    if (recent.length >= this.maxSubmissions) {
      return true // Limit exceeded
    }

    // Record this submission
    recent.push(now)
    this.submissions.set(ip, recent)

    // Periodic cleanup (1% chance)
    if (Math.random() < 0.01) {
      this.cleanup(windowMs)
    }

    return false // Within limits
  }

  /**
   * Clean up old entries
   */
  private cleanup(windowMs: number) {
    const now = Date.now()
    for (const [ip, times] of this.submissions.entries()) {
      const valid = times.filter(t => now - t < windowMs)
      if (valid.length === 0) {
        this.submissions.delete(ip)
      }
      else {
        this.submissions.set(ip, valid)
      }
    }
  }

  /**
   * Reset rate limiter (useful for testing)
   */
  reset() {
    this.submissions.clear()
  }

  /**
   * Get current submission count for IP (useful for testing)
   */
  getCount(ip: string): number {
    const now = Date.now()
    const windowMs = this.windowMinutes * 60 * 1000
    const submissions = this.submissions.get(ip) || []
    return submissions.filter(time => now - time < windowMs).length
  }
}
