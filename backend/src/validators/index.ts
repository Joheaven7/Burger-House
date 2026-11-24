import { z } from "zod";
import { allowedImageHosts } from "../config/env";
import { ORDER_STATUSES, ORDER_TYPES } from "../models/order";
import { AppError } from "../utils/errors";
import { isCountrySupported } from "../utils/phone";
import { isValidTimeZone } from "../utils/time";

/** Parses input with a schema; on failure throws a 422 VALIDATION_FAILED error with per-field details. */
export function parseOrThrow<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    throw new AppError("VALIDATION_FAILED", "Some details are not valid.", 422, details);
  }
  return result.data;
}

function hasControlChars(value: string, allowNewlines: boolean): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const control = code < 32 || code === 127;
    if (control && !(allowNewlines && (code === 9 || code === 10 || code === 13))) return true;
  }
  return false;
}

const singleLine = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} must be ${max} characters or fewer.`)
    .refine((v) => !hasControlChars(v, false), "Remove unsupported characters.");
const multiLine = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`)
    .refine((v) => !hasControlChars(v, true), "Remove unsupported characters.");

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id.");
export const isObjectId = (value: string) => /^[a-f\d]{24}$/i.test(value);
const minorUnits = z.number().int().min(0).max(1_000_000_000);

// ---------- public ----------
const cartLine = z.object({ itemId: z.string().min(1).max(64), quantity: z.number().finite() }).strict();

export const quoteSchema = z
  .object({ items: z.array(cartLine).max(100), orderType: z.enum(ORDER_TYPES).optional() })
  .strict();

export const createOrderSchema = z
  .object({
    items: z.array(cartLine).min(1, "Your cart is empty.").max(100),
    orderType: z.enum(ORDER_TYPES),
    customerName: singleLine(80, "Name"),
    phone: z.string().trim().min(1, "Phone number is required.").max(32),
    address: multiLine(250, "Address").optional(),
    note: multiLine(300, "Note").optional(),
    expectedTotalMinor: minorUnits,
  })
  .strict();
export type CreateOrderInput = z.output<typeof createOrderSchema>;

export const menuQuerySchema = z.object({
  category: z.string().trim().optional(),
  featured: z.enum(["true", "false"]).optional(),
});

// ---------- auth ----------
export const loginSchema = z
  .object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(200) })
  .strict();

// ---------- admin: orders ----------
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD.");
export const orderListQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  from: dateString.optional(),
  to: dateString.optional(),
  q: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["newest", "oldest", "total_desc", "total_asc"]).default("newest"),
});

export const statusChangeSchema = z
  .object({
    expectedStatus: z.enum(ORDER_STATUSES),
    newStatus: z.enum(ORDER_STATUSES),
    reason: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

// ---------- admin: menu ----------
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    try {
      const url = new URL(value);
      const defaultHosts = ["images.unsplash.com", "images.pexels.com", "plus.unsplash.com"];
      const hosts = allowedImageHosts.length > 0 ? allowedImageHosts : defaultHosts;
      return url.protocol === "https:" && hosts.some((h) => url.hostname.toLowerCase() === h || url.hostname.toLowerCase().endsWith(`.${h}`));
    } catch {
      return false;
    }
  }, "Image address must be an https link from an allowed image host.");

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.").max(60);
const sortOrder = z.number().int().min(-10_000).max(10_000);

export const menuItemCreateSchema = z
  .object({
    name: singleLine(80, "Name"),
    description: multiLine(300, "Description").optional(),
    categoryId: objectIdSchema,
    priceMinor: minorUnits,
    imageUrl: imageUrl.optional(),
    active: z.boolean().optional(),
    available: z.boolean().optional(),
    featured: z.boolean().optional(),
    sortOrder: sortOrder.optional(),
  })
  .strict();

// Update: every field optional, and no defaults are applied (so a PATCH never overwrites by accident).
export const menuItemUpdateSchema = z
  .object({
    name: singleLine(80, "Name").optional(),
    description: multiLine(300, "Description").optional(),
    categoryId: objectIdSchema.optional(),
    priceMinor: minorUnits.optional(),
    imageUrl: imageUrl.nullable().optional(),
    active: z.boolean().optional(),
    available: z.boolean().optional(),
    featured: z.boolean().optional(),
    sortOrder: sortOrder.optional(),
  })
  .strict();

export const adminMenuQuerySchema = z.object({
  category: objectIdSchema.optional(),
  active: z.enum(["true", "false"]).optional(),
  q: z.string().trim().max(60).optional(),
});

export const categoryCreateSchema = z
  .object({ name: singleLine(60, "Name"), slug: slug.optional(), sortOrder: sortOrder.optional(), active: z.boolean().optional() })
  .strict();
export const categoryUpdateSchema = z
  .object({ name: singleLine(60, "Name").optional(), slug: slug.optional(), sortOrder: sortOrder.optional(), active: z.boolean().optional() })
  .strict();

// ---------- admin: settings ----------
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour).");
const openingHour = z
  .object({ day: z.number().int().min(0).max(6), open: time, close: time })
  .strict()
  .refine((h) => h.open !== h.close, "Opening and closing time must differ.");

export const settingsUpdateSchema = z
  .object({
    restaurantName: singleLine(80, "Name").optional(),
    contactPhone: multiLine(40, "Phone").optional(),
    contactAddress: multiLine(200, "Address").optional(),
    hoursText: multiLine(200, "Hours").optional(),
    timezone: z.string().refine(isValidTimeZone, "Unknown timezone.").optional(),
    ordersPaused: z.boolean().optional(),
    pickupEnabled: z.boolean().optional(),
    deliveryEnabled: z.boolean().optional(),
    deliveryFeeMinor: minorUnits.optional(),
    deliveryNote: multiLine(300, "Delivery note").optional(),
    minimumOrderMinor: minorUnits.nullable().optional(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code, for example ETB.")
      .refine((code) => Intl.supportedValuesOf("currency").includes(code), "Unknown currency code.")
      .optional(),
    locale: z.string().refine((l) => { try { return Intl.getCanonicalLocales(l).length === 1; } catch { return false; } }, "Unknown locale.").optional(),
    estimateText: multiLine(200, "Estimate text").optional(),
    maxQuantityPerLine: z.number().int().min(1).max(50).optional(),
    maxItemsPerOrder: z.number().int().min(1).max(200).optional(),
    defaultPhoneCountry: z.string().regex(/^[A-Z]{2}$/).refine(isCountrySupported, "Unknown country code.").optional(),
    orderNumberPrefix: z.string().regex(/^[A-Z0-9]{1,6}$/, "Use 1 to 6 capital letters or digits.").optional(),
    enforceOpeningHours: z.boolean().optional(),
    openingHours: z.array(openingHour).max(28).optional(),
  })
  .strict();