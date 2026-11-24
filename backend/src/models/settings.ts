import { Schema, model, type Types } from "mongoose";
import type { OpeningHour } from "../utils/time";

export interface SettingsDoc {
  key: string; // always "main": there is exactly one settings document
  restaurantName: string;
  contactPhone: string;
  contactAddress: string;
  hoursText: string; // text shown to customers, for example "Mon-Sun 10:00-22:00"
  timezone: string; // IANA name
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
export type SettingsLean = SettingsDoc & { _id: Types.ObjectId };

const openingHourSchema = new Schema<OpeningHour>(
  { day: { type: Number, required: true, min: 0, max: 6 }, open: { type: String, required: true }, close: { type: String, required: true } },
  { _id: false },
);

// Defaults are conservative placeholders until the owner confirms the real values (decisions D-01 to D-09).
const settingsSchema = new Schema<SettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    restaurantName: { type: String, default: "Burger House" },
    contactPhone: { type: String, default: "" },
    contactAddress: { type: String, default: "" },
    hoursText: { type: String, default: "" },
    timezone: { type: String, default: "Africa/Addis_Ababa" },
    ordersPaused: { type: Boolean, default: false },
    pickupEnabled: { type: Boolean, default: true },
    deliveryEnabled: { type: Boolean, default: false },
    deliveryFeeMinor: { type: Number, default: 0, min: 0 },
    deliveryNote: { type: String, default: "" },
    minimumOrderMinor: { type: Number, default: null, min: 0 },
    currency: { type: String, default: "ETB" },
    locale: { type: String, default: "en" },
    estimateText: { type: String, default: "" },
    maxQuantityPerLine: { type: Number, default: 10 },
    maxItemsPerOrder: { type: Number, default: 30 },
    defaultPhoneCountry: { type: String, default: "ET" },
    orderNumberPrefix: { type: String, default: "BH" },
    enforceOpeningHours: { type: Boolean, default: false },
    openingHours: { type: [openingHourSchema], default: [] },
  },
  { timestamps: true },
);

export const SettingsModel = model<SettingsDoc>("Settings", settingsSchema);