import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-stage">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="display text-3xl font-semibold uppercase tracking-[0.08em]">
            RareCandy
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-candy">
            After Dark · Night floor
          </p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-fog">
            Paper trades after the lights go down. Vintage Wizards through
            Prismatic. Population before poetry.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm md:col-span-7 md:grid-cols-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">Floor</p>
            <ul className="mt-3 space-y-2 text-bone/80">
              <li><Link href="/shop">Open book</Link></li>
              <li><Link href="/editions">Editions</Link></li>
              <li><Link href="/shop?board=movers">Movers</Link></li>
              <li><Link href="/saved">Saved lots</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">Icons</p>
            <ul className="mt-3 space-y-2 text-bone/80">
              <li><Link href="/lot/base-set-charizard-4">Charizard 4/102</Link></li>
              <li><Link href="/lot/evolving-skies-umbreon-vmax-215">Umbreon VMAX</Link></li>
              <li><Link href="/lot/neo-genesis-lugia-9">Neo Lugia</Link></li>
              <li><Link href="/lot/base-set-mewtwo-10">Mewtwo</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">Desk</p>
            <ul className="mt-3 space-y-2 text-bone/80">
              <li>PSA · BGS · CGC</li>
              <li>Insured overnight</li>
              <li>Private bid lines</li>
              <li>Mock book · no live rails</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] justify-between px-4 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-fog sm:px-6">
          <span>Doors open 1999</span>
          <span>Not the cream house</span>
        </div>
      </div>
    </footer>
  );
}
