import type { Types } from "mongoose";
import { AuditLog } from "../models/admin";
import { logger } from "../utils/logger";

interface AuditEntry {
  actorId?: Types.ObjectId | string;
  action: string; // for example "order.status_changed"
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>; // safe values only
}

/** Best effort: an audit failure is logged but never breaks the request that triggered it. */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create(entry);
  } catch (error) {
    logger.error("audit log write failed", { action: entry.action, error: error instanceof Error ? error.name : "unknown" });
  }
}