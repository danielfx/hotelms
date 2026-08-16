import Link from "next/link";
import { sets } from "@/data/sets";

export function Footer() {
  return (
    <footer className="bg-ink text-cream mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link href="/" className="font-display text-2xl">
              Rare<span className="text-accent-muted">Candy</span>
            </Link>
            <p className="mt-4 text-sm text-cream/60 leading-relaxed max-w-xs">
              The premium marketplace for authenticated Pokémon cards. Verified sellers,
              market analytics, and graded inventory.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-cream/40 mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/marketplace" className="text-sm text-cream/70 hover:text-cream transition-colors">Browse All</Link></li>
              <li><Link href="/marketplace?sort=trending" className="text-sm text-cream/70 hover:text-cream transition-colors">Trending</Link></li>
              <li><Link href="/marketplace?filter=new" className="text-sm text-cream/70 hover:text-cream transition-colors">New Arrivals</Link></li>
              <li><Link href="/wishlist" className="text-sm text-cream/70 hover:text-cream transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-cream/40 mb-4">
              Popular Sets
            </h4>
            <ul className="space-y-2.5">
              {sets.filter((s) => s.featured).slice(0, 4).map((set) => (
                <li key={set.id}>
                  <Link
                    href={`/sets/${set.slug}`}
                    className="text-sm text-cream/70 hover:text-cream transition-colors"
                  >
                    {set.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-cream/40 mb-4">
              Grading Partners
            </h4>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 bg-psa text-white text-xs font-mono font-medium">PSA</span>
              <span className="px-3 py-1.5 bg-bgs text-white text-xs font-mono font-medium">BGS</span>
              <span className="px-3 py-1.5 bg-cgc text-white text-xs font-mono font-medium">CGC</span>
            </div>
            <p className="mt-4 text-xs text-cream/40 leading-relaxed">
              All graded cards verified against official population reports.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-cream/40">
            © 2026 RareCandy. Demo marketplace with mock inventory.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-cream/40">Privacy</span>
            <span className="text-xs text-cream/40">Terms</span>
            <span className="text-xs text-cream/40">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
