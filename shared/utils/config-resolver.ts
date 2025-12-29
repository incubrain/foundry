import path from 'node:path';

export const getActiveConfigSource = () => {
  const source = process.env.NUXT_PUBLIC_CONFIG_SOURCE || 'founder-funnel';

  // Define available sources and their prefixes
  const sources: Record<string, string> = {
    'root': '.',
    'founder-funnel': 'templates/founder-funnel',
  };

  const prefix = sources[source] || sources['founder-funnel'];
  const rootDir = process.cwd();

  console.log(
    `[config-resolver] Resolved to: { source: '${source}', prefix: '${prefix}' }`,
  );

  return {
    source,
    prefix,
    // Absolute paths
    rootDir,
    contentDir: path.resolve(rootDir, prefix, 'content'),
    publicDir: path.resolve(rootDir, prefix, 'public'),
    configDir: path.resolve(rootDir, prefix, 'config'),
  };
};
