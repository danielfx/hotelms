import Link from "next/link";
import { CardTile } from "@/components/card/CardTile";
import { CardVisual } from "@/components/card/CardVisual";
import { SalesTicker } from "@/components/home/SalesTicker";
import {
  cards,
  cardsInSet,
  featuredCards,
  getCard,
  newCards,
  sets,
  trendingCards,
} from "@/lib/data";
import { money, pct } from "@/lib/format";

const hero = getCard("base-set-charizard-4")!;
const board = trendingCards().slice(0, 8);
const popular = ["base", "es", "skyridge", "prism", "neo-dis", "hf"];

export default function HomePage() {
  const featured = featuredCards().filter((c) => c.id !== hero.id).slice(0, 3);
  const arrivals = newCards();

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="spot pointer-events-none absolute inset-0" />
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-12 lg:pt-10">
          <div className="lg:col-span-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-candy">
              Night session · 08.17.26 · doors unlocked
            </p>
            <h1 className="display mt-4 text-[3.4rem] font-extrabold uppercase leading-[0.86] sm:text-7xl lg:text-[6.4rem]">
              After
              <br />
              dark
              <br />
              <span className="text-candy">paper.</span>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-fog">
              The cream house closed at six. We kept the lights off and the
              book open. Charizard {money(hero.marketPrice)} raw. Umbreon still
              rewriting the modern tape.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center bg-candy px-6 text-sm font-medium text-white hover:bg-candy-dim"
              >
                Step onto the floor
              </Link>
              <Link
                href={`/lot/${hero.slug}`}
                className="inline-flex h-12 items-center border border-bone/30 px-6 text-sm text-bone hover:border-bone"
              >
                Tonight’s headliner
              </Link>
            </div>
          </div>
          <div className="lg:col-span-4">
            <Link href={`/lot/${hero.slug}`} className="block">
              <CardVisual card={hero} company="PSA" grade="9" priority />
            </Link>
          </div>
          <div className="border-t border-line pt-5 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">Headliner</p>
            <p className="display mt-2 text-3xl font-semibold leading-none">Charizard</p>
            <p className="mt-2 text-sm text-fog">Base Set · 4/102 · Arita</p>
            <p className="mt-6 font-mono text-2xl">{money(hero.marketPrice)}</p>
            <p className="font-mono text-xs text-mint">{pct(hero.change7d)} 7d</p>
            <p className="mt-6 font-mono text-[11px] leading-5 text-fog">
              {hero.weeklyVolume} prints this week
              <br />
              PSA 10 pop {hero.populations.find((p) => p.company === "PSA" && p.grade === "10")?.population}
            </p>
          </div>
        </div>
      </section>

      <SalesTicker />

      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-candy">Tonight’s board</p>
            <h2 className="display mt-2 text-4xl font-semibold uppercase">Movers</h2>
          </div>
          <Link href="/shop?board=movers" className="font-mono text-[11px] uppercase tracking-[0.16em] text-fog hover:text-bone">
            Full tape →
          </Link>
        </div>
        <ol className="mt-8 divide-y divide-line border-y border-line">
          {board.map((card, i) => (
            <li key={card.id}>
              <Link
                href={`/lot/${card.slug}`}
                className="grid grid-cols-12 items-center gap-3 py-4 text-sm hover:bg-panel/60"
              >
                <span className="col-span-1 font-mono text-fog">{String(i + 1).padStart(2, "0")}</span>
                <span className="col-span-5 display text-xl font-semibold sm:col-span-4">{card.name}</span>
                <span className="col-span-3 hidden text-fog sm:block">{card.rarity}</span>
                <span className="col-span-3 text-right font-mono sm:col-span-2">{money(card.marketPrice)}</span>
                <span className={`col-span-3 text-right font-mono text-xs sm:col-span-2 ${card.change7d >= 0 ? "text-mint" : "text-warn"}`}>
                  {pct(card.change7d)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-stage">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-candy">Held lots</p>
          <h2 className="display mt-2 text-4xl font-semibold uppercase">On the table</h2>
          <div className="mt-10 space-y-10">
            {featured.map((card, i) => (
              <Link
                key={card.id}
                href={`/lot/${card.slug}`}
                className={`grid items-center gap-8 fade lg:grid-cols-12 ${i % 2 ? "lg:direction-rtl" : ""}`}
              >
                <div className={`lg:col-span-4 ${i % 2 ? "lg:col-start-9" : ""}`}>
                  <CardVisual card={card} />
                </div>
                <div className={`lg:col-span-7 ${i % 2 ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog">
                    {card.year} · {card.rarity}
                  </p>
                  <h3 className="display mt-2 text-5xl font-semibold uppercase leading-none">{card.name}</h3>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-fog">{card.description}</p>
                  <div className="mt-6 flex flex-wrap gap-8 font-mono text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-fog">Mark</p>
                      <p className="text-xl text-bone">{money(card.marketPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-fog">7d</p>
                      <p className={card.change7d >= 0 ? "text-mint" : "text-warn"}>{pct(card.change7d)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-fog">Volume</p>
                      <p>{card.weeklyVolume}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-candy">Catalogues</p>
            <h2 className="display mt-2 text-4xl font-semibold uppercase">Editions</h2>
          </div>
          <Link href="/editions" className="font-mono text-[11px] uppercase tracking-[0.16em] text-fog hover:text-bone">
            All editions →
          </Link>
        </div>
        <div className="mt-8 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {sets
            .filter((s) => popular.includes(s.id))
            .map((set) => {
              const lots = cardsInSet(set.id);
              const high = Math.max(...lots.map((c) => c.marketPrice), 0);
              return (
                <Link key={set.id} href={`/editions/${set.slug}`} className="bg-void p-6 hover:bg-panel">
                  <p className="font-mono text-[11px] text-candy">{set.year}</p>
                  <p className="display mt-2 text-3xl font-semibold uppercase leading-none">{set.name}</p>
                  <p className="mt-3 text-sm leading-6 text-fog">{set.blurb}</p>
                  <p className="mt-6 font-mono text-xs text-bone/70">
                    {lots.length} lots · ceiling {money(high, true)}
                  </p>
                </Link>
              );
            })}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-candy">Wet ink</p>
        <h2 className="display mt-2 text-4xl font-semibold uppercase">Just hit the desk</h2>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          {arrivals.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] border-t border-line px-4 py-12 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="display text-4xl font-semibold uppercase">
              {cards.length} lots · {sets.length} editions
            </p>
            <p className="mt-2 text-sm text-fog">A second house. A darker book. Same paper.</p>
          </div>
          <Link href="/shop" className="inline-flex h-12 items-center bg-bone px-6 text-sm text-void hover:bg-white">
            Open the full book
          </Link>
        </div>
      </section>
    </div>
  );
}
