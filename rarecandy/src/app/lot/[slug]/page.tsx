import Link from "next/link";
import { notFound } from "next/navigation";
import { CardTile } from "@/components/card/CardTile";
import { CardVisual } from "@/components/card/CardVisual";
import { LotActions } from "@/components/card/LotActions";
import { PriceChart } from "@/components/market/PriceChart";
import { SellerBook } from "@/components/card/SellerBook";
import {
  cards,
  getCard,
  getSeller,
  getSetById,
  relatedCards,
} from "@/lib/data";
import { formatDate, money, pct } from "@/lib/format";

export function generateStaticParams() {
  return cards.map((card) => ({ slug: card.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = getCard(slug);
  if (!card) return { title: "Lot missing" };
  const set = getSetById(card.setId);
  return {
    title: `${card.name} · ${set?.name} ${card.number}`,
    description: card.description,
  };
}

export default async function LotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = getCard(slug);
  if (!card) notFound();

  const set = getSetById(card.setId);
  const related = relatedCards(card, 4);
  const asks = [...card.listings].sort((a, b) => a.price - b.price);
  const floor = asks[0];
  const psa10 = card.populations.find((p) => p.company === "PSA" && p.grade === "10");
  const maxPop = Math.max(...card.populations.map((p) => p.population));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <nav className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
        <Link href="/" className="hover:text-bone">Home</Link>
        <span className="px-2">/</span>
        <Link href="/shop" className="hover:text-bone">Floor</Link>
        <span className="px-2">/</span>
        <Link href={`/editions/${set?.slug}`} className="hover:text-bone">{set?.name}</Link>
        <span className="px-2">/</span>
        <span className="text-bone">{card.name}</span>
      </nav>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-12">
        <div className="spot lg:col-span-5">
          <CardVisual
            card={card}
            company={floor?.company}
            grade={floor?.grade}
            priority
            className="[&>div]:max-w-[340px]"
          />
        </div>

        <div className="lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-candy">
            {set?.name} · {card.number} · {card.year}
          </p>
          <h1 className="display mt-2 text-5xl font-extrabold uppercase leading-[0.9] sm:text-6xl">
            {card.name}
          </h1>
          <p className="mt-3 text-sm text-fog">
            {card.rarity} · {card.type}
            {card.hp ? ` · HP ${card.hp}` : ""} · {card.illustrator}
          </p>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-bone/80">{card.description}</p>

          <div className="mt-8 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            <Stat label="Mark" value={money(card.marketPrice)} />
            <Stat
              label="7d"
              value={pct(card.change7d)}
              tone={card.change7d >= 0 ? "mint" : "warn"}
            />
            <Stat
              label="30d"
              value={pct(card.change30d)}
              tone={card.change30d >= 0 ? "mint" : "warn"}
            />
            <Stat label="Week vol" value={String(card.weeklyVolume)} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
            <Stat label="Ask floor" value={floor ? money(floor.price) : "—"} />
            <Stat
              label="PSA 10 pop"
              value={psa10 ? String(psa10.population) : "—"}
            />
            <Stat label="Asks" value={String(asks.length)} />
          </div>

          {floor && (
            <LotActions card={card} listing={floor} />
          )}
        </div>
      </div>

      <section className="mt-16 grid gap-10 lg:grid-cols-12">
        <div className="border border-line bg-stage p-5 lg:col-span-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">Price history</p>
          <div className="mt-4">
            <PriceChart history={card.priceHistory} />
          </div>
        </div>
        <div className="border border-line bg-stage p-5 lg:col-span-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
            Graded population
          </p>
          <ul className="mt-5 space-y-3">
            {card.populations.map((pop) => (
              <li key={`${pop.company}-${pop.grade}`}>
                <div className="mb-1 flex justify-between font-mono text-[11px]">
                  <span>
                    {pop.company} {pop.grade}
                  </span>
                  <span className="text-fog">{pop.population.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-void">
                  <div
                    className="h-full bg-candy"
                    style={{ width: `${Math.max(4, (pop.population / maxPop) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">Recent ink</p>
        <h2 className="display mt-2 text-3xl font-semibold uppercase">Last prints</h2>
        <div className="mt-6 overflow-x-auto border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-panel font-mono text-[10px] uppercase tracking-[0.16em] text-fog">
              <tr>
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">House</th>
                <th className="px-4 py-3 font-normal">State</th>
                <th className="px-4 py-3 text-right font-normal">Print</th>
              </tr>
            </thead>
            <tbody>
              {card.recentSales.map((sale) => (
                <tr key={sale.id} className="border-t border-line">
                  <td className="px-4 py-3 font-mono text-xs text-fog">{formatDate(sale.date)}</td>
                  <td className="px-4 py-3">{sale.source}</td>
                  <td className="px-4 py-3 text-fog">
                    {sale.company ? `${sale.company} ${sale.grade}` : sale.condition}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{money(sale.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">Live asks</p>
        <h2 className="display mt-2 text-3xl font-semibold uppercase">Seller book</h2>
        <SellerBook card={card} />
      </section>

      <section className="mt-16 grid gap-6 border border-line bg-panel p-6 md:grid-cols-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog">Edition</p>
          <p className="mt-2 display text-2xl font-semibold">{set?.name}</p>
          <p className="mt-1 text-sm text-fog">{set?.series} · {set?.printed} printed</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog">Artist</p>
          <p className="mt-2 display text-2xl font-semibold">{card.illustrator}</p>
          <p className="mt-1 text-sm text-fog">Released {formatDate(card.releaseDate)}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog">Lowest named desk</p>
          <p className="mt-2 display text-2xl font-semibold">
            {floor ? getSeller(floor.sellerId)?.name : "—"}
          </p>
          <p className="mt-1 text-sm text-fog">
            {floor ? getSeller(floor.sellerId)?.city : ""}
          </p>
        </div>
      </section>

      <section className="mt-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">Same bloodline</p>
        <h2 className="display mt-2 text-3xl font-semibold uppercase">Related lots</h2>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {related.map((item) => (
            <CardTile key={item.id} card={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "mint" | "warn";
}) {
  return (
    <div className="bg-stage px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog">{label}</p>
      <p
        className={`mt-1 font-mono text-lg ${
          tone === "mint" ? "text-mint" : tone === "warn" ? "text-warn" : "text-bone"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
