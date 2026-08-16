import type { Seller } from "@/lib/types";

export const sellers: Seller[] = [
  {
    id: "s1",
    name: "Vault Collectibles",
    rating: 4.98,
    sales: 2847,
    verified: true,
    responseTime: "< 1 hour",
    location: "Los Angeles, CA",
  },
  {
    id: "s2",
    name: "Card Dynasty",
    rating: 4.95,
    sales: 1923,
    verified: true,
    responseTime: "< 2 hours",
    location: "Chicago, IL",
  },
  {
    id: "s3",
    name: "Mint Condition Co.",
    rating: 4.99,
    sales: 4102,
    verified: true,
    responseTime: "< 30 min",
    location: "New York, NY",
  },
  {
    id: "s4",
    name: "Retro Rares",
    rating: 4.87,
    sales: 876,
    verified: true,
    responseTime: "< 4 hours",
    location: "Portland, OR",
  },
  {
    id: "s5",
    name: "Grail Hunters",
    rating: 4.92,
    sales: 1534,
    verified: true,
    responseTime: "< 1 hour",
    location: "Miami, FL",
  },
  {
    id: "s6",
    name: "TCG Treasury",
    rating: 4.94,
    sales: 2201,
    verified: true,
    responseTime: "< 2 hours",
    location: "Austin, TX",
  },
];

export function getSellerById(id: string): Seller | undefined {
  return sellers.find((s) => s.id === id);
}
