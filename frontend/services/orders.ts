import { apiRequest } from "@/lib/api-client";
import type { CheckoutRequest, OrderConfirmation, Quote, QuoteInput } from "@/types/order";

/** Asks the server to price the cart. Nothing is saved. */
export function quoteOrder(input: QuoteInput): Promise<Quote> {
  return apiRequest<Quote>("/orders/quote", {
    method: "POST",
    body: { items: input.lines, orderType: input.orderType },
  });
}

/** Places the order. The same Idempotency-Key can be re-sent safely: it can never create a second order. */
export function submitOrder(request: CheckoutRequest, idempotencyKey: string): Promise<OrderConfirmation> {
  return apiRequest<OrderConfirmation>("/orders", {
    method: "POST",
    body: request,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}