import type { OrderStatus } from "@/types/admin";

/** The buttons the UI offers. The server enforces the same rules, so this is only a convenience. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  received: ["preparing", "cancelled"],
  pending: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["completed", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};