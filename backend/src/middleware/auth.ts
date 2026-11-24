import type { CookieOptions, Request, RequestHandler, Response } from "express";
import { env } from "../config/env";
import { validateSession, type AdminContext } from "../services/auth.service";
import { AppError, asyncHandler } from "../utils/errors";
import { readCookie } from "../utils/security";

export const SESSION_COOKIE = "bh_session";

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true, // JavaScript in the browser can never read it
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: env.SESSION_ABSOLUTE_HOURS * 60 * 60 * 1000,
  };
}

export const readSessionToken = (req: Request) => readCookie(req.headers.cookie, SESSION_COOKIE);

export const clearSessionCookie = (res: Response) => {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, options);
};

/** Protects a route: only a valid, unexpired admin session gets through. */
export const requireAdmin: RequestHandler = asyncHandler(async (req, res, next) => {
  const admin = await validateSession(readSessionToken(req));
  if (!admin) {
    clearSessionCookie(res);
    throw new AppError("UNAUTHENTICATED", "Please sign in.", 401);
  }
  res.locals.admin = admin;
  next();
});

export const currentAdmin = (res: Response) => res.locals.admin as AdminContext;