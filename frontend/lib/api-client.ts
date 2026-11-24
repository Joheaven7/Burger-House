import { ApiError } from "@/lib/api-error";
import { API_BASE_URL, INTERNAL_API_KEY } from "@/lib/config";
import type { ApiErrorBody } from "@/types/api";

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Use "include" for admin calls so the session cookie is sent. */
  credentials?: RequestCredentials;
}

/**
 * The one function that talks to the backend. It returns the `data` part of a successful
 * response and throws an ApiError (with a stable `code`) for every failure, including a server that cannot be reached.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, credentials } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(INTERNAL_API_KEY ? { "X-Internal-Key": INTERNAL_API_KEY } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store", // prices and availability must never come from a stale cache
      credentials,
    });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.includes("DYNAMIC_SERVER_USAGE") ||
        (err as { digest: string }).digest.startsWith("NEXT_"))
    ) {
      throw err;
    }
    throw new ApiError("NETWORK_ERROR", "Could not reach the server.", 0);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // no JSON body
  }

  if (!response.ok) {
    const error = (payload as Partial<ApiErrorBody> | null)?.error;
    throw new ApiError(error?.code ?? "UNKNOWN_ERROR", error?.message ?? "The request failed.", response.status, error?.details);
  }
  return (payload as { data: T }).data;
}