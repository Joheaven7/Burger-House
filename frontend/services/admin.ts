import { adminRequest } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-error";
import type {
  AdminCategory, AdminMenuItem, AdminOrderDetail, AdminOrderSummary, AdminSettings, AdminStats, AdminUser,
  OrderStatus, Pagination,
} from "@/types/admin";

// ----- session -----
export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  const result = await adminRequest<{ admin: AdminUser }>("/auth/login", { method: "POST", body: { email, password } });
  return result.data.admin;
}

export async function logoutAdmin(): Promise<void> {
  await adminRequest("/auth/logout", { method: "POST" });
}

/** The signed-in admin, or null when there is no valid session. */
export async function fetchMe(): Promise<AdminUser | null> {
  try {
    return (await adminRequest<{ admin: AdminUser }>("/auth/me")).data.admin;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

// ----- dashboard -----
export async function getStats(signal?: AbortSignal): Promise<AdminStats> {
  return (await adminRequest<AdminStats>("/admin/stats", { signal })).data;
}

// ----- orders -----
export interface OrderQuery {
  status?: OrderStatus;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: "newest" | "oldest" | "total_desc" | "total_asc";
}

export async function listOrders(query: OrderQuery, signal?: AbortSignal): Promise<{ orders: AdminOrderSummary[]; pagination: Pagination }> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const result = await adminRequest<AdminOrderSummary[]>(`/orders?${params.toString()}`, { signal });
  return { orders: result.data, pagination: result.pagination ?? { page: 1, pageSize: result.data.length, total: result.data.length } };
}

export async function getOrder(id: string): Promise<AdminOrderDetail> {
  return (await adminRequest<AdminOrderDetail>(`/orders/${encodeURIComponent(id)}`)).data;
}

export async function changeOrderStatus(
  id: string,
  body: { expectedStatus: OrderStatus; newStatus: OrderStatus; reason?: string },
): Promise<AdminOrderDetail> {
  return (await adminRequest<AdminOrderDetail>(`/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", body })).data;
}

// ----- menu items -----
export interface MenuItemInput {
  name: string;
  description: string;
  categoryId: string;
  priceMinor: number;
  imageUrl?: string | null; // null clears the picture (updates only)
  active: boolean;
  available: boolean;
  featured: boolean;
  sortOrder: number;
}

export async function listMenuItems(): Promise<AdminMenuItem[]> {
  return (await adminRequest<AdminMenuItem[]>("/admin/menu")).data;
}
export async function createMenuItem(input: MenuItemInput): Promise<AdminMenuItem> {
  return (await adminRequest<AdminMenuItem>("/admin/menu", { method: "POST", body: input })).data;
}
export async function updateMenuItem(id: string, patch: Partial<MenuItemInput>): Promise<AdminMenuItem> {
  return (await adminRequest<AdminMenuItem>(`/admin/menu/${encodeURIComponent(id)}`, { method: "PATCH", body: patch })).data;
}
export async function deleteMenuItem(id: string): Promise<{ id: string; result: "archived" | "deleted" }> {
  return (await adminRequest<{ id: string; result: "archived" | "deleted" }>(`/admin/menu/${encodeURIComponent(id)}`, { method: "DELETE" })).data;
}

// ----- categories -----
export interface CategoryInput {
  name: string;
  slug?: string;
  sortOrder: number;
  active: boolean;
}

export async function listCategories(): Promise<AdminCategory[]> {
  return (await adminRequest<AdminCategory[]>("/admin/categories")).data;
}
export async function createCategory(input: CategoryInput): Promise<AdminCategory> {
  return (await adminRequest<AdminCategory>("/admin/categories", { method: "POST", body: input })).data;
}
export async function updateCategory(id: string, patch: Partial<CategoryInput>): Promise<AdminCategory> {
  return (await adminRequest<AdminCategory>(`/admin/categories/${encodeURIComponent(id)}`, { method: "PATCH", body: patch })).data;
}

// ----- settings -----
export async function getSettings(): Promise<AdminSettings> {
  return (await adminRequest<AdminSettings>("/admin/settings")).data;
}
export async function updateSettings(patch: Partial<AdminSettings>): Promise<AdminSettings> {
  return (await adminRequest<AdminSettings>("/admin/settings", { method: "PATCH", body: patch })).data;
}