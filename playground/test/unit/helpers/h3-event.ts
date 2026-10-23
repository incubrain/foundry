import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { createEvent } from 'h3'
import type { H3Event } from 'h3'

interface MakeEventOptions {
  method?: string
  url?: string
  headers?: Record<string, string>
  /** Raw request body; sets `content-length` so h3 reads it. */
  body?: string
}

/**
 * A real h3 event over Node's own request/response classes — so `getHeader`,
 * `setResponseHeader`, `readRawBody` and `event.context` behave exactly as they
 * do under Nitro, without booting a server.
 */
export function makeEvent({ method = 'GET', url = '/', headers = {}, body }: MakeEventOptions = {}): H3Event {
  const req = new IncomingMessage(new Socket())
  req.method = method
  req.url = url
  req.headers = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))

  if (body !== undefined) {
    req.headers['content-length'] = String(Buffer.byteLength(body))
    req.push(body)
    req.push(null)
  }

  return createEvent(req, new ServerResponse(req))
}
