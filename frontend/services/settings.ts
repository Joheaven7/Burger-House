import { cache } from "react";
import { apiRequest } from "@/lib/api-client";

export interface PublicSettings {
  restaurantName: string;
  contact: { phone: string; address: string; hours: string };
  currency: string; // ISO code, e.g. "ETB"
  locale: string; // number format, e.g. "en"
  ordersPaused: boolean; // true = customers can browse but not order
  orderingClosed: boolean; // true = outside opening hours (when hours are enforced)
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFeeMinor: number; // integer minor units
  deliveryNote?: string;
  minimumOrderMinor: number | null; // null = no minimum
  estimateText?: string;
  maxQuantityPerLine: number;
  maxItemsPerOrder: number;
  defaultPhoneCountry: string; // ISO country used to read phone numbers
}

// React's cache() makes the layout and the page share one request per page view.
export const getPublicSettings = cache(() => apiRequest<PublicSettings>("/settings/public"));