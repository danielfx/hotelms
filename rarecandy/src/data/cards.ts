import type { Card, SellerListing } from "@/lib/types";

function generatePriceHistory(
  basePrice: number,
  months: number,
  volatility: number
): { date: string; price: number }[] {
  const points: { date: string; price: number }[] = [];
  let price = basePrice * (0.75 + Math.random() * 0.15);
  const now = new Date();

  for (let i = months; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const trend = (months - i) / months;
    const drift = basePrice * 0.25 * trend;
    price = price * (1 + (Math.random() - 0.45) * volatility) + drift * 0.02;
    price = Math.max(price, basePrice * 0.5);
    points.push({
      date: date.toISOString().split("T")[0],
      price: Math.round(price),
    });
  }

  points[points.length - 1].price = basePrice;
  return points;
}

export const cards: Card[] = [
  {
    id: "c1",
    slug: "charizard-base-set-holo",
    name: "Charizard",
    set: "Base Set",
    setSlug: "base-set",
    number: "4/102",
    year: 1999,
    rarity: "Holo Rare",
    image: "https://images.pokemontcg.io/base1/4_hires.png",
    marketPrice: 12450,
    priceChange30d: 8.2,
    priceHistory: generatePriceHistory(12450, 24, 0.08),
    recentSales: [
      { id: "rs1", date: "2026-08-10", price: 12800, grade: "9", company: "PSA", platform: "eBay" },
      { id: "rs2", date: "2026-08-05", price: 11900, grade: "8", company: "PSA", platform: "Heritage" },
      { id: "rs3", date: "2026-07-28", price: 14200, grade: "10", company: "PSA", platform: "Goldin" },
      { id: "rs4", date: "2026-07-15", price: 11200, condition: "Near Mint", platform: "TCGPlayer" },
      { id: "rs5", date: "2026-07-02", price: 13500, grade: "9.5", company: "BGS", platform: "PWCC" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 121, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 2847, higherGrades: 121 },
      { company: "PSA", grade: "8", population: 4521, higherGrades: 2968 },
      { company: "BGS", grade: "9.5", population: 412, higherGrades: 38 },
      { company: "BGS", grade: "10", population: 38, higherGrades: 0 },
      { company: "CGC", grade: "9.5", population: 189, higherGrades: 12 },
    ],
    tags: ["fire", "starter", "vintage", "grail"],
    featured: true,
    trending: true,
    description:
      "The crown jewel of Pokémon collecting. Base Set Charizard remains the most iconic card in the hobby, with shadowless and 1st Edition variants reaching six-figure prices at auction.",
    artist: "Mitsuhiro Arita",
    type: "Fire",
    hp: 120,
  },
  {
    id: "c2",
    slug: "pikachu-base-set",
    name: "Pikachu",
    set: "Base Set",
    setSlug: "base-set",
    number: "58/102",
    year: 1999,
    rarity: "Common",
    image: "https://images.pokemontcg.io/base1/58_hires.png",
    marketPrice: 85,
    priceChange30d: 2.1,
    priceHistory: generatePriceHistory(85, 24, 0.05),
    recentSales: [
      { id: "rs6", date: "2026-08-12", price: 92, grade: "10", company: "PSA", platform: "eBay" },
      { id: "rs7", date: "2026-08-01", price: 78, condition: "Near Mint", platform: "TCGPlayer" },
      { id: "rs8", date: "2026-07-20", price: 145, grade: "10", company: "PSA", platform: "Heritage" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 8942, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 12453, higherGrades: 8942 },
      { company: "BGS", grade: "9.5", population: 2103, higherGrades: 456 },
    ],
    tags: ["electric", "mascot", "vintage"],
    trending: true,
    description:
      "The face of Pokémon worldwide. While common ungraded, high-grade Base Set Pikachu slabs have become surprisingly collectible.",
    artist: "Mitsuhiro Arita",
    type: "Electric",
    hp: 40,
  },
  {
    id: "c3",
    slug: "umbreon-vmax-alt-art",
    name: "Umbreon VMAX",
    set: "Evolving Skies",
    setSlug: "evolving-skies",
    number: "215/203",
    year: 2021,
    rarity: "Alternate Art",
    image: "https://images.pokemontcg.io/swsh7/215_hires.png",
    marketPrice: 485,
    priceChange30d: -3.4,
    priceHistory: generatePriceHistory(485, 18, 0.12),
    recentSales: [
      { id: "rs9", date: "2026-08-11", price: 510, grade: "10", company: "PSA", platform: "eBay" },
      { id: "rs10", date: "2026-08-03", price: 475, grade: "10", company: "CGC", platform: "TCGPlayer" },
      { id: "rs11", date: "2026-07-25", price: 520, grade: "10", company: "PSA", platform: "PWCC" },
      { id: "rs12", date: "2026-07-10", price: 460, condition: "Near Mint", platform: "eBay" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 18432, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 8234, higherGrades: 18432 },
      { company: "BGS", grade: "10", population: 892, higherGrades: 0 },
      { company: "CGC", grade: "10", population: 3421, higherGrades: 0 },
    ],
    tags: ["dark", "eeveelution", "modern", "alt-art"],
    featured: true,
    trending: true,
    description:
      "The Moonbreon — arguably the most sought-after modern Pokémon card. Its ethereal moonlit artwork by Akira Egawa has made it a contemporary grail.",
    artist: "Akira Egawa",
    type: "Dark",
    hp: 310,
  },
  {
    id: "c4",
    slug: "lugia-neo-genesis-holo",
    name: "Lugia",
    set: "Neo Genesis",
    setSlug: "neo-genesis",
    number: "9/111",
    year: 2000,
    rarity: "Holo Rare",
    image: "https://images.pokemontcg.io/neo1/9_hires.png",
    marketPrice: 3200,
    priceChange30d: 5.7,
    priceHistory: generatePriceHistory(3200, 24, 0.07),
    recentSales: [
      { id: "rs13", date: "2026-08-08", price: 3400, grade: "9", company: "PSA", platform: "Heritage" },
      { id: "rs14", date: "2026-07-30", price: 8900, grade: "10", company: "PSA", platform: "Goldin" },
      { id: "rs15", date: "2026-07-18", price: 2800, grade: "8", company: "PSA", platform: "eBay" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 47, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 892, higherGrades: 47 },
      { company: "PSA", grade: "8", population: 1456, higherGrades: 939 },
      { company: "BGS", grade: "9.5", population: 134, higherGrades: 8 },
    ],
    tags: ["psychic", "legendary", "vintage", "grail"],
    featured: true,
    description:
      "Neo Genesis Lugia is one of the hardest vintage holos to grade PSA 10. Its stunning silver foil and low pop make it a serious investment piece.",
    artist: "Hironobu Yoshida",
    type: "Psychic",
    hp: 90,
  },
  {
    id: "c5",
    slug: "mewtwo-base-set-holo",
    name: "Mewtwo",
    set: "Base Set",
    setSlug: "base-set",
    number: "10/102",
    year: 1999,
    rarity: "Holo Rare",
    image: "https://images.pokemontcg.io/base1/10_hires.png",
    marketPrice: 890,
    priceChange30d: 4.3,
    priceHistory: generatePriceHistory(890, 24, 0.06),
    recentSales: [
      { id: "rs16", date: "2026-08-09", price: 920, grade: "9", company: "PSA", platform: "eBay" },
      { id: "rs17", date: "2026-07-22", price: 2100, grade: "10", company: "PSA", platform: "PWCC" },
      { id: "rs18", date: "2026-07-05", price: 780, condition: "Near Mint", platform: "TCGPlayer" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 312, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 3891, higherGrades: 312 },
      { company: "PSA", grade: "8", population: 5234, higherGrades: 4203 },
      { company: "CGC", grade: "9.5", population: 567, higherGrades: 45 },
    ],
    tags: ["psychic", "legendary", "vintage"],
    trending: true,
    description:
      "Base Set Mewtwo combines nostalgic appeal with strong long-term value. The holo pattern and Ken Sugimori artwork define early Pokémon TCG aesthetics.",
    artist: "Ken Sugimori",
    type: "Psychic",
    hp: 60,
  },
  {
    id: "c6",
    slug: "charizard-celebrations-classic",
    name: "Charizard (Classic Collection)",
    set: "Celebrations",
    setSlug: "celebrations",
    number: "4/102",
    year: 2021,
    rarity: "Classic Collection",
    image: "https://images.pokemontcg.io/cel25/4_hires.png",
    marketPrice: 95,
    priceChange30d: -1.2,
    priceHistory: generatePriceHistory(95, 12, 0.04),
    recentSales: [
      { id: "rs19", date: "2026-08-07", price: 102, grade: "10", company: "PSA", platform: "eBay" },
      { id: "rs20", date: "2026-07-28", price: 88, condition: "Near Mint", platform: "TCGPlayer" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 42156, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 18934, higherGrades: 42156 },
    ],
    tags: ["fire", "starter", "modern", "anniversary"],
    isNew: false,
    description:
      "Celebrations Classic Collection reprint of the iconic Base Set Charizard with the 25th anniversary logo.",
    artist: "Mitsuhiro Arita",
    type: "Fire",
    hp: 120,
  },
  {
    id: "c7",
    slug: "pikachu-vmax-151",
    name: "Pikachu VMAX",
    set: "Scarlet & Violet — 151",
    setSlug: "151",
    number: "173/165",
    year: 2023,
    rarity: "Special Illustration Rare",
    image: "https://images.pokemontcg.io/sv3pt5/173_hires.png",
    marketPrice: 165,
    priceChange30d: 12.4,
    priceHistory: generatePriceHistory(165, 12, 0.1),
    recentSales: [
      { id: "rs21", date: "2026-08-13", price: 175, grade: "10", company: "PSA", platform: "eBay" },
      { id: "rs22", date: "2026-08-02", price: 158, condition: "Near Mint", platform: "TCGPlayer" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 6234, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 2891, higherGrades: 6234 },
    ],
    tags: ["electric", "mascot", "modern", "alt-art"],
    isNew: true,
    trending: true,
    description:
      "The 151 set Pikachu VMAX features whimsical illustration rare artwork that's quickly become a modern favorite.",
    artist: "Akira Komayama",
    type: "Electric",
    hp: 310,
  },
  {
    id: "c8",
    slug: "umbreon-gold-star",
    name: "Umbreon ★",
    set: "POP Series 5",
    setSlug: "pop-series-5",
    number: "17/17",
    year: 2007,
    rarity: "Gold Star",
    image: "https://images.pokemontcg.io/pop5/17_hires.png",
    marketPrice: 18500,
    priceChange30d: 6.8,
    priceHistory: generatePriceHistory(18500, 24, 0.06),
    recentSales: [
      { id: "rs23", date: "2026-07-25", price: 19200, grade: "9", company: "PSA", platform: "Goldin" },
      { id: "rs24", date: "2026-06-15", price: 42000, grade: "10", company: "PSA", platform: "Heritage" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 18, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 142, higherGrades: 18 },
      { company: "BGS", grade: "9.5", population: 23, higherGrades: 2 },
    ],
    tags: ["dark", "eeveelution", "vintage", "grail", "gold-star"],
    featured: true,
    description:
      "One of the rarest Umbreon cards ever printed. Gold Star cards from POP Series remain among the most coveted Eeveelution collectibles.",
    artist: "Masakazu Fukuda",
    type: "Dark",
    hp: 70,
  },
  {
    id: "c9",
    slug: "mewtwo-gx-shining-legends",
    name: "Mewtwo GX",
    set: "Shining Legends",
    setSlug: "shining-legends",
    number: "39/73",
    year: 2017,
    rarity: "Ultra Rare",
    image: "https://images.pokemontcg.io/sm35/39_hires.png",
    marketPrice: 45,
    priceChange30d: 0.8,
    priceHistory: generatePriceHistory(45, 18, 0.03),
    recentSales: [
      { id: "rs25", date: "2026-08-04", price: 48, condition: "Near Mint", platform: "TCGPlayer" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 1234, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 892, higherGrades: 1234 },
    ],
    tags: ["psychic", "legendary", "modern"],
    description: "Shining Legends Mewtwo GX with full-art holo pattern.",
    artist: "5ban Graphics",
    type: "Psychic",
    hp: 190,
  },
  {
    id: "c10",
    slug: "lugia-v-alt-art",
    name: "Lugia V",
    set: "Silver Tempest",
    setSlug: "silver-tempest",
    number: "186/195",
    year: 2022,
    rarity: "Alternate Art",
    image: "https://images.pokemontcg.io/swsh12/186_hires.png",
    marketPrice: 210,
    priceChange30d: -2.1,
    priceHistory: generatePriceHistory(210, 15, 0.08),
    recentSales: [
      { id: "rs26", date: "2026-08-06", price: 225, grade: "10", company: "PSA", platform: "eBay" },
      { id: "rs27", date: "2026-07-19", price: 198, condition: "Near Mint", platform: "TCGPlayer" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 4521, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 2134, higherGrades: 4521 },
    ],
    tags: ["psychic", "legendary", "modern", "alt-art"],
    isNew: true,
    description:
      "Silver Tempest alternate art Lugia V featuring the legendary bird soaring over ancient ruins.",
    artist: "N-Design Inc.",
    type: "Colorless",
    hp: 220,
  },
  {
    id: "c11",
    slug: "charizard-vstar-brilliant-stars",
    name: "Charizard VSTAR",
    set: "Brilliant Stars",
    setSlug: "brilliant-stars",
    number: "174/172",
    year: 2022,
    rarity: "Special Art Rare",
    image: "https://images.pokemontcg.io/swsh9/174_hires.png",
    marketPrice: 275,
    priceChange30d: 3.2,
    priceHistory: generatePriceHistory(275, 15, 0.07),
    recentSales: [
      { id: "rs28", date: "2026-08-10", price: 290, grade: "10", company: "PSA", platform: "eBay" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 7832, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 3421, higherGrades: 7832 },
    ],
    tags: ["fire", "starter", "modern", "alt-art"],
    trending: true,
    description:
      "Brilliant Stars Charizard VSTAR special art rare with dynamic flame artwork.",
    artist: "5ban Graphics",
    type: "Fire",
    hp: 280,
  },
  {
    id: "c12",
    slug: "pikachu-flying-celebrations",
    name: "Flying Pikachu V",
    set: "Celebrations",
    setSlug: "celebrations",
    number: "25/25",
    year: 2021,
    rarity: "Ultra Rare",
    image: "https://images.pokemontcg.io/cel25/25_hires.png",
    marketPrice: 38,
    priceChange30d: 1.5,
    priceHistory: generatePriceHistory(38, 12, 0.04),
    recentSales: [
      { id: "rs29", date: "2026-08-01", price: 42, grade: "10", company: "PSA", platform: "eBay" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 15678, higherGrades: 0 },
    ],
    tags: ["electric", "mascot", "modern", "anniversary"],
    description:
      "The beloved Flying Pikachu promo reimagined for Celebrations with balloon artwork.",
    artist: "The Pokémon Company Art Team",
    type: "Electric",
    hp: 190,
  },
  {
    id: "c13",
    slug: "blaine-charizard-gym",
    name: "Blaine's Charizard",
    set: "Gym Challenge",
    setSlug: "gym-challenge",
    number: "2/132",
    year: 2000,
    rarity: "Holo Rare",
    image: "https://images.pokemontcg.io/gym2/2_hires.png",
    marketPrice: 1450,
    priceChange30d: 4.1,
    priceHistory: generatePriceHistory(1450, 24, 0.06),
    recentSales: [
      { id: "rs30", date: "2026-07-29", price: 1520, grade: "9", company: "PSA", platform: "Heritage" },
      { id: "rs31", date: "2026-07-12", price: 3800, grade: "10", company: "PSA", platform: "PWCC" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 89, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 567, higherGrades: 89 },
    ],
    tags: ["fire", "starter", "vintage", "gym"],
    description:
      "Gym Challenge Blaine's Charizard — a vintage holo with unique artwork showing Charizard in Blaine's gym.",
    artist: "Ken Sugimori",
    type: "Fire",
    hp: 100,
  },
  {
    id: "c14",
    slug: "mewtwo-ex-151",
    name: "Mewtwo ex",
    set: "Scarlet & Violet — 151",
    setSlug: "151",
    number: "183/165",
    year: 2023,
    rarity: "Special Illustration Rare",
    image: "https://images.pokemontcg.io/sv3pt5/183_hires.png",
    marketPrice: 125,
    priceChange30d: 8.9,
    priceHistory: generatePriceHistory(125, 12, 0.09),
    recentSales: [
      { id: "rs32", date: "2026-08-11", price: 132, grade: "10", company: "PSA", platform: "eBay" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 3892, higherGrades: 0 },
    ],
    tags: ["psychic", "legendary", "modern", "alt-art"],
    isNew: true,
    description:
      "151 set Mewtwo ex special illustration rare with laboratory-themed artwork.",
    artist: "Akira Komayama",
    type: "Psychic",
    hp: 230,
  },
  {
    id: "c15",
    slug: "charizard-ex-obsidian-flames",
    name: "Charizard ex",
    set: "Obsidian Flames",
    setSlug: "obsidian-flames",
    number: "223/197",
    year: 2023,
    rarity: "Special Illustration Rare",
    image: "https://images.pokemontcg.io/sv3/223_hires.png",
    marketPrice: 185,
    priceChange30d: -4.2,
    priceHistory: generatePriceHistory(185, 12, 0.1),
    recentSales: [
      { id: "rs33", date: "2026-08-08", price: 178, condition: "Near Mint", platform: "TCGPlayer" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 5678, higherGrades: 0 },
    ],
    tags: ["fire", "starter", "modern", "alt-art"],
    isNew: true,
    description:
      "Obsidian Flames Charizard ex with dark flame special illustration rare artwork.",
    artist: "5ban Graphics",
    type: "Dark",
    hp: 330,
  },
  {
    id: "c16",
    slug: "umbreon-ex-prismatic",
    name: "Umbreon ex",
    set: "Prismatic Evolutions",
    setSlug: "prismatic-evolutions",
    number: "161/131",
    year: 2025,
    rarity: "Special Illustration Rare",
    image: "https://images.pokemontcg.io/sv8pt5/161_hires.png",
    marketPrice: 320,
    priceChange30d: 18.5,
    priceHistory: generatePriceHistory(320, 6, 0.15),
    recentSales: [
      { id: "rs34", date: "2026-08-14", price: 345, grade: "10", company: "PSA", platform: "eBay" },
      { id: "rs35", date: "2026-08-10", price: 310, condition: "Near Mint", platform: "TCGPlayer" },
    ],
    gradedPopulation: [
      { company: "PSA", grade: "10", population: 892, higherGrades: 0 },
      { company: "PSA", grade: "9", population: 234, higherGrades: 892 },
    ],
    tags: ["dark", "eeveelution", "modern", "alt-art"],
    featured: true,
    isNew: true,
    trending: true,
    description:
      "The latest Umbreon grail from Prismatic Evolutions. Premium illustration rare with prismatic foil treatment.",
    artist: "Akira Egawa",
    type: "Dark",
    hp: 280,
  },
];

