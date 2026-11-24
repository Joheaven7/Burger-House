import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFound, requestId, requestLogger } from "./middleware/core";
import { rejectOperatorKeys } from "./middleware/security";
import { apiRouter } from "./routes";

const allowedOrigin = new URL(env.FRONTEND_ORIGIN).origin;

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY); // set TRUST_PROXY by measurement; see docs/DEPLOYMENT.md

  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      // Exact origin only (SEC-04). Other websites get no CORS headers, so browsers block them.
      // Requests without an Origin header (the Next.js server, curl) are not browser cross-site requests.
      origin: (origin, callback) => callback(null, !origin || origin === allowedOrigin),
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Idempotency-Key", "X-Requested-With"],
      exposedHeaders: ["X-Request-Id", "Retry-After"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "20kb" }));
  app.use(rejectOperatorKeys);

  // Nothing from the API may be cached by browsers, proxies or the CDN (prices, availability and admin data change constantly).
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use("/api", apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}