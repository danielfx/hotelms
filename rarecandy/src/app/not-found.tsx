import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-candy">404</p>
      <h1 className="display mt-3 text-5xl font-semibold uppercase">Lot not on the rail</h1>
      <p className="mt-4 text-fog">That ticket walked. Try the floor.</p>
      <Link href="/shop" className="mt-8 inline-flex h-11 items-center bg-candy px-5 text-sm text-white">
        Open the book
      </Link>
    </div>
  );
}
