import { Schema, model, type Types } from "mongoose";

export interface AdminUserDoc {
  email: string;
  passwordHash: string;
  active: boolean;
  failedLoginCount: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;
}
export type AdminUserLean = AdminUserDoc & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

const adminUserSchema = new Schema<AdminUserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true },
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);
export const AdminUser = model<AdminUserDoc>("AdminUser", adminUserSchema);

export interface AdminSessionDoc {
  tokenHash: string; // hash of the cookie value; the real token is never stored
  adminId: Types.ObjectId;
  lastSeenAt: Date;
  expiresAt: Date; // absolute limit; MongoDB deletes the document after this time
}
export type AdminSessionLean = AdminSessionDoc & { _id: Types.ObjectId; createdAt: Date };

const sessionSchema = new Schema<AdminSessionDoc>(
  {
    tokenHash: { type: String, required: true, unique: true },
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true, index: true },
    lastSeenAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AdminSession = model<AdminSessionDoc>("AdminSession", sessionSchema);

export interface AuditLogDoc {
  actorId?: Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>; // safe values only: never credentials, phone numbers or addresses
}
const auditSchema = new Schema<AuditLogDoc>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
auditSchema.index({ createdAt: -1 });
export const AuditLog = model<AuditLogDoc>("AuditLog", auditSchema);