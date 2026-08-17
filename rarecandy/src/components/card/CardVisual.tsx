import Image from "next/image";
import type { Card, GradingCompany } from "@/lib/types";
import { artworkUrl, classNames } from "@/lib/format";
import { getSetById, typeColors } from "@/lib/data";

interface CardVisualProps {
  card: Card;
  grade?: string;
  company?: GradingCompany;
  className?: string;
  priority?: boolean;
}

export function CardVisual({
  card,
  grade,
  company,
  className,
  priority,
}: CardVisualProps) {
  const palette = typeColors[card.type] ?? typeColors.Colorless;
  const set = getSetById(card.setId);
  const holo = /holo|secret|gold|illustration|star|amazing|hyper|promo/i.test(
    card.rarity,
  );
  const slab = Boolean(grade && company);

  return (
    <div className={classNames("group relative", className)}>
      <div
        className={classNames(
          "relative mx-auto aspect-[63/88] w-full max-w-[280px] transition-transform duration-500 group-hover:-translate-y-1",
          slab && "p-3 pt-8",
        )}
        style={
          slab
            ? {
                background: "linear-gradient(180deg,#1c1c22,#121218)",
                boxShadow:
                  "0 22px 50px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
              }
            : undefined
        }
      >
        {slab && (
          <div className="absolute inset-x-3 top-2 flex items-center justify-between font-mono text-[9px] tracking-[0.16em] text-bone/60">
            <span>{company}</span>
            <span className="text-[15px] text-bone">{grade}</span>
            <span>GEM</span>
          </div>
        )}
        <div
          className="relative h-full overflow-hidden rounded-[12px]"
          style={{
            background: `linear-gradient(180deg, ${palette.paper} 0%, #f4efe4 58%, ${palette.paper} 100%)`,
            boxShadow: `0 18px 40px rgba(0,0,0,0.4), inset 0 0 0 3px ${palette.ink}, inset 0 0 0 5px ${palette.foil}`,
          }}
        >
          <div className="flex items-start justify-between px-2.5 pt-2 text-[#16120e]">
            <div>
              <p className="text-[11px] font-semibold leading-none">{card.name}</p>
              <p className="mt-0.5 text-[8px] uppercase tracking-[0.16em] opacity-55">
                {card.type}
              </p>
            </div>
            {card.hp ? (
              <p className="font-mono text-[11px]">
                <span className="text-[8px]">HP</span> {card.hp}
              </p>
            ) : (
              <p className="text-[8px] uppercase tracking-[0.14em] opacity-50">Supporter</p>
            )}
          </div>
          <div className="relative mx-2 mt-1.5 aspect-[4/3] overflow-hidden" style={{ background: palette.ink }}>
            <div
              className="absolute inset-0 opacity-45"
              style={{
                background: `radial-gradient(circle at 30% 20%, ${palette.foil}, transparent 55%)`,
              }}
            />
            {card.pokedex > 0 ? (
              <Image
                src={artworkUrl(card.pokedex)}
                alt={card.name}
                fill
                priority={priority}
                className="object-contain p-2"
                sizes="240px"
              />
            ) : (
              <div className="grid h-full place-items-center text-[11px] text-white/80">{card.name}</div>
            )}
            {holo && <div className="sheen absolute inset-0" />}
          </div>
          <div className="px-2.5 pt-2 text-[#16120e]">
            <p className="text-[8px] uppercase tracking-[0.16em] opacity-45">{card.rarity}</p>
            <p className="mt-1 line-clamp-3 text-[8.5px] leading-3.5 opacity-70">
              {card.flavor ?? card.description}
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-between px-2.5 pb-2 text-[8px] uppercase tracking-[0.12em] text-[#16120e]/50">
            <span>{set?.name}</span>
            <span className="font-mono">{card.number}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
