"use client";

import Link from "next/link";
import { CardVisual } from "@/components/card/CardVisual";
import { getListing } from "@/lib/data";
import { money } from "@/lib/format";
import { cartTotals, useStore } from "@/lib/store";

export default function BagPage() {
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const remove = useStore((s) => s.removeFromCart);
  const clear = useStore((s) => s.clearCart);
  const totals = cartTotals(cart);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-candy">Checkout rail</p>
      <h1 className="display mt-2 text-5xl font-semibold uppercase">Bag</h1>

      {cart.length === 0 ? (
        <div className="mt-16 border border-line bg-stage p-10">
          <p className="text-fog">Nothing lifted yet.</p>
          <Link href="/shop" className="mt-4 inline-flex h-11 items-center bg-candy px-5 text-sm text-white">
            Back to the floor
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <ul className="space-y-6 lg:col-span-8">
            {cart.map((item) => {
              const found = getListing(item.listingId);
              if (!found) return null;
              const { listing, card } = found;
              return (
                <li key={item.listingId} className="grid grid-cols-[88px_1fr] gap-4 border-b border-line pb-6">
                  <Link href={`/lot/${card.slug}`}>
                    <CardVisual card={card} company={listing.company} grade={listing.grade} />
                  </Link>
                  <div>
                    <Link href={`/lot/${card.slug}`} className="display text-2xl font-semibold uppercase">
                      {card.name}
                    </Link>
                    <p className="mt-1 text-sm text-fog">
                      {listing.company
                        ? `${listing.company} ${listing.grade} · #${listing.certNumber}`
                        : listing.condition}
                    </p>
                    <p className="mt-3 font-mono">{money(listing.price)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        className="h-8 w-8 border border-line"
                        onClick={() => setQty(item.listingId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="font-mono text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        className="h-8 w-8 border border-line"
                        onClick={() => setQty(item.listingId, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.listingId)}
                        className="ml-2 text-xs text-fog hover:text-warn"
                      >
                        Drop
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <aside className="border border-line bg-stage p-6 lg:col-span-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">Ticket</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-fog">Lots</dt>
                <dd className="font-mono">{totals.count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fog">Subtotal</dt>
                <dd className="font-mono">{money(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fog">Ship</dt>
                <dd className="font-mono">{money(totals.shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt>Due</dt>
                <dd className="font-mono">{money(totals.subtotal + totals.shipping)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => clear()}
              className="mt-6 h-12 w-full bg-candy text-sm text-white hover:bg-candy-dim"
            >
              Close the ticket
            </button>
            <p className="mt-3 font-mono text-[10px] leading-4 text-fog">
              Mock desk. No charge fires. The bag clears so you can keep shopping the night book.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
