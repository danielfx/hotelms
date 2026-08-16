import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cards } from "@/data/cards";

const heroCard = cards.find((c) => c.slug === "charizard-base-set-holo")!;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center py-12 lg:py-20">
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">
              Premium Pokémon Marketplace
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
              Collect with
              <br />
              <span className="text-accent">confidence</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-ink-muted leading-relaxed max-w-md">
              Authenticated inventory from verified sellers. Real-time market data,
              graded population reports, and price history for every card.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace">
                <Button size="lg">
                  Explore Marketplace
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href={`/card/${heroCard.slug}`}>
                <Button variant="outline" size="lg">
                  View Featured Card
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-ink-muted">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <span>Verified Sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span>Live Market Data</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" />
                <span>PSA · BGS · CGC</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-up animate-fade-up-delay-2">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-br from-accent/5 via-transparent to-accent/10 pointer-events-none" />
              <Link
                href={`/card/${heroCard.slug}`}
                className="group relative block aspect-[3/4] max-w-[320px] mx-auto lg:max-w-[380px] bg-surface border border-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)] transition-shadow duration-500 card-shine"
              >
                <Image
                  src={heroCard.image}
                  alt={heroCard.name}
                  fill
                  priority
                  className="object-contain p-6 transition-transform duration-700 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 320px, 380px"
                />
              </Link>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:-left-8 lg:bottom-8 bg-ink text-cream px-5 py-3 shadow-lg">
                <p className="text-[10px] uppercase tracking-widest text-cream/50">Market Value</p>
                <p className="font-mono text-xl font-medium">${heroCard.marketPrice.toLocaleString()}</p>
                <p className="text-xs text-success mt-0.5">+{heroCard.priceChange30d}% this month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
