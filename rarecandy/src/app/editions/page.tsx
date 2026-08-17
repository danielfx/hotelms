import Link from "next/link";
import { cardsInSet, sets } from "@/lib/data";
import { money } from "@/lib/format";

export const metadata = {
  title: "Editions",
  description: "Popular Pokémon TCG sets on the RareCandy night floor.",
};

export default function EditionsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-candy">Catalogues</p>
      <h1 className="display mt-2 text-5xl font-semibold uppercase">Editions</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-fog">
        From the 1999 English sheet to Prismatic. Each edition is a room, not a filter chip.
      </p>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {sets.map((set) => {
          const lots = cardsInSet(set.id);
          const high = Math.max(...lots.map((c) => c.marketPrice), 0);
          return (
            <Link
              key={set.id}
              href={`/editions/${set.slug}`}
              className="grid items-center gap-4 py-6 hover:bg-panel/50 md:grid-cols-12"
            >
              <p className="font-mono text-xs text-candy md:col-span-1">{set.year}</p>
              <div className="md:col-span-4">
                <p className="display text-3xl font-semibold uppercase leading-none">{set.name}</p>
                <p className="mt-1 text-sm text-fog">{set.series}</p>
              </div>
              <p className="hidden text-sm leading-6 text-fog md:col-span-5 md:block">{set.blurb}</p>
              <p className="font-mono text-xs text-bone/70 md:col-span-2 md:text-right">
                {lots.length} lots
                <br />
                to {money(high, true)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
