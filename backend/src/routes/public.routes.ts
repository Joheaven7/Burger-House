import { Router } from "express";
import { publicReadLimiter } from "../middleware/security";
import { toCategoryDto, toMenuItemDto, toPublicSettingsDto } from "../services/dto";
import { getPublicItem, listPublicCategories, listPublicItems } from "../services/menu.service";
import { getSettings } from "../services/settings.service";
import { AppError, asyncHandler } from "../utils/errors";
import { menuQuerySchema, parseOrThrow } from "../validators";

export const publicRouter = Router();

publicRouter.get("/settings/public", publicReadLimiter, asyncHandler(async (_req, res) => {
  res.json({ data: toPublicSettingsDto(await getSettings()) });
}));

publicRouter.get("/menu/categories", publicReadLimiter, asyncHandler(async (_req, res) => {
  res.json({ data: (await listPublicCategories()).map(toCategoryDto) });
}));

publicRouter.get("/menu", publicReadLimiter, asyncHandler(async (req, res) => {
  const query = parseOrThrow(menuQuerySchema, req.query);
  const items = await listPublicItems({
    categorySlug: query.category,
    featured: query.featured === undefined ? undefined : query.featured === "true",
  });
  res.json({ data: items.map(toMenuItemDto) });
}));

publicRouter.get("/menu/:id", publicReadLimiter, asyncHandler(async (req, res) => {
  const item = await getPublicItem(String(req.params.id));
  if (!item) throw new AppError("NOT_FOUND", "Menu item not found.", 404);
  res.json({ data: toMenuItemDto(item) });
}));