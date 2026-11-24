import { Router } from "express";
import { csrfProtect, orderCreateLimiter, quoteLimiter } from "../middleware/security";
import { currentAdmin, requireAdmin } from "../middleware/auth";
import { changeOrderStatus, getOrderDetail, listOrders } from "../services/orders.admin.service";
import { createOrder, quoteOrder, trackOrder } from "../services/orders.public.service";
import { asyncHandler } from "../utils/errors";
import { orderListQuerySchema, parseOrThrow, statusChangeSchema } from "../validators";

export const ordersRouter = Router();

// ----- public (no cookies involved) -----
ordersRouter.post("/quote", quoteLimiter, asyncHandler(async (req, res) => {
  res.json({ data: await quoteOrder(req.body) });
}));

ordersRouter.post("/", orderCreateLimiter, asyncHandler(async (req, res) => {
  const { confirmation, replay } = await createOrder(req.body, req.get("idempotency-key"));
  res.status(replay ? 200 : 201).json({ data: confirmation });
}));

ordersRouter.get("/track/:orderNumber", asyncHandler(async (req, res) => {
  res.json({ data: await trackOrder(String(req.params.orderNumber)) });
}));

// ----- admin -----
ordersRouter.get("/", requireAdmin, asyncHandler(async (req, res) => {
  const result = await listOrders(parseOrThrow(orderListQuerySchema, req.query));
  res.json(result);
}));

ordersRouter.get("/:id", requireAdmin, asyncHandler(async (req, res) => {
  res.json({ data: await getOrderDetail(String(req.params.id)) });
}));

ordersRouter.patch("/:id/status", csrfProtect, requireAdmin, asyncHandler(async (req, res) => {
  const input = parseOrThrow(statusChangeSchema, req.body);
  res.json({ data: await changeOrderStatus(String(req.params.id), input, currentAdmin(res).id) });
}));