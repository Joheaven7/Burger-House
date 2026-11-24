import { z } from "zod";
import type { CartLine } from "@/types/order";

export const CART_STORAGE_KEY = "burger-house-cart-v1";

const lineListSchema = z.array(
  z.object({
    itemId: z.string().min(1),
    quantity: z.number().int().min(1),
  }),
);

const listeners = new Set<() => void>();
let memoryFallback = "[]"; // used when localStorage is blocked (for example private mode)

export function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getCartSnapshot(): string {
  try {
    return localStorage.getItem(CART_STORAGE_KEY) ?? "[]";
  } catch {
    return memoryFallback;
  }
}

export function getCartServerSnapshot(): string {
  return "[]";
}

export function writeCart(lines: CartLine[]): void {
  const raw = JSON.stringify(lines);
  memoryFallback = raw;
  try {
    localStorage.setItem(CART_STORAGE_KEY, raw);
  } catch {
    // storage unavailable: the in-memory copy keeps the cart working for this visit
  }
  listeners.forEach((listener) => listener());
}

/** Turns stored text into safe cart lines: valid shape, merged duplicates, limits enforced. */
export function parseCart(raw: string, maxQuantityPerLine: number, maxItemsPerOrder: number): CartLine[] {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return [];
  }
  const parsed = lineListSchema.safeParse(json);
  if (!parsed.success) return [];

  const quantities = new Map<string, number>();
  let total = 0;
  for (const line of parsed.data) {
    const already = quantities.get(line.itemId) ?? 0;
    const allowed = Math.min(maxQuantityPerLine - already, maxItemsPerOrder - total);
    const add = Math.min(line.quantity, allowed);
    if (add <= 0) continue;
    quantities.set(line.itemId, already + add);
    total += add;
  }
  return Array.from(quantities, ([itemId, quantity]) => ({ itemId, quantity }));
}