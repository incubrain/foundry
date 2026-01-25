// 0.base/shared/config-resolver.ts
import type { Resolver } from '@nuxt/kit';

export const getActiveConfigSource = (
  resolve: Resolver['resolve'],
  type: 'web' | 'docs' = 'web',
  rootDir: string = resolve('../../../'),
) => {
  return {
    rootDir,
    resolveApp: (app: string) => resolve(rootDir, 'apps', app),
    srcDir: resolve(''),
    contentRoot: resolve('../shared/content'),
    contentDir: resolve('../shared/content', type),
    publicDir: resolve('../shared/public'),
    envDir: resolve('../../../'),
  };
};