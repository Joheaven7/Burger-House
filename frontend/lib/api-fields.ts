import { ApiError } from "@/lib/api-error";

/** Turns the server's validation details ([{ path, message }]) into { fieldName: message }. */
export function fieldErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (error instanceof ApiError && Array.isArray(error.details)) {
    for (const item of error.details as { path?: unknown; message?: unknown }[]) {
      if (typeof item?.path === "string" && typeof item.message === "string" && !result[item.path]) {
        result[item.path] = item.message;
      }
    }
  }
  return result;
}

/** A short sentence for an unexpected error. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.code === "NETWORK_ERROR") return "Could not reach the server. Check your connection and try again.";
    if (error.code === "RATE_LIMITED") return "Too many attempts. Please wait a moment and try again.";
    return error.message || fallback;
  }
  return fallback;
}