"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getCartServerSnapshot,
  getCartSnapshot,
  parseCart,
  subscribeCart,
  writeCart,
} from "@/features/cart/cartStore";
import { useHydrated } from "@/lib/useHydrated";
import { messages } from "@/messages/en";
import type { CartLine } from "@/types/order";

interface CartContextValue {
  lines: CartLine[];
  count: number; // total number of items
  hydrated: boolean; // false until the browser has loaded the saved cart
  maxQuantityPerLine: number;
  addItem: (itemId: string, itemName: string) => "added" | "limit";
  setQuantity: (itemId: string, itemName: string, quantity: number) => void;
  removeItem: (itemId: string, itemName: string) => void;
  removeItems: (itemIds: string[]) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
  maxQuantityPerLine: number;
  maxItemsPerOrder: number;
  children: ReactNode;
}

export function CartProvider({ maxQuantityPerLine, maxItemsPerOrder, children }: CartProviderProps) {
  const raw = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const hydrated = useHydrated();
  const [announcement, setAnnouncement] = useState("");

  const lines = useMemo(
    () => parseCart(raw, maxQuantityPerLine, maxItemsPerOrder),
    [raw, maxQuantityPerLine, maxItemsPerOrder],
  );
  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  // Clearing first makes screen readers re-announce even when the text is identical
  const announce = useCallback((text: string) => {
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(text), 50);
  }, []);

  // Always read the latest saved cart, so rapid clicks never use stale data
  const readLines = useCallback(
    () => parseCart(getCartSnapshot(), maxQuantityPerLine, maxItemsPerOrder),
    [maxQuantityPerLine, maxItemsPerOrder],
  );

  const addItem = useCallback(
    (itemId: string, itemName: string): "added" | "limit" => {
      const current = readLines();
      const existing = current.find((line) => line.itemId === itemId);
      const total = current.reduce((sum, line) => sum + line.quantity, 0);

      if ((existing?.quantity ?? 0) >= maxQuantityPerLine || total >= maxItemsPerOrder) {
        announce(messages.cart.announceLimit(itemName));
        return "limit";
      }
      const next = existing
        ? current.map((line) => (line.itemId === itemId ? { ...line, quantity: line.quantity + 1 } : line))
        : [...current, { itemId, quantity: 1 }];
      writeCart(next);
      announce(messages.cart.announceAdded(itemName));
      return "added";
    },
    [readLines, announce, maxQuantityPerLine, maxItemsPerOrder],
  );

  const setQuantity = useCallback(
    (itemId: string, itemName: string, quantity: number) => {
      const current = readLines();
      const others = current.filter((line) => line.itemId !== itemId);
      const othersTotal = others.reduce((sum, line) => sum + line.quantity, 0);
      const allowed = Math.min(maxQuantityPerLine, maxItemsPerOrder - othersTotal);
      const next = Math.max(0, Math.min(Math.floor(quantity), allowed));

      if (next === 0) {
        writeCart(others);
        announce(messages.cart.announceRemoved(itemName));
        return;
      }
      const exists = current.some((line) => line.itemId === itemId);
      writeCart(
        exists
          ? current.map((line) => (line.itemId === itemId ? { ...line, quantity: next } : line))
          : [...current, { itemId, quantity: next }],
      );
      announce(messages.cart.announceQuantity(itemName, next));
    },
    [readLines, announce, maxQuantityPerLine, maxItemsPerOrder],
  );

  const removeItem = useCallback(
    (itemId: string, itemName: string) => {
      writeCart(readLines().filter((line) => line.itemId !== itemId));
      announce(messages.cart.announceRemoved(itemName));
    },
    [readLines, announce],
  );

  const removeItems = useCallback(
    (itemIds: string[]) => {
      writeCart(readLines().filter((line) => !itemIds.includes(line.itemId)));
    },
    [readLines],
  );

  const clear = useCallback(() => writeCart([]), []);

  const value = useMemo<CartContextValue>(
    () => ({ lines, count, hydrated, maxQuantityPerLine, addItem, setQuantity, removeItem, removeItems, clear }),
    [lines, count, hydrated, maxQuantityPerLine, addItem, setQuantity, removeItem, removeItems, clear],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}