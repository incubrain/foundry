// server/utils/logger.ts
import { consola } from 'consola'

/**
 * Create a tagged logger instance for server-side logging
 * @param tag - Tag to identify the logger (e.g., 'webhook', 'auth', 'email')
 */
export function createServerLogger(tag: string) {
  return consola.withTag(tag)
}

// Pre-configured loggers for common server operations
export const logger = createServerLogger('api')
