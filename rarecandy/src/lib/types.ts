export type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Rare Holo"
  | "Ultra Rare"
  | "Secret Rare"
  | "Gold Star"
  | "Amazing Rare"
  | "Illustration Rare"
  | "Special Illustration Rare"
  | "Hyper Rare"
  | "Promo";

export type Condition =
  | "Mint"
  | "Near Mint"
  | "Lightly Played"
  | "Moderately Played"
  | "Heavily Played";

export type GradingCompany = "PSA" | "BGS" | "CGC";

export type PokemonType =
  | "Fire"
  | "Water"
  | "Grass"
  | "Lightning"
  | "Psychic"
  | "Fighting"
  | "Darkness"
  | "Metal"
  | "Dragon"
  | "Fairy"
  | "Colorless";

export interface PricePoint {
  date: string;
  price: number;
}

export interface Sale {
  id: string;
  date: string;
  price: number;
  condition: Condition | string;
  grade?: string;
  company?: GradingCompany;
  source: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  price: number;
  condition: Condition;
  grade?: string;
  company?: GradingCompany;
  certNumber?: string;
  shipping: number;
  quantity: number;
}

export interface GradePop {
  company: GradingCompany;
  grade: string;
  population: number;
}

export interface Seller {
  id: string;
  slug: string;
  name: string;
  city: string;
  rating: number;
  sales: number;
  joined: string;
  response: string;
  verified: boolean;
}

export interface CardSet {
  id: string;
  slug: string;
  name: string;
  series: string;
  year: number;
  released: string;
  printed: number;
  language: string;
  blurb: string;
}

export interface Card {
  id: string;
  slug: string;
  name: string;
  pokemon: string;
  pokedex: number;
  setId: string;
  number: string;
  rarity: Rarity;
  type: PokemonType;
  hp?: number;
  illustrator: string;
  year: number;
  releaseDate: string;
  description: string;
  flavor?: string;
  marketPrice: number;
  change7d: number;
  change30d: number;
  weeklyVolume: number;
  featured?: boolean;
  trending?: boolean;
  isNew?: boolean;
  priceHistory: PricePoint[];
  recentSales: Sale[];
  listings: Listing[];
  populations: GradePop[];
  tags: string[];
}

export interface CartItem {
  listingId: string;
  cardId: string;
  quantity: number;
}
