import { Router } from "express";
import { env } from "../config/env";
import { currentAdmin, requireAdmin } from "../middleware/auth";
import { csrfProtect } from "../middleware/security";
import { recordAudit } from "../services/audit.service";
import { toAdminCategoryDto, toAdminMenuItemDto, toAdminSettingsDto } from "../services/dto";
import {
  createCategory, createItem, deleteItem, listAdminCategories, listAdminItems, updateCategory, updateItem,
} from "../services/menu.service";
import { getStats } from "../services/orders.admin.service";
import { getSettings, updateSettings } from "../services/settings.service";
import { asyncHandler } from "../utils/errors";
import {
  adminMenuQuerySchema, categoryCreateSchema, categoryUpdateSchema, menuItemCreateSchema, menuItemUpdateSchema,
  parseOrThrow, settingsUpdateSchema,
} from "../validators";

// Everything under /api/admin needs a signed-in admin, and every change needs the CSRF checks.
export const adminRouter = Router();
adminRouter.use(csrfProtect, requireAdmin);

const audit = (res: Parameters<typeof currentAdmin>[0], action: string, resourceType: string, resourceId?: string, metadata?: Record<string, unknown>) =>
  recordAudit({ actorId: currentAdmin(res).id, action, resourceType, resourceId, metadata });

adminRouter.get("/stats", asyncHandler(async (_req, res) => {
  res.json({ data: await getStats() });
}));

/**
 * Shows how the server sees YOUR connection. After deploying, open this while signed in and check that "ip" is your real
 * public IP. If it is not, change TRUST_PROXY (see docs/DEPLOYMENT.md). It only ever returns your own connection details.
 */
adminRouter.get("/diagnostics", (req, res) => {
  res.json({ data: { ip: req.ip ?? null, forwardedFor: req.get("x-forwarded-for") ?? null, trustProxy: env.TRUST_PROXY, secure: req.secure, protocol: req.protocol } });
});

// ----- menu items -----
adminRouter.get("/menu", asyncHandler(async (req, res) => {
  const query = parseOrThrow(adminMenuQuerySchema, req.query);
  const items = await listAdminItems({ category: query.category, active: query.active === undefined ? undefined : query.active === "true", q: query.q });
  res.json({ data: items.map(toAdminMenuItemDto) });
}));

adminRouter.post("/menu", asyncHandler(async (req, res) => {
  const item = await createItem(parseOrThrow(menuItemCreateSchema, req.body));
  await audit(res, "menu.item_created", "menu_item", item._id.toString());
  res.status(201).json({ data: toAdminMenuItemDto(item) });
}));

adminRouter.patch("/menu/:id", asyncHandler(async (req, res) => {
  const patch = parseOrThrow(menuItemUpdateSchema, req.body);
  const item = await updateItem(String(req.params.id), patch);
  await audit(res, "menu.item_updated", "menu_item", item._id.toString(), { fields: Object.keys(patch) });
  res.json({ data: toAdminMenuItemDto(item) });
}));

adminRouter.delete("/menu/:id", asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const result = await deleteItem(id);
  await audit(res, result === "archived" ? "menu.item_archived" : "menu.item_deleted", "menu_item", id);
  res.json({ data: { id, result } });
}));

// ----- categories -----
adminRouter.get("/categories", asyncHandler(async (_req, res) => {
  res.json({ data: (await listAdminCategories()).map(toAdminCategoryDto) });
}));

adminRouter.post("/categories", asyncHandler(async (req, res) => {
  const category = await createCategory(parseOrThrow(categoryCreateSchema, req.body));
  await audit(res, "menu.category_created", "menu_category", category._id.toString());
  res.status(201).json({ data: toAdminCategoryDto(category) });
}));

adminRouter.patch("/categories/:id", asyncHandler(async (req, res) => {
  const patch = parseOrThrow(categoryUpdateSchema, req.body);
  const category = await updateCategory(String(req.params.id), patch);
  await audit(res, "menu.category_updated", "menu_category", category._id.toString(), { fields: Object.keys(patch) });
  res.json({ data: toAdminCategoryDto(category) });
}));

// ----- settings -----
adminRouter.get("/settings", asyncHandler(async (_req, res) => {
  res.json({ data: toAdminSettingsDto(await getSettings()) });
}));

adminRouter.patch("/settings", asyncHandler(async (req, res) => {
  const patch = parseOrThrow(settingsUpdateSchema, req.body);
  const updated = await updateSettings(patch);
  await audit(res, "settings.updated", "settings", "main", { fields: Object.keys(patch) });
  res.json({ data: toAdminSettingsDto(updated) });
}));