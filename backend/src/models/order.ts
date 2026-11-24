import { Schema, model, type Types } from "mongoose";

export const ORDER_STATUSES = ["received", "preparing", "ready_for_pickup", "ready", "completed", "cancelled", "pending"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_TYPES = ["pickup", "delivery"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export interface OrderItemDoc {
  menuItemId?: Types.ObjectId;
  nameSnapshot: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface OrderDoc {
  orderNumber: string;
  customerName: string;
  phoneE164: string;
  orderType: OrderType;
  address?: string;
  note?: string;
  items: OrderItemDoc[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  currency: string;
  locale: string;
  estimateText?: string;
  status: OrderStatus;
  cancellationReason?: string;
  idempotencyKey: string;
}
export type OrderLean = OrderDoc & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

// Order lines are immutable snapshots: later menu edits never change an old order.
const orderItemSchema = new Schema<OrderItemDoc>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    nameSnapshot: { type: String, required: true },
    unitPriceMinor: { type: Number, required: true },
    quantity: { type: Number, required: true },
    lineTotalMinor: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDoc>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phoneE164: { type: String, required: true },
    orderType: { type: String, enum: ORDER_TYPES, required: true },
    address: { type: String },
    note: { type: String },
    items: { type: [orderItemSchema], required: true },
    subtotalMinor: { type: Number, required: true },
    deliveryFeeMinor: { type: Number, required: true },
    totalMinor: { type: Number, required: true },
    currency: { type: String, required: true },
    locale: { type: String, required: true },
    estimateText: { type: String },
    status: { type: String, enum: ORDER_STATUSES, default: "received" },
    cancellationReason: { type: String },
    idempotencyKey: { type: String, required: true },
  },
  { timestamps: true },
);
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ phoneE164: 1, createdAt: -1 });
orderSchema.index({ "items.menuItemId": 1 });
export const Order = model<OrderDoc>("Order", orderSchema);

export interface OrderStatusHistoryDoc {
  orderId: Types.ObjectId;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByAdminId?: Types.ObjectId;
  reason?: string;
}
export type OrderStatusHistoryLean = OrderStatusHistoryDoc & { _id: Types.ObjectId; createdAt: Date };

const historySchema = new Schema<OrderStatusHistoryDoc>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    fromStatus: { type: String, enum: [...ORDER_STATUSES, null], default: null },
    toStatus: { type: String, enum: ORDER_STATUSES, required: true },
    changedByAdminId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const OrderStatusHistory = model<OrderStatusHistoryDoc>("OrderStatusHistory", historySchema);

/** One counter per restaurant-local day, incremented atomically to build order numbers. */
export interface OrderCounterDoc {
  dateKey: string;
  seq: number;
}
const counterSchema = new Schema<OrderCounterDoc>({
  dateKey: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});
export const OrderCounter = model<OrderCounterDoc>("OrderCounter", counterSchema);

/** Remembers which order an Idempotency-Key created, for 24 hours. */
export interface IdempotencyRecordDoc {
  key: string;
  requestHash: string;
  orderId: Types.ObjectId;
  createdAt: Date;
}
const idempotencySchema = new Schema<IdempotencyRecordDoc>({
  key: { type: String, required: true, unique: true },
  requestHash: { type: String, required: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  createdAt: { type: Date, default: Date.now },
});
idempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });
export const IdempotencyRecord = model<IdempotencyRecordDoc>("IdempotencyRecord", idempotencySchema);