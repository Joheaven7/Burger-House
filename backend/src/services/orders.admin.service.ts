import mongoose, { type Types } from "mongoose";
import { AdminUser } from "../models/admin";
import { Order, OrderStatusHistory, ORDER_STATUSES, type OrderLean, type OrderStatus, type OrderStatusHistoryLean } from "../models/order";
import { AppError } from "../utils/errors";
import { localDateString, localDayRange } from "../utils/time";
import { isObjectId } from "../validators";
import { recordAudit } from "./audit.service";
import { toOrderDetailDto, toOrderSummaryDto } from "./dto";
import { canTransition } from "./orderStatus";
import { getSettings } from "./settings.service";

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SORTS = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, total_desc: { totalMinor: -1, createdAt: -1 }, total_asc: { totalMinor: 1, createdAt: -1 } } as const;

export interface OrderListQuery {
  status?: OrderStatus;
  from?: string;
  to?: string;
  q?: string;
  page: number;
  pageSize: number;
  sort: keyof typeof SORTS;
}

export async function listOrders(query: OrderListQuery) {
  const settings = await getSettings();
  const filter: Record<string, unknown> = {};
  if (query.status) {
    if (query.status === "received" || query.status === "pending") {
      filter.status = { $in: ["received", "pending"] };
    } else if (query.status === "ready_for_pickup" || query.status === "ready") {
      filter.status = { $in: ["ready_for_pickup", "ready"] };
    } else {
      filter.status = query.status;
    }
  }

  if (query.from || query.to) {
    const range: Record<string, Date> = {};
    if (query.from) range.$gte = localDayRange(query.from, settings.timezone).start;
    if (query.to) range.$lt = localDayRange(query.to, settings.timezone).end;
    filter.createdAt = range;
  }
  if (query.q) {
    const text = query.q.trim();
    filter.$or = [
      { orderNumber: { $regex: `^${escapeRegex(text)}`, $options: "i" } },
      { customerName: { $regex: escapeRegex(text), $options: "i" } },
      { phoneE164: { $regex: escapeRegex(text.replace(/[\s()-]/g, "")) } },
    ];
  }

  const [total, rows] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort(SORTS[query.sort]).skip((query.page - 1) * query.pageSize).limit(query.pageSize).lean<OrderLean[]>(),
  ]);
  return { data: rows.map(toOrderSummaryDto), pagination: { page: query.page, pageSize: query.pageSize, total } };
}

export async function getOrderDetail(id: string) {
  if (!isObjectId(id)) throw new AppError("NOT_FOUND", "Order not found.", 404);
  const order = await Order.findById(id).lean<OrderLean>();
  if (!order) throw new AppError("NOT_FOUND", "Order not found.", 404);

  const history = await OrderStatusHistory.find({ orderId: order._id }).sort({ createdAt: 1 }).lean<OrderStatusHistoryLean[]>();
  const adminIds = [...new Set(history.flatMap((h) => (h.changedByAdminId ? [h.changedByAdminId.toString()] : [])))];
  const admins = adminIds.length ? await AdminUser.find({ _id: { $in: adminIds } }, { email: 1 }).lean<{ _id: Types.ObjectId; email: string }[]>() : [];
  return toOrderDetailDto(order, history, new Map(admins.map((a) => [a._id.toString(), a.email])));
}

export async function changeOrderStatus(
  id: string,
  input: { expectedStatus: OrderStatus; newStatus: OrderStatus; reason?: string },
  adminId: string,
) {
  if (!isObjectId(id)) throw new AppError("NOT_FOUND", "Order not found.", 404);
  const { expectedStatus, newStatus, reason } = input;

  if (!canTransition(expectedStatus, newStatus)) {
    throw new AppError("INVALID_STATUS_TRANSITION", `An order cannot move from ${expectedStatus} to ${newStatus}.`, 409);
  }
  if (newStatus === "cancelled" && !reason) {
    throw new AppError("VALIDATION_FAILED", "Some details are not valid.", 422, [{ path: "reason", message: "A reason is required to cancel an order." }]);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Compare-and-set: only succeeds if the status is STILL what the admin saw (ORD-03).
      const updated = await Order.findOneAndUpdate(
        { _id: id, status: expectedStatus },
        { $set: { status: newStatus, ...(newStatus === "cancelled" ? { cancellationReason: reason } : {}) } },
        { returnDocument: "after", session },
      );
      if (!updated) {
        const exists = await Order.exists({ _id: id }).session(session);
        if (!exists) throw new AppError("NOT_FOUND", "Order not found.", 404);
        throw new AppError("INVALID_STATUS_TRANSITION", "This order was changed by someone else. Refresh and try again.", 409);
      }
      await OrderStatusHistory.create(
        [{ orderId: id, fromStatus: expectedStatus, toStatus: newStatus, changedByAdminId: adminId, reason }],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  await recordAudit({ actorId: adminId, action: "order.status_changed", resourceType: "order", resourceId: id, metadata: { from: expectedStatus, to: newStatus } });
  return getOrderDetail(id);
}

/** Dashboard numbers. "Today" is the restaurant-local calendar day; revenue excludes cancelled orders. */
export async function getStats() {
  const settings = await getSettings();
  const { start, end } = localDayRange(localDateString(new Date(), settings.timezone), settings.timezone);

  const [today, pendingNow, allTimeCounts] = await Promise.all([
    Order.aggregate<{ _id: OrderStatus; count: number; revenue: number }>([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$totalMinor" } } },
    ]),
    Order.countDocuments({ status: { $in: ["received", "pending"] } }),
    Order.aggregate<{ _id: OrderStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  let ordersToday = 0;
  let revenueMinor = 0;
  for (const row of today) {
    byStatus[row._id] = row.count;
    ordersToday += row.count;
    if (row._id !== "cancelled") revenueMinor += row.revenue;
  }

  // Combined totals across all time for high-level statistics
  const allTimeByStatus: Record<string, number> = {
    received: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
  };
  let totalOrdersAllTime = 0;
  for (const row of allTimeCounts) {
    totalOrdersAllTime += row.count;
    if (row._id === "pending" || row._id === "received") {
      allTimeByStatus.received += row.count;
    } else if (row._id === "ready_for_pickup" || row._id === "ready") {
      allTimeByStatus.ready += row.count;
    } else if (allTimeByStatus[row._id] !== undefined) {
      allTimeByStatus[row._id] += row.count;
    }
  }

  return {
    ordersToday,
    byStatus,
    pendingNow,
    revenueMinor,
    totalOrdersAllTime,
    allTimeByStatus,
    currency: settings.currency,
    locale: settings.locale,
    timezone: settings.timezone,
  };
}