# RareCandy After Dark

A night-market Pokémon card desk. Dark floor, live tape, graded population, named sellers.

This is a standalone Next.js app — not the cream/gold auction house, and not HotelMS.

## Run

```bash
cd rarecandy
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Path | Page |
| --- | --- |
| `/` | Night homepage — headliner, movers board, editions |
| `/shop` | Full book with search, filters, sort |
| `/lot/[slug]` | Lot ticket: mark, chart, pops, asks, comps |
| `/editions` | Set catalogue |
| `/editions/[slug]` | Lots in a set |
| `/bag` | Cart |
| `/saved` | Watchlist |

## Stack

Next.js 16 · React 19 · Tailwind 4 · Zustand · local mock inventory (48 lots).

No backend. Cart and watchlist persist in the browser.
