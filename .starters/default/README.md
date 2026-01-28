# Founder Funnel Starter

A minimal starter template for [Founder Funnel](https://github.com/incubrain/founder-funnel) — the validation tool for technical founders.

## Setup

Install dependencies:

```bash
npm install
```

Copy the example environment file:

```bash
cp .env.example .env
```

## Development

Start the development server:

```bash
npm run dev
```

Your site will be running at `http://localhost:3000`.

## Production

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
content/
├── config/         Site configuration (YAML)
├── faq/            FAQ entries (YAML)
└── pages/          Landing pages (Markdown)
    ├── index.md    Homepage with progressive validation stages
    ├── about.md    About page
    ├── offers/     Offer/conversion pages
    └── success/    Post-conversion pages
app/
├── app.config.ts   App-level configuration
├── assets/         Custom theme CSS
└── components/     Custom section components
public/             Static assets (favicons, images)
```

## Customization

- **Content:** Edit YAML and Markdown files in `content/`
- **Theme:** Override brand colors in `app/assets/theme.css`
- **Components:** Add custom section components in `app/components/section/`
- **Config:** Adjust app settings in `app/app.config.ts`

## Learn More

- [Founder Funnel Layer](https://github.com/incubrain/founder-funnel)
- [Nuxt Documentation](https://nuxt.com)
- [Nuxt Content](https://content.nuxt.com)
