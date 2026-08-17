import Link from "next/link";
import { recentMarketSales } from "@/lib/data";
import { money } from "@/lib/format";

export function SalesTicker() {
  const items = recentMarketSales();
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-line bg-panel">
      <div className="tape flex w-max">
        {loop.map((item, i) => (
          <Link
            key={`${item.sale.id}-${i}`}
            href={`/lot/${item.card.slug}`}
            className="flex items-center gap-3 whitespace-nowrap px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em]"
          >
            <span className="text-fog">{item.sale.date.slice(5)}</span>
            <span className="text-bone">
              {item.card.name}
              {item.sale.company ? ` ${item.sale.company}${item.sale.grade}` : " RAW"}
            </span>
            <span className="text-mint">{money(item.sale.price)}</span>
            <span className="text-line">◆</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
