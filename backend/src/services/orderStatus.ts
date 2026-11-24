import type { OrderStatus } from "../models/order";

/** The only allowed status changes (ORD-01). Completed and Cancelled are final. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ["preparing", "cancelled"],
  pending: ["preparing", "cancelled"], // legacy alias for received
  preparing: ["ready_for_pickup", "ready", "cancelled"],
  ready_for_pickup: ["completed", "cancelled"],
  ready: ["completed", "cancelled"], // legacy alias for ready_for_pickup
  completed: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}