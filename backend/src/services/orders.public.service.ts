import mongoose, { type ClientSession, type Types } from "mongoose";
import { MenuCategory, MenuItem, type MenuItemLean } from "../models/menu";
import { IdempotencyRecord, Order, OrderCounter, OrderStatusHistory, type OrderLean, type OrderType } from "../models/order";
import type { SettingsLean } from "../models/settings";
import { AppError, isDuplicateKeyError } from "../utils/errors";
import { parsePhone } from "../utils/phone";
import { sha256 } from "../utils/security";
import { localDateString } from "../utils/time";
import { createOrderSchema, isObjectId, parseOrThrow, quoteSchema } from "../validators";
import { isOrderingClosed, toConfirmationDto } from "./dto";
import { buildQuote, type PricingItem, type PricingSettings, type Quote } from "./pricing";
import { getSettings } from "./settings.service";

const MAX_ORDERS_PER_PHONE_PER_HOUR = 3;

export function toPricingSettings(s: SettingsLean, now = new Date()): PricingSettings {
  return {
    currency: s.currency,
    locale: s.locale,
    ordersPaused: s.ordersPaused,
    orderingClosed: isOrderingClosed(s, now),
    pickupEnabled: s.pickupEnabled,
    deliveryEnabled: s.deliveryEnabled,
    deliveryFeeMinor: s.deliveryFeeMinor,
    minimumOrderMinor: s.minimumOrderMinor,
    maxQuantityPerLine: s.maxQuantityPerLine,
    maxItemsPerOrder: s.maxItemsPerOrder,
  };
}

/** Active, in-an-active-category items for the requested ids (optionally inside a transaction). */
async function loadOrderableItems(ids: string[], session?: ClientSession): Promise<PricingItem[]> {
  const validIds = [...new Set(ids.filter(isObjectId))];
  if (validIds.length === 0) return [];
  const categories = await MenuCategory.find({ active: true }, { _id: 1 }).session(session ?? null).lean<{ _id: Types.ObjectId }[]>();
  const items = await MenuItem.find({ _id: { $in: validIds }, active: true, categoryId: { $in: categories.map((c) => c._id) } })
    .session(session ?? null)
    .lean<MenuItemLean[]>();
  return items.map((item) => ({ id: item._id.toString(), name: item.name, priceMinor: item.priceMinor, available: item.available }));
}

// ---------- quote ----------
export async function quoteOrder(body: unknown): Promise<Quote> {
  const input = parseOrThrow(quoteSchema, body);
  const settings = await getSettings();
  const items = await loadOrderableItems(input.items.map((line) => line.itemId));
  return buildQuote(toPricingSettings(settings), items, { lines: input.items, orderType: input.orderType });
}

// ---------- create ----------
function parseIdempotencyKey(value: string | undefined): string {
  if (!value || !/^[A-Za-z0-9_-]{8,100}$/.test(value)) {
    throw new AppError("VALIDATION_FAILED", "A valid Idempotency-Key header is required.", 400, [
      { path: "Idempotency-Key", message: "Send a unique value of 8 to 100 letters, digits, - or _." },
    ]);
  }
  return value;
}

async function replayOrder(key: string, requestHash: string) {
  const record = await IdempotencyRecord.findOne({ key }).lean<{ requestHash: string; orderId: Types.ObjectId }>();
  if (!record) return null;
  if (record.requestHash !== requestHash) {
    throw new AppError("IDEMPOTENCY_CONFLICT", "This request key was already used with different data.", 409);
  }
  const order = await Order.findById(record.orderId).lean<OrderLean>();
  if (!order) throw new AppError("IDEMPOTENCY_CONFLICT", "The original order is no longer available.", 409);
  return { confirmation: toConfirmationDto(order), replay: true as const };
}

async function nextOrderNumber(settings: SettingsLean, dateKey: string, session: ClientSession): Promise<string> {
  const counter = await OrderCounter.findOneAndUpdate({ dateKey }, { $inc: { seq: 1 } }, { returnDocument: "after", session });
  if (!counter) throw new Error("Order counter missing");
  const yymmdd = dateKey.replace(/-/g, "").slice(2);
  return `${settings.orderNumberPrefix}-${yymmdd}-${String(counter.seq).padStart(4, "0")}`;
}

