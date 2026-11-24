export type OrderType = "pickup" | "delivery";

/** What the cart stores: only an item id and a quantity. Never a price. */
export interface CartLine {
  itemId: string;
  quantity: number;
}

export interface QuoteInput {
  lines: CartLine[];
  orderType?: OrderType; // delivery adds the delivery fee
}

export interface QuoteLine {
  itemId: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export type QuoteConflictReason = "removed" | "unavailable" | "quantity_limit";

export interface QuoteConflict {
  itemId: string;
  name?: string;
  reason: QuoteConflictReason;
}

export type QuoteBlockCode =
  | "ORDERING_PAUSED"
  | "ORDERING_CLOSED"
  | "ORDER_TYPE_DISABLED"
  | "EMPTY_CART"
  | "ITEMS_UNAVAILABLE"
  | "TOO_MANY_ITEMS"
  | "BELOW_MINIMUM";

/** A reason the order cannot be placed right now. */
export interface QuoteBlock {
  code: QuoteBlockCode;
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

export interface CheckoutRequest {
  items: CartLine[];
  orderType: OrderType;
  customerName: string;
  phone: string; // E.164, e.g. +251911234567
  address?: string; // delivery only
  note?: string;
  expectedTotalMinor: number; // the total the customer saw; a mismatch means prices changed
}

export interface OrderConfirmation {
  orderNumber: string;
  orderType: OrderType;
  items: QuoteLine[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  currency: string;
  locale: string;
  estimateText?: string;
}