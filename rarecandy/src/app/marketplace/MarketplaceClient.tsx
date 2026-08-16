"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { cards } from "@/data/cards";
import { filterCards } from "@/lib/utils";
import type { FilterState, SortOption } from "@/lib/types";
import { CardTile } from "@/components/ui/CardTile";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { SortDropdown } from "@/components/marketplace/SortDropdown";
import { FilterPanel } from "@/components/marketplace/FilterPanel";

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);

  const filters: FilterState = useMemo(() => {
    const sort = (searchParams.get("sort") as SortOption) || "featured";
    return {
      query: searchParams.get("q") ?? "",
      sets: searchParams.get("sets")?.split(",").filter(Boolean) ?? [],
      rarities: searchParams.get("rarities")?.split(",").filter(Boolean) ?? [],
      conditions: [],
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : null,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : null,
      gradedOnly: false,
      sort,
    };
  }, [searchParams]);

  let filtered = filterCards(cards, filters);

  if (searchParams.get("filter") === "new") {
    filtered = filtered.filter((c) => c.isNew);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">Marketplace</h1>
        <p className="mt-2 text-ink-muted">
          {filtered.length} card{filtered.length !== 1 ? "s" : ""} available
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
        <div className="flex gap-2">
          <button
            onClick={() => setMobileFilters(!mobileFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-border text-sm hover:border-ink transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <Suspense fallback={null}>
            <SortDropdown />
          </Suspense>
        </div>
      </div>

      <div className="flex gap-10">
        <div
          className={`${
            mobileFilters ? "block" : "hidden"
          } lg:block w-full lg:w-56 shrink-0`}
        >
          <Suspense fallback={null}>
            <FilterPanel />
          </Suspense>
        </div>

        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-ink-muted">No cards found</p>
              <p className="mt-2 text-sm text-ink-faint">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {filtered.map((card) => (
                <CardTile key={card.id} card={card} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceClient() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-ink-muted">
          Loading marketplace...
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
