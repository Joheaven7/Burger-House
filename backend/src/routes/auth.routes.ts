import { Router } from "express";
import { clearSessionCookie, currentAdmin, readSessionToken, requireAdmin, SESSION_COOKIE, sessionCookieOptions } from "../middleware/auth";
import { csrfProtect, loginLimiter } from "../middleware/security";
import { login, logout } from "../services/auth.service";
import { asyncHandler } from "../utils/errors";
import { loginSchema, parseOrThrow } from "../validators";

export const authRouter = Router();
authRouter.use(csrfProtect);

authRouter.post("/login", loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = parseOrThrow(loginSchema, req.body);
  await logout(readSessionToken(req)); // drop any older session on this browser
  const { token, admin } = await login(email, password);
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  res.json({ data: { admin } });
}));

authRouter.post("/logout", asyncHandler(async (req, res) => {
  await logout(readSessionToken(req));
  clearSessionCookie(res);
  res.json({ data: { ok: true } });
}));

authRouter.get("/me", requireAdmin, (_req, res) => {
  res.json({ data: { admin: currentAdmin(res) } });
});