import { mkdirSync } from 'node:fs'
import fsDriver from 'unstorage/drivers/fs'

/**
 * Mount the `signals` ring buffer onto disk when `NUXT_SIGNAL_STORE_DIR` is
 * set, so a Railway redeploy/restart (or any host recycling the container)
 * does not lose unpulled rows. Falls back to Nitro's default in-memory driver
 * when unset — local dev, tests, and any ephemeral host without a volume.
 *
 * Read from `process.env` at Nitro *startup*, not baked into `nitro.storage`
 * in nuxt.config: a host like Railway injects its runtime environment into
 * the running container, which is set (and can change, e.g. across
 * environments) independently of when the image was built. Mounting here
 * means one build artifact works whether or not a volume is attached, and
 * `product-validator-ev2.7` (attaching the volume + setting this var per
 * service) needs no Foundry code change.
 */
export default defineNitroPlugin(() => {
  const dir = process.env.NUXT_SIGNAL_STORE_DIR
  if (!dir) return

  // The fs driver creates row files as needed, but not necessarily the volume
  // root itself on a first boot — make sure the mount path exists.
  try {
    mkdirSync(dir, { recursive: true })
  }
  catch {
    // If this fails the fs driver's own writes will too; surfaced there.
  }

  useStorage().mount('signals', fsDriver({ base: dir }))
})
