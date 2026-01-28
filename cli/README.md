# create-founder-funnel

CLI tool to scaffold a new [Founder Funnel](https://github.com/incubrain/founder-funnel) project.

## Usage

```bash
# Create a new project
npx create-founder-funnel my-project

# Navigate and start
cd my-project
npm install
npm run dev
```

## Options

| Flag | Alias | Default | Description |
|------|-------|---------|-------------|
| `dir` | (positional) | `my-funnel` | Project directory |
| `--template` | `-t` | `default` | Template to use |

## Templates

- **default** — Minimal starter with landing page, signal capture, and FAQ

## Development

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Run locally
pnpm dev my-test-project
```
