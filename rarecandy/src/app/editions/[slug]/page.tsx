import Link from "next/link";
import { notFound } from "next/navigation";
import { CardTile } from "@/components/card/CardTile";
import { cardsInSet, getSet, sets } from "@/lib/data";
import { money } from "@/lib/format";

export function generateStaticParams() {
  return sets.map((set) => ({ slug: set.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const set = getSet(slug);
  return { title: set ? set.name : "Edition" };
}

export default async function EditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const set = getSet(slug);
  if (!set) notFound();
  const lots = cardsInSet(set.id).sort((a, b) => b.marketPrice - a.marketPrice);
  const high = lots[0];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <nav className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
        <Link href="/editions" className="hover:text-bone">Editions</Link>
        <span className="px-2">/</span>
        <span className="text-bone">{set.name}</span>
      </nav>
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-candy">
            {set.year} · {set.series} · {set.language}
          </p>
          <h1 className="display mt-2 text-6xl font-extrabold uppercase leading-[0.88]">{set.name}</h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-fog">{set.blurb}</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-line lg:col-span-4">
          <div className="bg-stage p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog">Printed</p>
            <p className="mt-1 font-mono text-xl">{set.printed}</p>
          </div>
          <div className="bg-stage p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog">On desk</p>
            <p className="mt-1 font-mono text-xl">{lots.length}</p>
          </div>
          <div className="col-span-2 bg-stage p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog">Ceiling</p>
            <p className="mt-1 font-mono text-xl">{high ? money(high.marketPrice) : "—"}</p>
            <p className="text-xs text-fog">{high?.name}</p>
          </div>
        </div>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
        {lots.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
