import { Suspense } from "react";
import { ShopFloor } from "@/components/market/ShopFloor";

export const metadata = {
  title: "The floor",
  description: "Search, filter, and sort the RareCandy night book.",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="px-6 py-20 text-fog">Opening the book…</div>}>
      <ShopFloor />
    </Suspense>
  );
}