export const listings: SellerListing[] = [
  { id: "l1", sellerId: "s3", cardId: "c1", price: 12800, condition: "Near Mint", grade: "9", gradeCompany: "PSA", certNumber: "48291034", shipping: 25, verified: true, photos: 6 },
  { id: "l2", sellerId: "s1", cardId: "c1", price: 11900, condition: "Excellent", grade: "8", gradeCompany: "PSA", certNumber: "39182746", shipping: 15, verified: true, photos: 4 },
  { id: "l3", sellerId: "s5", cardId: "c1", price: 14200, condition: "Mint", grade: "9.5", gradeCompany: "BGS", certNumber: "0012345678", shipping: 30, verified: true, photos: 8 },
  { id: "l4", sellerId: "s2", cardId: "c1", price: 11200, condition: "Near Mint", shipping: 12, verified: true, photos: 3 },
  { id: "l5", sellerId: "s6", cardId: "c3", price: 510, condition: "Mint", grade: "10", gradeCompany: "PSA", certNumber: "91234567", shipping: 8, verified: true, photos: 5 },
  { id: "l6", sellerId: "s4", cardId: "c3", price: 460, condition: "Near Mint", shipping: 5, verified: true, photos: 2 },
  { id: "l7", sellerId: "s3", cardId: "c4", price: 3400, condition: "Near Mint", grade: "9", gradeCompany: "PSA", certNumber: "55667788", shipping: 20, verified: true, photos: 5 },
  { id: "l8", sellerId: "s1", cardId: "c4", price: 2800, condition: "Excellent", grade: "8", gradeCompany: "PSA", certNumber: "44332211", shipping: 15, verified: true, photos: 4 },
  { id: "l9", sellerId: "s5", cardId: "c5", price: 920, condition: "Near Mint", grade: "9", gradeCompany: "PSA", certNumber: "77889900", shipping: 10, verified: true, photos: 4 },
  { id: "l10", sellerId: "s2", cardId: "c5", price: 780, condition: "Near Mint", shipping: 8, verified: true, photos: 2 },
  { id: "l11", sellerId: "s6", cardId: "c8", price: 19200, condition: "Near Mint", grade: "9", gradeCompany: "PSA", certNumber: "11223344", shipping: 35, verified: true, photos: 7 },
  { id: "l12", sellerId: "s3", cardId: "c16", price: 345, condition: "Mint", grade: "10", gradeCompany: "PSA", certNumber: "99887766", shipping: 8, verified: true, photos: 5 },
  { id: "l13", sellerId: "s4", cardId: "c16", price: 310, condition: "Near Mint", shipping: 5, verified: true, photos: 3 },
  { id: "l14", sellerId: "s1", cardId: "c7", price: 175, condition: "Mint", grade: "10", gradeCompany: "PSA", certNumber: "55443322", shipping: 8, verified: true, photos: 4 },
  { id: "l15", sellerId: "s2", cardId: "c2", price: 92, condition: "Near Mint", grade: "10", gradeCompany: "PSA", certNumber: "66778899", shipping: 5, verified: true, photos: 3 },
  { id: "l16", sellerId: "s6", cardId: "c11", price: 290, condition: "Mint", grade: "10", gradeCompany: "PSA", certNumber: "33445566", shipping: 8, verified: true, photos: 4 },
  { id: "l17", sellerId: "s5", cardId: "c13", price: 1520, condition: "Near Mint", grade: "9", gradeCompany: "PSA", certNumber: "22334455", shipping: 18, verified: true, photos: 5 },
  { id: "l18", sellerId: "s3", cardId: "c10", price: 225, condition: "Mint", grade: "10", gradeCompany: "PSA", certNumber: "88776655", shipping: 8, verified: true, photos: 4 },
  { id: "l19", sellerId: "s4", cardId: "c14", price: 132, condition: "Near Mint", grade: "10", gradeCompany: "PSA", certNumber: "77665544", shipping: 5, verified: true, photos: 3 },
  { id: "l20", sellerId: "s1", cardId: "c15", price: 178, condition: "Near Mint", shipping: 5, verified: true, photos: 2 },
];

export function getListingsForCard(cardId: string): SellerListing[] {
  return listings.filter((l) => l.cardId === cardId);
}

export function getListingById(id: string): SellerListing | undefined {
  return listings.find((l) => l.id === id);
}

export function getFeaturedCards(): Card[] {
  return cards.filter((c) => c.featured);
}

export function getTrendingCards(): Card[] {
  return cards.filter((c) => c.trending);
}

export function getNewCards(): Card[] {
  return cards.filter((c) => c.isNew);
}

export function getCardsBySet(setSlug: string): Card[] {
  return cards.filter((c) => c.setSlug === setSlug);
}

export function getAllRarities(): string[] {
  return [...new Set(cards.map((c) => c.rarity))].sort();
}
