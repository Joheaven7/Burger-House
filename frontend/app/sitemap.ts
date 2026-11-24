import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getMenuItems } from "@/services/menu";

// Built on request (not at deploy time), because the menu lives in the database.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [{ url: `${siteUrl}/` }, { url: `${siteUrl}/menu` }];
  try {
    const items = await getMenuItems();
    return [...pages, ...items.map((item) => ({ url: `${siteUrl}/menu/${item.id}` }))];
  } catch {
    return pages; // if the API is down, still return the main pages
  }
}