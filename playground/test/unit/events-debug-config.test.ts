import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { loadNuxtConfig } from '@nuxt/kit'

// The layer's own nuxt.config, resolved the way Nuxt resolves it for a
// production build (`$production`) vs `nuxt dev` (`$development`).
const layerRoot = resolve(__dirname, '../../../layer')
const load = (envName: 'production' | 'development') =>
  loadNuxtConfig({ cwd: layerRoot, dotenv: false, overrides: { dev: envName === 'development' }, envName } as Parameters<typeof loadNuxtConfig>[0])

describe('event console echo is development-only', () => {
  it('is off in production: no per-event console.info on live consumer sites', async () => {
    const config = await load('production')

    expect(config.events?.debug).toBe(false)
    expect(config.runtimeConfig?.public?.debug).toBe(false)
  })

  it('is on under nuxt dev', async () => {
    const config = await load('development')

    expect(config.events?.debug).toBe(true)
    expect(config.runtimeConfig?.public?.debug).toBe(true)
  })
})
