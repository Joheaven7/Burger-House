import mongoose, { type Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db";
import { env } from "../config/env";
import { MenuCategory, MenuItem } from "../models/menu";
import { SettingsModel } from "../models/settings";
import { getSettings } from "../services/settings.service";

// DEVELOPMENT ONLY. Every name, description and price below is SAMPLE data, not real restaurant data.
// Prices are integers in minor units (28000 = 280.00).
const categories = [
  { name: "Burgers", slug: "burgers", sortOrder: 1 },
  { name: "Chicken", slug: "chicken", sortOrder: 2 },
  { name: "Sides", slug: "sides", sortOrder: 3 },
  { name: "Drinks", slug: "drinks", sortOrder: 4 },
];

const items = [
  { category: "burgers", name: "Classic Burger", description: "Beef patty, lettuce, tomato, onion and house sauce in a toasted bun.", priceMinor: 28000, featured: true, available: true, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80" },
  { category: "burgers", name: "Cheeseburger", description: "Beef patty with melted cheese, pickles and mustard.", priceMinor: 32000, featured: true, available: true, imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80" },
  { category: "burgers", name: "Double Burger", description: "Two beef patties, double cheese and house sauce.", priceMinor: 42000, featured: false, available: false, imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80" },
  { category: "burgers", name: "Spicy Burger", description: "Beef patty with hot peppers, cheese and a spicy sauce.", priceMinor: 34000, featured: false, available: true, imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80" },
  { category: "chicken", name: "Crispy Chicken Burger", description: "Crispy chicken fillet with lettuce and creamy sauce.", priceMinor: 30000, featured: true, available: true, imageUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80" },
  { category: "chicken", name: "Chicken Strips", description: "Crispy chicken strips served with a dipping sauce.", priceMinor: 26000, featured: false, available: true, imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80" },
  { category: "chicken", name: "Grilled Chicken Sandwich", description: "Grilled chicken breast with fresh vegetables.", priceMinor: 31000, featured: false, available: true, imageUrl: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80" },
  { category: "sides", name: "Fries", description: "Golden, crispy fries with salt.", priceMinor: 12000, featured: true, available: true, imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80" },
  { category: "sides", name: "Onion Rings", description: "Crunchy battered onion rings.", priceMinor: 14000, featured: false, available: true, imageUrl: "https://images.unsplash.com/photo-1639024471287-032f66705664?auto=format&fit=crop&w=800&q=80" },
  { category: "sides", name: "Coleslaw", description: "Fresh cabbage and carrot salad with a light dressing.", priceMinor: 9000, featured: false, available: true, imageUrl: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=800&q=80" },
  { category: "drinks", name: "Cola", description: "Chilled soft drink.", priceMinor: 8000, featured: false, available: true, imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80" },
  { category: "drinks", name: "Orange Juice", description: "Fresh orange juice.", priceMinor: 11000, featured: false, available: true, imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80" },
  { category: "drinks", name: "Milkshake", description: "Thick and creamy milkshake.", priceMinor: 18000, featured: false, available: true, imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80" },
  { category: "drinks", name: "Bottled Water", description: "Still water.", priceMinor: 4000, featured: false, available: true, imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80" },
];

async function main() {
  if (env.NODE_ENV === "production") throw new Error("Refusing to seed sample data in production.");
  await connectDatabase();
    // Safety net: never put sample data into a database that looks like the real one.
  if (/prod|live/i.test(mongoose.connection.name)) {
    throw new Error(`Refusing to seed: database "${mongoose.connection.name}" looks like production.`);
  }

  const ids = new Map<string, Types.ObjectId>();
  for (const category of categories) {
    const doc = await MenuCategory.findOneAndUpdate({ slug: category.slug }, { $set: { ...category, active: true } }, { upsert: true, returnDocument: "after" });
    if (!doc) throw new Error(`Could not save category ${category.slug}`);
    ids.set(category.slug, doc._id);
  }

  let order = 0;
  for (const { category, ...item } of items) {
    order += 1;
    const categoryId = ids.get(category);
    if (!categoryId) throw new Error(`Unknown category ${category}`);
    await MenuItem.updateOne(
      { name: item.name, categoryId },
      { $set: { ...item, categoryId, sortOrder: order, active: true } },
      { upsert: true },
    );
  }

  // Sample ordering settings so delivery can be tested (placeholders until the owner confirms: D-01 to D-09).
  await getSettings();
  await SettingsModel.updateOne(
    { key: "main" },
    {
      $set: {
        currency: "ETB",
        deliveryEnabled: true,
        deliveryFeeMinor: 5000,
        deliveryNote: "Delivery area details will be confirmed by the restaurant.",
        estimateText: "The restaurant will contact you to confirm your order.",
      },
    },
  );

  console.log(`Seeded ${categories.length} categories and ${items.length} sample items.`);
  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});