import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "must be at least 32 characters"),
  FRONTEND_ORIGIN: z.string().url(),
  COOKIE_DOMAIN: z.string().optional(),
  ALLOWED_IMAGE_HOSTS: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Optional shared secret: lets the Next.js server (Vercel) read public data without sharing the visitors' rate limit.
  INTERNAL_API_KEY: z
    .union([z.string().min(32, "must be at least 32 characters"), z.literal("")])
    .optional()
    .transform((value) => value || undefined),
  SESSION_IDLE_MINUTES: z.coerce.number().int().positive().default(120),
  SESSION_ABSOLUTE_HOURS: z.coerce.number().int().positive().default(12),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(` - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const allowedImageHosts: string[] = (env.ALLOWED_IMAGE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);