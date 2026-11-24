import type { Types } from "mongoose";
import type { MenuCategoryLean, MenuItemLean } from "../models/menu";
import type { OrderLean, OrderStatusHistoryLean } from "../models/order";
import type { SettingsLean } from "../models/settings";
import { isOpenNow } from "../utils/time";

// DTOs = exactly what leaves the API. They rename _id to id and never expose internal fields.
const id = (value: Types.ObjectId) => value.toString();

export const toCategoryDto = (c: MenuCategoryLean) => ({ id: id(c._id), name: c.name, slug: c.slug, sortOrder: c.sortOrder });
export const toAdminCategoryDto = (c: MenuCategoryLean) => ({ ...toCategoryDto(c), active: c.active, createdAt: c.createdAt, updatedAt: c.updatedAt });

export const toMenuItemDto = (i: MenuItemLean) => ({
  id: id(i._id),
  name: i.name,
  description: i.description,
  categoryId: id(i.categoryId),
  priceMinor: i.priceMinor,
  imageUrl: i.imageUrl ?? undefined,
  available: i.available,
  featured: i.featured,
  sortOrder: i.sortOrder,
});
export const toAdminMenuItemDto = (i: MenuItemLean) => ({ ...toMenuItemDto(i), active: i.active, createdAt: i.createdAt, updatedAt: i.updatedAt });

export function isOrderingClosed(s: SettingsLean, now = new Date()): boolean {
  return s.enforceOpeningHours && !isOpenNow(s.openingHours, now, s.timezone);
}

export const toPublicSettingsDto = (s: SettingsLean) => ({
  restaurantName: s.restaurantName,
  contact: { phone: s.contactPhone, address: s.contactAddress, hours: s.hoursText },
  currency: s.currency,
  locale: s.locale,
  ordersPaused: s.ordersPaused,
  orderingClosed: isOrderingClosed(s),
  pickupEnabled: s.pickupEnabled,
  deliveryEnabled: s.deliveryEnabled,
  deliveryFeeMinor: s.deliveryFeeMinor,
  deliveryNote: s.deliveryNote || undefined,
  minimumOrderMinor: s.minimumOrderMinor ?? null,
  estimateText: s.estimateText || undefined,
  maxQuantityPerLine: s.maxQuantityPerLine,
  maxItemsPerOrder: s.maxItemsPerOrder,
  defaultPhoneCountry: s.defaultPhoneCountry,
});

export const toAdminSettingsDto = (s: SettingsLean) => ({
  restaurantName: s.restaurantName,
  contactPhone: s.contactPhone,
  contactAddress: s.contactAddress,
  hoursText: s.hoursText,
  timezone: s.timezone,
  ordersPaused: s.ordersPaused,
  pickupEnabled: s.pickupEnabled,
  deliveryEnabled: s.deliveryEnabled,
  deliveryFeeMinor: s.deliveryFeeMinor,
  deliveryNote: s.deliveryNote,
  minimumOrderMinor: s.minimumOrderMinor ?? null,
  currency: s.currency,
  locale: s.locale,
  estimateText: s.estimateText,
  maxQuantityPerLine: s.maxQuantityPerLine,
  maxItemsPerOrder: s.maxItemsPerOrder,
  defaultPhoneCountry: s.defaultPhoneCountry,
  orderNumberPrefix: s.orderNumberPrefix,
  enforceOpeningHours: s.enforceOpeningHours,
  openingHours: s.openingHours,
});

const orderLines = (o: OrderLean) =>
  o.items.map((line) => ({
    itemId: line.menuItemId ? id(line.menuItemId) : "",
    name: line.nameSnapshot,
    unitPriceMinor: line.unitPriceMinor,
    quantity: line.quantity,
    lineTotalMinor: line.lineTotalMinor,
  }));

/** What the customer sees right after ordering (no phone number or address). */
export const toConfirmationDto = (o: OrderLean) => ({
  orderNumber: o.orderNumber,
  orderType: o.orderType,
  status: o.status === "pending" ? "received" : o.status,
  items: orderLines(o),
  subtotalMinor: o.subtotalMinor,
  deliveryFeeMinor: o.deliveryFeeMinor,
  totalMinor: o.totalMinor,
  currency: o.currency,
  locale: o.locale,
  estimateText: o.estimateText || undefined,
  createdAt: o.createdAt,
});

export const toOrderSummaryDto = (o: OrderLean) => ({
  id: id(o._id),
  orderNumber: o.orderNumber,
  customerName: o.customerName,
  phone: o.phoneE164,
  orderType: o.orderType,
  status: o.status === "pending" ? "received" : o.status,
  totalMinor: o.totalMinor,
  currency: o.currency,
  locale: o.locale,
  itemCount: o.items.reduce((sum, line) => sum + line.quantity, 0),
  items: orderLines(o),
  createdAt: o.createdAt,
});

export const toOrderDetailDto = (o: OrderLean, history: OrderStatusHistoryLean[], adminEmails: Map<string, string>) => ({
  ...toOrderSummaryDto(o),
  address: o.address ?? null,
  note: o.note ?? null,
  items: orderLines(o),
  subtotalMinor: o.subtotalMinor,
  deliveryFeeMinor: o.deliveryFeeMinor,
  cancellationReason: o.cancellationReason ?? null,
  updatedAt: o.updatedAt,
  history: history.map((h) => ({
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    reason: h.reason ?? null,
    changedBy: h.changedByAdminId ? (adminEmails.get(id(h.changedByAdminId)) ?? null) : null,
    createdAt: h.createdAt,
  })),
});