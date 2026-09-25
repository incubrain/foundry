import type { Storage } from 'unstorage'

/**
 * `visitor.hash` — the cookieless, consent-free visitor identity
 * (decision product-validator-ev2.1).
 *
 * `sha256(daily_salt + site + ip + user_agent)`, truncated. Nothing is stored on
 * the visitor's device, so there is nothing for ePrivacy Art. 5(3) to gate; the
 * raw IP is only ever an input to the digest and is never written anywhere.
 *
 * The salt is random, lives in the `signals` storage under one key, and is
 * replaced at UTC midnight — overwriting the key *is* the deletion of the old
 * salt. Once it is gone, yesterday's hashes can't be recomputed or linked to
 * today's: the same visitor is one value all day and a new value tomorrow.
 * Every adopted analytics feature (uniques, sessions, bounce, funnels, review
 * binding) is same-day, so that is the whole trade.
 */

const SALT_KEY = 'visitor-salt'
/** 64 bits of digest — collision-free at any plausible daily visitor count. */
const HASH_HEX_CHARS = 16

interface StoredSalt {
  day: string
  salt: string
}

/** UTC calendar day, `YYYY-MM-DD`. */
export const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

const randomSalt = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export interface SaltKeeper {
  /** Today's salt, rotating (and deleting the previous one) on the first call of a new UTC day. */
  current: () => Promise<string>
}

export function createSaltKeeper(storage: Storage, now: () => number = Date.now): SaltKeeper {
  let cached: StoredSalt | null = null
  // One in-flight rotation per day, so concurrent requests at midnight can't
  // each mint a different salt and split one visitor into two.
  let pending: Promise<StoredSalt> | null = null

  const load = async (day: string): Promise<StoredSalt> => {
    const stored = await storage.getItem<StoredSalt>(SALT_KEY)
    if (stored?.day === day && stored.salt) return stored

    const fresh = { day, salt: randomSalt() }
    await storage.setItem(SALT_KEY, fresh)
    return fresh
  }

  return {
    current: async () => {
      const day = utcDay(now())
      if (cached?.day === day) return cached.salt

      if (!pending) {
        pending = load(day).finally(() => {
          pending = null
        })
      }
      cached = await pending
      return cached.salt
    },
  }
}

export interface VisitorHashInput {
  salt: string
  site: string
  ip: string
  userAgent?: string | null
}

/** Pure digest — Web Crypto, so it runs on any Nitro preset. */
export async function hashVisitor({ salt, site, ip, userAgent }: VisitorHashInput): Promise<string> {
  const material = new TextEncoder().encode([salt, site, ip, userAgent ?? ''].join('\n'))
  const digest = await crypto.subtle.digest('SHA-256', material)
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, HASH_HEX_CHARS)
}
