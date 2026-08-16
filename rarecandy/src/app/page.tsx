import { Suspense } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedCards } from "@/components/home/FeaturedCards";
import { TrendingSection } from "@/components/home/TrendingSection";
import { NewArrivals } from "@/components/home/NewArrivals";
import { PopularSets } from "@/components/home/PopularSets";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCards />
      <Suspense fallback={null}>
        <TrendingSection />
      </Suspense>
      <NewArrivals />
      <PopularSets />
    </>
  );
}
