"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { sets } from "@/data/sets";
import { getAllRarities } from "@/data/cards";

const rarities = getAllRarities();

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSets = searchParams.get("sets")?.split(",").filter(Boolean) ?? [];
  const activeRarities = searchParams.get("rarities")?.split(",").filter(Boolean) ?? [];
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const isNew = searchParams.get("filter") === "new";

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/marketplace?${params.toString()}`);
  };

  const toggleInList = (key: "sets" | "rarities", item: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(key)?.split(",").filter(Boolean) ?? [];
    const next = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];

    if (next.length) {
      params.set(key, next.join(","));
    } else {
      params.delete(key);
    }
    router.push(`/marketplace?${params.toString()}`);
  };

  const clearAll = () => {
    router.push("/marketplace");
  };

  const hasFilters =
    activeSets.length > 0 ||
    activeRarities.length > 0 ||
    minPrice ||
    maxPrice ||
    isNew;

  return (
    <aside className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
          Filters
        </h3>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {isNew && (
        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent text-xs font-medium">
            New Arrivals Only
            <button
              onClick={() => updateParams("filter", null)}
              className="ml-1 hover:text-accent-hover"
            >
              ×
            </button>
          </span>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium mb-3">Set</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {sets.map((set) => (
            <label
              key={set.id}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={activeSets.includes(set.slug)}
                onChange={() => toggleInList("sets", set.slug)}
                className="w-3.5 h-3.5 accent-accent"
              />
              <span className="text-sm text-ink-muted group-hover:text-ink transition-colors">
                {set.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Rarity</h4>
        <div className="space-y-1.5">
          {rarities.map((rarity) => (
            <label
              key={rarity}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={activeRarities.includes(rarity)}
                onChange={() => toggleInList("rarities", rarity)}
                className="w-3.5 h-3.5 accent-accent"
              />
              <span className="text-sm text-ink-muted group-hover:text-ink transition-colors">
                {rarity}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={minPrice ?? ""}
            onBlur={(e) =>
              updateParams("minPrice", e.target.value || null)
            }
            className="w-full px-3 py-2 bg-surface border border-border text-sm focus:outline-none focus:border-ink"
          />
          <span className="text-ink-faint">—</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={maxPrice ?? ""}
            onBlur={(e) =>
              updateParams("maxPrice", e.target.value || null)
            }
            className="w-full px-3 py-2 bg-surface border border-border text-sm focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Quick Filters</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Under $100", min: null, max: "100" },
            { label: "$100–$500", min: "100", max: "500" },
            { label: "$500+", min: "500", max: null },
            { label: "Grails", min: "1000", max: null },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                if (filter.min) params.set("minPrice", filter.min);
                else params.delete("minPrice");
                if (filter.max) params.set("maxPrice", filter.max);
                else params.delete("maxPrice");
                router.push(`/marketplace?${params.toString()}`);
              }}
              className={clsx(
                "px-3 py-1.5 text-xs border transition-colors",
                minPrice === filter.min && maxPrice === filter.max
                  ? "border-ink bg-ink text-cream"
                  : "border-border text-ink-muted hover:border-ink"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
