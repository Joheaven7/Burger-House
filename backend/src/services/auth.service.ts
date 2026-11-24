import type { Types } from "mongoose";
import { env } from "../config/env";
import { AdminSession, AdminUser, type AdminUserLean } from "../models/admin";
import { AppError } from "../utils/errors";
import { generateSessionToken, getDummyHash, hashPassword, hashSessionToken, verifyPassword } from "../utils/security";
import { recordAudit } from "./audit.service";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const minutes = (n: number) => n * 60 * 1000;

export interface AdminContext {
  id: string;
  email: string;
}

// One message for every failure so attackers learn nothing about which emails exist (SEC-06).
const invalidLogin = () => new AppError("UNAUTHENTICATED", "Email or password is incorrect, or the account is temporarily locked.", 401);

export async function login(email: string, password: string): Promise<{ token: string; admin: AdminContext }> {
  const now = new Date();
  const admin = await AdminUser.findOne({ email }).lean<AdminUserLean>();
  const locked = Boolean(admin?.lockedUntil && admin.lockedUntil > now);

  if (!admin || !admin.active || locked) {
    await verifyPassword(password, await getDummyHash()); // same time cost as a real check
    throw invalidLogin();
  }

  if (!(await verifyPassword(password, admin.passwordHash))) {
    const after = await AdminUser.findOneAndUpdate({ _id: admin._id }, { $inc: { failedLoginCount: 1 } }, { returnDocument: "after" }).lean<AdminUserLean>();
    if (after && after.failedLoginCount >= MAX_FAILED_LOGINS) {
      await AdminUser.updateOne({ _id: admin._id }, { $set: { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + minutes(LOCK_MINUTES)) } });
      await recordAudit({ actorId: admin._id, action: "auth.account_locked", resourceType: "admin" });
    }
    await recordAudit({ actorId: admin._id, action: "auth.login_failed", resourceType: "admin" });
    throw invalidLogin();
  }

  await AdminUser.updateOne({ _id: admin._id }, { $set: { failedLoginCount: 0, lastLoginAt: now }, $unset: { lockedUntil: 1 } });

  // A brand-new token for every login (session id regeneration).
  const token = generateSessionToken();
  await AdminSession.create({
    tokenHash: hashSessionToken(token),
    adminId: admin._id,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + env.SESSION_ABSOLUTE_HOURS * 60 * minutes(1)),
  });
  await recordAudit({ actorId: admin._id, action: "auth.login", resourceType: "admin" });
  return { token, admin: { id: admin._id.toString(), email: admin.email } };
}

export async function logout(token: string | null): Promise<void> {
  if (token) await AdminSession.deleteOne({ tokenHash: hashSessionToken(token) });
}

/** Returns the signed-in admin for a session cookie value, or null if it is missing, expired or revoked. */
export async function validateSession(token: string | null): Promise<AdminContext | null> {
  if (!token) return null;
  const now = new Date();
  const tokenHash = hashSessionToken(token);
  const session = await AdminSession.findOne({ tokenHash }).lean<{ _id: Types.ObjectId; adminId: Types.ObjectId; lastSeenAt: Date; expiresAt: Date }>();
  if (!session) return null;

  const idleLimit = new Date(now.getTime() - minutes(env.SESSION_IDLE_MINUTES));
  if (session.expiresAt <= now || session.lastSeenAt < idleLimit) {
    await AdminSession.deleteOne({ _id: session._id });
    return null;
  }

  const admin = await AdminUser.findById(session.adminId).lean<AdminUserLean>();
  if (!admin || !admin.active) {
    await AdminSession.deleteOne({ _id: session._id });
    return null;
  }

  if (now.getTime() - session.lastSeenAt.getTime() > minutes(1)) {
    await AdminSession.updateOne({ _id: session._id }, { $set: { lastSeenAt: now } });
  }
  return { id: admin._id.toString(), email: admin.email };
}

/** Used by the bootstrap script: creates the admin, or resets the password if the email already exists. */
export async function upsertAdmin(email: string, password: string): Promise<"created" | "password_reset"> {
  const passwordHash = await hashPassword(password);
  const existing = await AdminUser.findOne({ email }, { _id: 1 }).lean<{ _id: Types.ObjectId }>();
  if (existing) {
    await AdminUser.updateOne({ _id: existing._id }, { $set: { passwordHash, active: true, failedLoginCount: 0 }, $unset: { lockedUntil: 1 } });
    await AdminSession.deleteMany({ adminId: existing._id }); // old sessions stop working
    return "password_reset";
  }
  await AdminUser.create({ email, passwordHash });
  return "created";
}