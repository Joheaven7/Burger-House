export interface MenuCategory {
  id: string;
  name: string;
  slug: string; // used in the URL: /menu?category=burgers
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  priceMinor: number; // integer in minor units, e.g. 28000 = 280.00
  imageUrl?: string; // used from Phase 5 on
  available: boolean; // false = sold out today
  featured: boolean; // shown on the home page
  sortOrder: number;
}