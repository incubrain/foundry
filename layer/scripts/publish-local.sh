#!/usr/bin/env bash
#
# Publish the layer to the local verdaccio registry (http://localhost:4873)
# under the `local` dist-tag. Consumers (astronera, incubrain) install via
# `pnpm add @incubrain/foundry@local --registry http://localhost:4873`.
#
# Each publish gets a unique prerelease version (epoch-suffixed) so verdaccio
# always serves the freshest local build.
#
# The version bump is in-memory only — we snapshot package.json before the
# bump and restore it after, preserving any other uncommitted changes you
# may have in the file.
#
# Auth: verdaccio rejects unauthenticated publishes even when the package's
# `publish` ACL is `$anonymous` — the npm client refuses to send no-auth
# requests. We register a throwaway local user on first run and cache the
# token in .verdaccio/auth-token (gitignored).
set -e

REGISTRY="http://localhost:4873"
PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$PKG_DIR/.." && pwd)"
TOKEN_FILE="$REPO_ROOT/.verdaccio/auth-token"

cd "$PKG_DIR"

# Verify verdaccio is reachable.
if ! curl -fs "$REGISTRY/-/ping" >/dev/null 2>&1 \
  && ! node -e "fetch('$REGISTRY/-/ping').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))" 2>/dev/null; then
  echo "❌ Verdaccio is not running at $REGISTRY"
  echo "   Start it with: verdaccio --config .verdaccio/config.yaml"
  exit 1
fi

# Register a local user on first run; cache the token thereafter.
if [ ! -f "$TOKEN_FILE" ]; then
  echo "→ Registering local verdaccio user (one-time)"
  TOKEN=$(node -e "
    fetch('$REGISTRY/-/user/org.couchdb.user:foundry-local', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'foundry-local', password: 'foundry-local', email: 'foundry-local@example.com' }),
    })
    .then(r => r.json())
    .then(b => { if (!b.token) { console.error(b); process.exit(1) } process.stdout.write(b.token) })
    .catch(e => { console.error(e.message); process.exit(1) })
  ")
  mkdir -p "$REPO_ROOT/.verdaccio"
  echo "$TOKEN" > "$TOKEN_FILE"
  chmod 600 "$TOKEN_FILE"
fi
TOKEN=$(cat "$TOKEN_FILE")

# Snapshot package.json so we can restore exactly what was there before,
# regardless of git state. This lets you publish uncommitted changes safely.
# A byte-exact copy: `$(cat …)` would strip the trailing newline and leave the
# file dirty after every publish.
PKG_SNAPSHOT=$(mktemp)
cp package.json "$PKG_SNAPSHOT"
trap 'cp "$PKG_SNAPSHOT" package.json; rm -f "$PKG_SNAPSHOT"' EXIT

# Pick a unique prerelease version. e.g. 0.7.1-local.1700000000
BASE="$(node -p "require('./package.json').version.split('-')[0]")"
NEXT="${BASE}-local.$(date +%s)"

echo "→ Bumping to $NEXT (in-memory only)"
pnpm version "$NEXT" --no-git-tag-version > /dev/null

# Temp .npmrc carries the auth token only for this publish; no global config
# changes, nothing for other deps to accidentally inherit.
TMP_NPMRC=$(mktemp)
trap 'rm -f "$TMP_NPMRC"; cp "$PKG_SNAPSHOT" package.json; rm -f "$PKG_SNAPSHOT"' EXIT
echo "registry=$REGISTRY/" > "$TMP_NPMRC"
# Scope-specific registry is required for pnpm publish to ignore the default
# registry (npmjs.org) when publishing a @-scoped package.
echo "@incubrain:registry=$REGISTRY/" >> "$TMP_NPMRC"
echo "//localhost:4873/:_authToken=$TOKEN" >> "$TMP_NPMRC"

echo "→ Publishing to $REGISTRY (tag: local)"
NPM_CONFIG_USERCONFIG="$TMP_NPMRC" pnpm publish --no-git-checks --tag local

echo "✓ Published @incubrain/foundry@$NEXT to $REGISTRY (tag: local)"
echo "  Consumers install via:"
echo "  pnpm add @incubrain/foundry@local --registry $REGISTRY"
