# Foundry Starter

Minimal starter template for [Foundry](https://github.com/incubrain/foundry).

## Setup

```bash
npm install
cp .env.example .env
```

## Development

```bash
npm run dev
```

Site runs at `http://localhost:3000`.

## Production

```bash
npm run build
npm run preview
```

## Structure

```
content/
├── config/         Site config (YAML)
├── faq/            FAQ entries (YAML)
└── pages/          Landing pages (Markdown)
app/
├── app.config.ts   App config
├── assets/         Theme CSS
└── components/     Custom components
public/             Static assets
```

## Customization

- **Content:** Edit files in `content/`
- **Theme:** Override colors in `app/assets/theme.css`
- **Components:** Add to `app/components/`

## Links

- [Foundry](https://github.com/incubrain/foundry)
- [Nuxt](https://nuxt.com)
- [Nuxt Content](https://content.nuxt.com)
