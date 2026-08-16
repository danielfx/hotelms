export type GradeCompany = "PSA" | "BGS" | "CGC";
export type Condition = "Mint" | "Near Mint" | "Excellent" | "Good" | "Played";
export type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "trending"
  | "name";

export interface GradedPopulation {
  company: GradeCompany;
  grade: string;
  population: number;
  higherGrades: number;
}

export interface RecentSale {
  id: string;
  date: string;
  price: number;
  grade?: string;
  company?: GradeCompany;
  condition?: Condition;
  platform: string;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface Seller {
  id: string;
  name: string;
  rating: number;
  sales: number;
  verified: boolean;
  responseTime: string;
  location: string;
}

export interface SellerListing {
  id: string;
  sellerId: string;
  cardId: string;
  price: number;
  condition: Condition;
  grade?: string;
  gradeCompany?: GradeCompany;
  certNumber?: string;
  shipping: number;
  verified: boolean;
  photos: number;
}

export interface CardSet {
  id: string;
  slug: string;
  name: string;
  year: number;
  cardCount: number;
  image: string;
  description: string;
  featured?: boolean;
}

export interface Card {
  id: string;
  slug: string;
  name: string;
  set: string;
  setSlug: string;
  number: string;
  year: number;
  rarity: string;
  image: string;
  marketPrice: number;
  priceChange30d: number;
  priceHistory: PricePoint[];
  recentSales: RecentSale[];
  gradedPopulation: GradedPopulation[];
  tags: string[];
  featured?: boolean;
  trending?: boolean;
  isNew?: boolean;
  description: string;
  artist?: string;
  type?: string;
  hp?: number;
}

export interface CartItem {
  listingId: string;
  cardId: string;
  quantity: number;
}

export interface FilterState {
  query: string;
  sets: string[];
  rarities: string[];
  conditions: Condition[];
  minPrice: number | null;
  maxPrice: number | null;
  gradedOnly: boolean;
  sort: SortOption;
}
