import type { OrderType } from "../models/order";

// Pure pricing and availability rules: no database, easy to test. The server is the only authority on money.

export interface PricingSettings {
  currency: string;
  locale: string;
  ordersPaused: boolean;
  orderingClosed: boolean; // outside opening hours (only when hours are enforced)
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFeeMinor: number;
  minimumOrderMinor: number | null;
  maxQuantityPerLine: number;
  maxItemsPerOrder: number;
}

/** Only ACTIVE (not archived) items in ACTIVE categories are passed in. */
export interface PricingItem {
  id: string;
  name: string;
  priceMinor: number;
  available: boolean;
}

export interface QuoteInputLine {
  itemId: string;
  quantity: number;
}

export interface QuoteLine {
  itemId: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface QuoteConflict {
  itemId: string;
  name?: string;
  reason: "removed" | "unavailable" | "quantity_limit";
}

export interface QuoteBlock {
  code:
    | "ORDERING_PAUSED"
    | "ORDERING_CLOSED"
    | "ORDER_TYPE_DISABLED"
    | "EMPTY_CART"
    | "ITEMS_UNAVAILABLE"
    | "TOO_MANY_ITEMS"
    | "BELOW_MINIMUM";
  orderType?: OrderType;
  minimumOrderMinor?: number;
  maxItemsPerOrder?: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  currency: string;
  locale: string;
  conflicts: QuoteConflict[];
  block: QuoteBlock | null;
}

export function buildQuote(
  settings: PricingSettings,
  items: PricingItem[],
  input: { lines: QuoteInputLine[]; orderType?: OrderType },
): Quote {
  const byId = new Map(items.map((item) => [item.id, item]));

  // Merge duplicate lines so splitting one item across lines cannot bypass the per-line limit.
  const quantities = new Map<string, number>();
  const invalid = new Set<string>();
  for (const line of input.lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) invalid.add(line.itemId);
    else quantities.set(line.itemId, (quantities.get(line.itemId) ?? 0) + line.quantity);
  }
  const orderedIds = [...new Set(input.lines.map((line) => line.itemId))];

  const lines: QuoteLine[] = [];
  const conflicts: QuoteConflict[] = [];

  for (const itemId of orderedIds) {
    const item = byId.get(itemId);
    if (!item) {
      conflicts.push({ itemId, reason: "removed" });
      continue;
    }
    if (!item.available) {
      conflicts.push({ itemId, name: item.name, reason: "unavailable" });
      continue;
    }
    const quantity = quantities.get(itemId) ?? 0;
    if (invalid.has(itemId) || quantity > settings.maxQuantityPerLine) {
      conflicts.push({ itemId, name: item.name, reason: "quantity_limit" });
      continue;
    }
    lines.push({
      itemId,
      name: item.name,
      unitPriceMinor: item.priceMinor, // always the current database price
      quantity,
      lineTotalMinor: item.priceMinor * quantity,
    });
  }

  const subtotalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  const deliveryFeeMinor = input.orderType === "delivery" ? settings.deliveryFeeMinor : 0;
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);

  let block: QuoteBlock | null = null;
  if (settings.ordersPaused) block = { code: "ORDERING_PAUSED" };
  else if (settings.orderingClosed) block = { code: "ORDERING_CLOSED" };
  else if (orderedIds.length === 0) block = { code: "EMPTY_CART" };
  else if (conflicts.length > 0) block = { code: "ITEMS_UNAVAILABLE" };
  else if (totalQuantity > settings.maxItemsPerOrder) block = { code: "TOO_MANY_ITEMS", maxItemsPerOrder: settings.maxItemsPerOrder };
  else if (input.orderType === "pickup" && !settings.pickupEnabled) block = { code: "ORDER_TYPE_DISABLED", orderType: "pickup" };
  else if (input.orderType === "delivery" && !settings.deliveryEnabled) block = { code: "ORDER_TYPE_DISABLED", orderType: "delivery" };
  else if (settings.minimumOrderMinor !== null && subtotalMinor < settings.minimumOrderMinor)
    block = { code: "BELOW_MINIMUM", minimumOrderMinor: settings.minimumOrderMinor };

  return {
    lines,
    subtotalMinor,
    deliveryFeeMinor,
    totalMinor: subtotalMinor + deliveryFeeMinor,
    currency: settings.currency,
    locale: settings.locale,
    conflicts,
    block,
  };
}