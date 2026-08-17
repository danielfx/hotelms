"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardTile } from "@/components/card/CardTile";
import { cards, sets } from "@/lib/data";
import type { Card, PokemonType, Rarity } from "@/lib/types";

const types: PokemonType[] = [
  "Fire",
  "Water",
  "Grass",
  "Lightning",
  "Psychic",
  "Fighting",
  "Darkness",
  "Dragon",
  "Colorless",
  "Fairy",
  "Metal",
];

const rarities: Rarity[] = [
  "Rare Holo",
  "Ultra Rare",
  "Secret Rare",
  "Special Illustration Rare",
  "Illustration Rare",
  "Promo",
  "Gold Star",
];

const sorts = [
  { id: "mark", label: "Mark · high" },
  { id: "mark-low", label: "Mark · low" },
  { id: "movers", label: "Tape / movers" },
  { id: "new", label: "Fresh ink" },
  { id: "name", label: "A–Z" },
];

export function ShopFloor() {
  const params = useSearchParams();
  const router = useRouter();

  const q = params.get("q") ?? "";
  const setId = params.get("set") ?? "";
  const type = params.get("type") ?? "";
  const rarity = params.get("rarity") ?? "";
  const sort = params.get("sort") || (params.get("board") === "movers" ? "movers" : "mark");
  const ink = params.get("ink") ?? params.get("arrival") ?? "";
  const max = Number(params.get("max") || 0);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "board") next.delete("board");
    router.replace(`/shop?${next.toString()}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    let list: Card[] = cards.filter((card) => {
      const hay = `${card.name} ${card.pokemon} ${card.number} ${card.illustrator}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (setId && card.setId !== setId) return false;
      if (type && card.type !== type) return false;
      if (rarity && card.rarity !== rarity) return false;
      if (ink === "fresh" && !card.isNew) return false;
      if (max && card.marketPrice > max) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "mark-low") return a.marketPrice - b.marketPrice;
      if (sort === "movers") return Math.abs(b.change7d) - Math.abs(a.change7d);
      if (sort === "new") return Number(b.isNew) - Number(a.isNew) || b.year - a.year;
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "featured") return Number(b.featured) - Number(a.featured);
      return b.marketPrice - a.marketPrice;
    });
    return list;
  }, [q, setId, type, rarity, sort, ink, max]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-candy">Open book</p>
          <h1 className="display mt-2 text-5xl font-semibold uppercase">The floor</h1>
        </div>
        <p className="font-mono text-xs text-fog">{filtered.length} lots on the rail</p>
      </div>

      <div className="sticky top-[4.25rem] z-20 -mx-4 mt-0 border-b border-line bg-void/90 px-4 py-3 backdrop-blur md:mx-0 md:px-0">
        <div className="flex flex-wrap gap-2">
          <input
            defaultValue={q}
            onChange={(e) => setParam("q", e.target.value)}
            placeholder="Name, artist, number"
            className="h-10 min-w-[180px] flex-1 border border-line bg-stage px-3 text-sm outline-none focus:border-candy"
          />
          <select
            value={setId}
            onChange={(e) => setParam("set", e.target.value)}
            className="h-10 border border-line bg-stage px-2 text-sm"
          >
            <option value="">All editions</option>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setParam("type", e.target.value)}
            className="h-10 border border-line bg-stage px-2 text-sm"
          >
            <option value="">Type</option>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={rarity}
            onChange={(e) => setParam("rarity", e.target.value)}
            className="h-10 border border-line bg-stage px-2 text-sm"
          >
            <option value="">Rarity</option>
            {rarities.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="h-10 border border-line bg-stage px-2 text-sm"
          >
            {sorts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={max ? String(max) : ""}
            onChange={(e) => setParam("max", e.target.value)}
            className="h-10 border border-line bg-stage px-2 text-sm"
          >
            <option value="">Any mark</option>
            <option value="50">Under $50</option>
            <option value="200">Under $200</option>
            <option value="500">Under $500</option>
            <option value="2000">Under $2k</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-fog">Nothing on that line. Clear a filter.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
