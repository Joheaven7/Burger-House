import type { OrderConfirmation } from "@/types/order";

const KEY = "burger-house-last-order";

export function saveConfirmation(confirmation: OrderConfirmation): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(confirmation));
  } catch {
    // storage unavailable: the confirmation page will show the "no recent order" message
  }
}

export const subscribeConfirmation = () => () => {};

export function getConfirmationSnapshot(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function getConfirmationServerSnapshot(): string | null {
  return null;
}

export function parseConfirmation(raw: string | null): OrderConfirmation | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<OrderConfirmation>;
    if (typeof value.orderNumber === "string" && Array.isArray(value.items)) {
      return value as OrderConfirmation;
    }
  } catch {
    // fall through
  }
  return null;
}