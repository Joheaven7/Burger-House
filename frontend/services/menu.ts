import { apiRequest } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import type { MenuCategory, MenuItem } from "@/types/menu";

export interface MenuQuery {
  categorySlug?: string;
  featured?: boolean;
}

export function getCategories(): Promise<MenuCategory[]> {
  return apiRequest<MenuCategory[]>("/menu/categories");
}

export function getMenuItems(query: MenuQuery = {}): Promise<MenuItem[]> {
  const params = new URLSearchParams();
  if (query.categorySlug) params.set("category", query.categorySlug);
  if (query.featured !== undefined) params.set("featured", String(query.featured));
  const queryString = params.toString();
  return apiRequest<MenuItem[]>(`/menu${queryString ? `?${queryString}` : ""}`);
}

/** Returns null when the item does not exist, so the page can show "Page not found". */
export async function getMenuItem(id: string): Promise<MenuItem | null> {
  try {
    return await apiRequest<MenuItem>(`/menu/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") return null;
    throw error;
  }
}