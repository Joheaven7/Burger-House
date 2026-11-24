import type { OrderType } from "@/types/order";

export type OrderStatus = "received" | "preparing" | "ready_for_pickup" | "ready" | "completed" | "cancelled" | "pending";

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminUser {
  id: string;
  email: string;
}

export interface AdminStats {
  ordersToday: number;
  byStatus: Record<string, number>;
  pendingNow: number;
  revenueMinor: number;
  totalOrdersAllTime?: number;
  allTimeByStatus?: Record<string, number>;
  currency: string;
  locale: string;
  timezone: string;
}

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  orderType: OrderType;
  status: OrderStatus;
  totalMinor: number;
  currency: string;
  locale: string;
  itemCount: number;
  items?: AdminOrderItem[];
  createdAt: string;
}

export interface AdminOrderItem {
  itemId: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface StatusHistoryEntry {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason: string | null;
  changedBy: string | null;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  address: string | null;
  note: string | null;
  items: AdminOrderItem[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  cancellationReason: string | null;
  updatedAt: string;
  history: StatusHistoryEntry[];
}

export interface AdminMenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  priceMinor: number;
  imageUrl?: string;
  available: boolean;
  featured: boolean;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
}

export interface OpeningHour {
  day: number; // 0 = Sunday ... 6 = Saturday
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export interface AdminSettings {
  restaurantName: string;
  contactPhone: string;
  contactAddress: string;
  hoursText: string;
  timezone: string;
  ordersPaused: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFeeMinor: number;
  deliveryNote: string;
  minimumOrderMinor: number | null;
  currency: string;
  locale: string;
  estimateText: string;
  maxQuantityPerLine: number;
  maxItemsPerOrder: number;
  defaultPhoneCountry: string;
  orderNumberPrefix: string;
  enforceOpeningHours: boolean;
  openingHours: OpeningHour[];
}