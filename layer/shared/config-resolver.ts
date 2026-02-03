// 0.base/shared/config-resolver.ts
import type { Resolver } from '@nuxt/kit'

export const getActiveConfigSource = (
  resolve: Resolver['resolve'],
  type: 'web' | 'docs' = 'web',
  rootDir: string = resolve('../../../'),
) => {
  return {
    rootDir,
    resolveLayer: (app: string = 'layer') => resolve(rootDir, app),
    srcDir: resolve(''),
    contentRoot: resolve('../shared/content'),
    contentDir: resolve('../shared/content', type),
    publicDir: resolve('../shared/public'),
    envDir: resolve('../../../'),
  }
}
