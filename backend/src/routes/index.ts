import { Router } from "express";
import mongoose from "mongoose";
import { adminRouter } from "./admin.routes";
import { authRouter } from "./auth.routes";
import { ordersRouter } from "./orders.routes";
import { publicRouter } from "./public.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  const databaseUp = mongoose.connection.readyState === 1;
  res.status(databaseUp ? 200 : 503).json({ data: { status: databaseUp ? "ok" : "degraded", database: databaseUp ? "up" : "down" } });
});

apiRouter.use(publicRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);