# RareCandy

Premium Pokémon card marketplace — a demo web app with mock inventory, market analytics, and graded card data.

## Stack

- **Next.js 15** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS 4**
- **Zustand** (cart & wishlist)
- **Recharts** (price history)
- **Framer Motion** + Lucide icons

## Features

- Premium homepage with featured, trending, and new cards
- Full marketplace with search, filters, and sorting
- Rich card detail pages (market value, price chart, recent sales, graded population, seller listings)
- Cart and wishlist (persisted locally)
- Popular sets browsing
- PSA / BGS / CGC grading data
- Responsive desktop & mobile UX

## Quick Start

**Important:** the app lives in the `rarecandy/` folder (not the repo root).

```bash
cd rarecandy
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

If you see errors about `.next` or port 3000 in use:

```bash
cd rarecandy
pkill -f "next dev" || true
pkill -f "next start" || true
rm -rf .next
npm run dev
```

Production mode (more stable):

```bash
cd rarecandy
npm run build
npm run start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Data

All inventory, sales, and population data is local mock data in `src/data/`. Card images are served from the [Pokémon TCG API](https://pokemontcg.io/) image CDN.
