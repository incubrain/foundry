// composables/useUserIdentity.ts

/**
 * Anonymous user identity for cross-session tracking
 *
 * Generates a unique ID on first call and persists in localStorage.
 * Subsequent calls return the existing ID.
 *
 * Uses Web Crypto API (built-in, no dependencies)
 */
export const useUserIdentity = () => {
  const { local } = useAppStorage()
  const USER_ID_KEY = 'userId'

  /**
   * Get or create user ID
   * - Returns existing ID if found in localStorage
   * - Generates new ID on first call and persists it
   * - Returns empty string on server (SSR guard)
   */
  const getUserId = (): string => {
    // SSR guard
    if (import.meta.server) return ''

    // Check if ID already exists
    let userId = local.get(USER_ID_KEY)

    // If not, create and store it
    if (!userId) {
      userId = `user_${crypto.randomUUID()}`
      local.set(USER_ID_KEY, userId)
    }

    return userId
  }

  return { getUserId }
}
