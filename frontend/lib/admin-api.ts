import { ApiError } from "@/lib/api-error";
import { API_BASE_URL } from "@/lib/config";
import type { Pagination } from "@/types/admin";
import type { ApiErrorBody } from "@/types/api";

/** Fired when the server says the admin session is gone, so the whole admin area can return to the login page. */
export const ADMIN_UNAUTHORIZED_EVENT = "bh-admin-unauthorized";

interface AdminRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export interface AdminResponse<T> {
  data: T;
  pagination?: Pagination;
}

/**
 * Talks to the backend as a signed-in admin: the session cookie is sent (credentials: "include") and every
 * request carries the X-Requested-With header the server requires as CSRF protection.
 */
export async function adminRequest<T>(path: string, options: AdminRequestOptions = {}): Promise<AdminResponse<T>> {
  const { method = "GET", body, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
        "X-Requested-With": "burger-house",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
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
    if (response.status === 401 && !path.startsWith("/auth/")) {
      window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
    }
    throw new ApiError(error?.code ?? "UNKNOWN_ERROR", error?.message ?? "The request failed.", response.status, error?.details);
  }

  const body2 = payload as { data: T; pagination?: Pagination };
  return { data: body2.data, pagination: body2.pagination };
}