# Multi-Cloud Deployment Patterns

NuxtHub supports Cloudflare, Vercel, Netlify, and other cloud providers with auto-detection based on environment.

## Cloudflare

**Primary deployment target** - full feature support (D1, KV, R2, Cache).

### Auto-Configuration

NuxtHub generates wrangler.json from hub config:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  hub: {
    db: {
      dialect: 'sqlite',
      driver: 'd1',
      connection: { databaseId: '<database-id>' }
    },
    kv: {
      driver: 'cloudflare-kv-binding',
      namespaceId: '<kv-namespace-id>'
    },
    cache: {
      driver: 'cloudflare-kv-binding',
      namespaceId: '<cache-namespace-id>'
    },
    blob: {
      driver: 'cloudflare-r2',
      bucketName: '<bucket-name>'
    }
  }
})
```

### Observability (Recommended)

Enable logging for production:

```jsonc
// wrangler.jsonc
{
  "observability": {
    "logs": {
      "enabled": true,
      "head_sampling_rate": 1,
      "invocation_logs": true,
      "persist": true
    }
  }
}
```

### Create Resources

```bash
npx wrangler d1 create my-db
npx wrangler kv namespace create KV
npx wrangler kv namespace create CACHE
npx wrangler r2 bucket create my-bucket
```

### Environments

```bash
# Production
npx nuxi build

# Preview/Staging
CLOUDFLARE_ENV=preview npx nuxi build
```

Configure in wrangler.jsonc:

```jsonc
{
  "d1_databases": [{ "binding": "DB", "database_id": "prod-id" }],
  "env": {
    "preview": {
      "d1_databases": [{ "binding": "DB", "database_id": "preview-id" }]
    }
  }
}
```

## Vercel

Deploy NuxtHub apps on Vercel with marketplace integrations.

### Database

**Option 1: Vercel Postgres**

```bash
# Via Vercel dashboard: Storage > Create Database > Postgres
# Get DATABASE_URL from environment variables
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  hub: {
    db: {
      dialect: 'postgresql',
      driver: 'postgres-js'
      // DATABASE_URL env var auto-detected
    }
  }
})
```

**Option 2: Turso (SQLite)**

```bash
# Install via Vercel Marketplace
# Get TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
```

```ts
hub: {
  db: {
    dialect: 'sqlite',
    driver: 'libsql'
    // TURSO_* env vars auto-detected
  }
}
```

### KV Storage

**Vercel KV (Upstash Redis)**

```bash
# Via Vercel dashboard: Storage > Create > KV
# Get KV_REST_API_URL and KV_REST_API_TOKEN
```

```ts
hub: {
  kv: true
  // Auto-detects Vercel KV via env vars
}
```

**Alternative: Upstash Redis**

```ts
hub: {
  kv: {
    driver: 'redis',
    // UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
  }
}
```

### Blob Storage

**Vercel Blob**

```bash
# Via Vercel dashboard: Storage > Create > Blob
# Get BLOB_READ_WRITE_TOKEN
```

```ts
hub: {
  blob: true
  // Auto-detects Vercel Blob via env var
}
```

### Cache

Uses Vercel Runtime Cache (built-in):

```ts
hub: {
  cache: true
  // Auto-uses Vercel runtime cache in production
}
```

## Netlify

Compatible with NuxtHub via external database providers.

### Database

Use external providers via env vars:

- **Turso:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- **Neon:** `DATABASE_URL` (PostgreSQL)
- **PlanetScale:** `DATABASE_URL` (MySQL)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  hub: {
    db: {
      dialect: 'sqlite',
      driver: 'libsql' // or postgres-js, mysql2
    }
  }
})
```

### KV Storage

- **Upstash Redis:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **AWS S3 (as KV):** `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`

```ts
hub: {
  kv: true // Auto-detects provider
}
```

### Blob Storage

**AWS S3**

```bash
# Set env vars in Netlify dashboard
S3_ACCESS_KEY_ID=<key>
S3_SECRET_ACCESS_KEY=<secret>
S3_BUCKET=<bucket-name>
S3_REGION=<region>
```

```ts
hub: {
  blob: true // Auto-detects S3 config
}
```

## Other Providers (Generic)

### Deno Deploy

**Deno KV** (auto-detected):

```ts
hub: {
  kv: true // Uses Deno.openKv()
}
```

### AWS / Self-Hosted

**Database:**

- PostgreSQL: `DATABASE_URL`
- MySQL: `DATABASE_URL` or `MYSQL_URL`
- SQLite: Local filesystem

**Blob (S3):**

```ts
hub: {
  blob: {
    driver: 's3',
    // S3_* env vars
  }
}
```

**KV (S3 or Redis):**

```ts
hub: {
  kv: {
    driver: 'redis',
    // REDIS_URL or S3 config
  }
}
```

## Provider Detection

NuxtHub auto-detects hosting environment via:

1. `NITRO_PRESET` env var
2. Platform-specific env vars (Vercel, Netlify, Cloudflare)
3. Explicit driver configuration in hub config

**Manual override:**

```ts
nitro: {
  preset: 'cloudflare-pages' // or 'vercel', 'netlify', etc.
}
```

## Environment Variables Summary

| Provider   | Database                    | KV                                     | Blob                    |
| ---------- | --------------------------- | -------------------------------------- | ----------------------- |
| Cloudflare | Config (database_id)        | Config (namespace_id)                  | Config (bucket_name)    |
| Vercel     | `DATABASE_URL`              | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | `BLOB_READ_WRITE_TOKEN` |
| Netlify    | `DATABASE_URL`, `TURSO_*`   | `UPSTASH_*`, `S3_*`                    | `S3_*`                  |
| Generic    | `DATABASE_URL`, `MYSQL_URL` | `REDIS_URL`, `UPSTASH_*`, `S3_*`       | `S3_*`                  |
| Deno       | `DATABASE_URL` or Turso     | Auto (Deno.openKv)                     | `S3_*`                  |

## Best Practices

1. **Cloudflare:** Use hub config in nuxt.config, add observability in wrangler.jsonc
2. **Vercel:** Leverage Vercel Marketplace for managed services
3. **Other providers:** Use env vars for credentials, avoid hardcoding in config
4. **Development:** Use `hub.remote: true` to test with production bindings locally
5. **Secrets:** Store in platform secret managers, not in git
