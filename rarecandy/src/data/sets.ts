import type { CardSet } from "@/lib/types";

export const sets: CardSet[] = [
  {
    id: "base1",
    slug: "base-set",
    name: "Base Set",
    year: 1999,
    cardCount: 102,
    image: "https://images.pokemontcg.io/base1/4_hires.png",
    description:
      "The original Pokémon TCG release. Shadowless and 1st Edition variants command premium prices.",
    featured: true,
  },
  {
    id: "neo1",
    slug: "neo-genesis",
    name: "Neo Genesis",
    year: 2000,
    cardCount: 111,
    image: "https://images.pokemontcg.io/neo1/9_hires.png",
    description:
      "Introduced Darkness and Metal types with stunning holo artwork from the Johto era.",
    featured: true,
  },
  {
    id: "swsh7",
    slug: "evolving-skies",
    name: "Evolving Skies",
    year: 2021,
    cardCount: 237,
    image: "https://images.pokemontcg.io/swsh7/215_hires.png",
    description:
      "The definitive Eeveelution set featuring alt-art chase cards and modern grail status.",
    featured: true,
  },
  {
    id: "base4",
    slug: "celebrations",
    name: "Celebrations",
    year: 2021,
    cardCount: 50,
    image: "https://images.pokemontcg.io/cel25/25_hires.png",
    description:
      "25th anniversary collection featuring classic reprints and the iconic Flying Pikachu.",
    featured: true,
  },
  {
    id: "sv3pt5",
    slug: "151",
    name: "Scarlet & Violet — 151",
    year: 2023,
    cardCount: 207,
    image: "https://images.pokemontcg.io/sv3pt5/173_hires.png",
    description:
      "Complete Kanto Pokédex with special illustration rares and nostalgic appeal.",
  },
  {
    id: "gym2",
    slug: "gym-challenge",
    name: "Gym Challenge",
    year: 2000,
    cardCount: 132,
    image: "https://images.pokemontcg.io/gym2/2_hires.png",
    description:
      "Gym Leader themed set with iconic Blaine's Charizard and rare holo trainers.",
  },
];

export function getSetBySlug(slug: string): CardSet | undefined {
  return sets.find((s) => s.slug === slug);
}