export async function createOrder(body: unknown, idempotencyHeader: string | undefined) {
  const key = parseIdempotencyKey(idempotencyHeader);
  const input = parseOrThrow(createOrderSchema, body);
  const requestHash = sha256(JSON.stringify(input));

  const earlier = await replayOrder(key, requestHash);
  if (earlier) return earlier;

  const settings = await getSettings();

  const phone = parsePhone(input.phone, settings.defaultPhoneCountry);
  if (!phone) throw new AppError("VALIDATION_FAILED", "Some details are not valid.", 422, [{ path: "phone", message: "Enter a valid phone number." }]);
  const orderType: OrderType = input.orderType;
  const address = orderType === "delivery" ? input.address : undefined; // pickup never stores an address
  if (orderType === "delivery" && !address) {
    throw new AppError("VALIDATION_FAILED", "Some details are not valid.", 422, [{ path: "address", message: "Enter a delivery address." }]);
  }

  const recent = await Order.countDocuments({ phoneE164: phone, createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } });
  if (recent >= MAX_ORDERS_PER_PHONE_PER_HOUR) {
    throw new AppError("RATE_LIMITED", "Too many orders from this phone number. Please wait before ordering again.", 429);
  }

  const now = new Date();
  const dateKey = localDateString(now, settings.timezone);
  // Make sure today's counter exists before the transaction (an upsert inside it could race).
  await OrderCounter.updateOne({ dateKey }, { $setOnInsert: { seq: 0 } }, { upsert: true });

  const session = await mongoose.startSession();
  const result: { order?: OrderLean } = {};
  try {
    await session.withTransaction(async () => {
      result.order = undefined; // the callback can run more than once if MongoDB asks for a retry

      // Re-read prices INSIDE the transaction so the total cannot drift while we save.
      const items = await loadOrderableItems(input.items.map((line) => line.itemId), session);
      const quote = buildQuote(toPricingSettings(settings, now), items, { lines: input.items, orderType });

      if (quote.block?.code === "ITEMS_UNAVAILABLE") throw new AppError("MENU_ITEM_UNAVAILABLE", "Some items are no longer available.", 409, quote.conflicts);
      if (quote.block) throw new AppError("ORDERING_UNAVAILABLE", "Ordering is not available right now.", 409, quote.block);
      if (quote.totalMinor !== input.expectedTotalMinor) {
        throw new AppError("MENU_PRICE_CHANGED", "Prices changed while you were ordering.", 409, {
          expectedTotalMinor: input.expectedTotalMinor,
          currentTotalMinor: quote.totalMinor,
        });
      }

      const orderNumber = await nextOrderNumber(settings, dateKey, session);
      const [created] = await Order.create(
        [
          {
            orderNumber,
            customerName: input.customerName,
            phoneE164: phone,
            orderType,
            address,
            note: input.note || undefined,
            items: quote.lines.map((line) => ({
              menuItemId: line.itemId,
              nameSnapshot: line.name,
              unitPriceMinor: line.unitPriceMinor,
              quantity: line.quantity,
              lineTotalMinor: line.lineTotalMinor,
            })),
            subtotalMinor: quote.subtotalMinor,
            deliveryFeeMinor: quote.deliveryFeeMinor,
            totalMinor: quote.totalMinor,
            currency: quote.currency,
            locale: quote.locale,
            estimateText: settings.estimateText || undefined,
            status: "received",
            idempotencyKey: key,
          },
        ],
        { session },
      );
      await OrderStatusHistory.create([{ orderId: created._id, fromStatus: null, toStatus: "received" }], { session });
      await IdempotencyRecord.create([{ key, requestHash, orderId: created._id }], { session });
      result.order = created.toObject() as unknown as OrderLean;
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      // Two identical requests raced: the other one won, so return its order.
      const raced = await replayOrder(key, requestHash);
      if (raced) return raced;
    }
    throw error;
  } finally {
    await session.endSession();
  }

  if (!result.order) throw new Error("Order was not created");
  return { confirmation: toConfirmationDto(result.order), replay: false as const };
}

// ---------- customer tracking ----------
export async function trackOrder(orderNumber: string) {
  const cleanNumber = orderNumber.trim().toUpperCase();
  const order = await Order.findOne({ orderNumber: cleanNumber }).lean<OrderLean>();
  if (!order) {
    throw new AppError("NOT_FOUND", "Order not found.", 404);
  }
  return {
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    status: order.status === "pending" ? "received" : (order.status === "ready" ? "ready_for_pickup" : order.status),
    estimateText: order.estimateText,
    totalMinor: order.totalMinor,
    currency: order.currency,
    locale: order.locale,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}