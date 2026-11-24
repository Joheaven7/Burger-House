import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

// ---------- rate limits (SEC-08). Starting values: tune after launch. ----------
/** True when the request carries the shared INTERNAL_API_KEY (sent only by our own Next.js server, never by browsers). */
export function hasInternalKey(req: Request): boolean {
  const expected = env.INTERNAL_API_KEY;
  const given = req.get("x-internal-key");
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

function limiter(
  windowMs: number,
  limit: number,
  options: { skipSuccessfulRequests?: boolean; skip?: (req: Request) => boolean } = {},
): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    skip: (req) => env.NODE_ENV === "test" || (options.skip?.(req) ?? false),
    handler: (_req, res, next) => {
      res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
      next(new AppError("RATE_LIMITED", "Too many requests. Please wait a moment and try again.", 429));
    },
  });
}

export const loginLimiter = limiter(15 * 60 * 1000, 5, { skipSuccessfulRequests: true });
export const orderCreateLimiter = limiter(10 * 60 * 1000, 5);
export const quoteLimiter = limiter(60 * 1000, 30);
// Page loads made by our own Next.js server all come from a few Vercel addresses, so they skip this per-IP limit.
export const publicReadLimiter = limiter(60 * 1000, 120, { skip: hasInternalKey });

// ---------- NoSQL operator injection guard ----------
function hasOperatorKey(value: unknown, depth = 0): boolean {
  if (depth > 10 || value === null || typeof value !== "object") return false;
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith("$") || key.includes(".") || hasOperatorKey(inner, depth + 1)) return true;
  }
  return false;
}

export const rejectOperatorKeys: RequestHandler = (req, _res, next) => {
  if (hasOperatorKey(req.body)) return next(new AppError("VALIDATION_FAILED", "The request contains unsupported keys.", 400));
  next();
};

// ---------- CSRF defence for cookie-authenticated requests (SEC-04) ----------
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * For every state-changing request: (1) the Origin (or Referer) must be our frontend, and
 * (2) the custom header X-Requested-With must be present, which a cross-site form cannot send.
 */
export function csrfProtect(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get("origin");
  let requestOrigin: string | null = origin ?? null;
  if (!requestOrigin) {
    const referer = req.get("referer");
    try {
      requestOrigin = referer ? new URL(referer).origin : null;
    } catch {
      requestOrigin = null;
    }
  }
  if (requestOrigin !== new URL(env.FRONTEND_ORIGIN).origin) {
    return next(new AppError("FORBIDDEN", "This request came from an unexpected address.", 403));
  }
  if (!req.get("x-requested-with")) {
    return next(new AppError("FORBIDDEN", "Missing required header.", 403));
  }
  next();
}