import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-32 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
        404
      </p>
      <h1 className="font-display text-4xl sm:text-5xl">Page not found</h1>
      <p className="mt-4 text-ink-muted max-w-md mx-auto">
        This card may have been sold or the page moved. Head back to the marketplace
        to continue browsing.
      </p>
      <Link href="/marketplace" className="inline-block mt-8">
        <Button size="lg">
          Browse Marketplace
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
