import type { Types } from "mongoose";
import { MenuCategory, MenuItem, type MenuCategoryLean, type MenuItemLean } from "../models/menu";
import { Order } from "../models/order";
import { AppError, isDuplicateKeyError } from "../utils/errors";
import { isObjectId } from "../validators";

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const slugify = (name: string) => name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// ---------- public ----------
export async function listPublicCategories(): Promise<MenuCategoryLean[]> {
  return MenuCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean<MenuCategoryLean[]>();
}

async function activeCategoryIds(): Promise<Types.ObjectId[]> {
  const categories = await MenuCategory.find({ active: true }, { _id: 1 }).lean<{ _id: Types.ObjectId }[]>();
  return categories.map((c) => c._id);
}

export async function listPublicItems(query: { categorySlug?: string; featured?: boolean }): Promise<MenuItemLean[]> {
  const filter: Record<string, unknown> = { active: true };
  if (query.categorySlug) {
    const category = await MenuCategory.findOne({ slug: query.categorySlug, active: true }, { _id: 1 }).lean<{ _id: Types.ObjectId }>();
    if (!category) return [];
    filter.categoryId = category._id;
  } else {
    filter.categoryId = { $in: await activeCategoryIds() };
  }
  if (query.featured !== undefined) filter.featured = query.featured;
  return MenuItem.find(filter).sort({ sortOrder: 1, name: 1 }).lean<MenuItemLean[]>();
}

export async function getPublicItem(id: string): Promise<MenuItemLean | null> {
  if (!isObjectId(id)) return null;
  const item = await MenuItem.findOne({ _id: id, active: true, categoryId: { $in: await activeCategoryIds() } }).lean<MenuItemLean>();
  return item;
}

// ---------- admin: items ----------
export async function listAdminItems(query: { category?: string; active?: boolean; q?: string }): Promise<MenuItemLean[]> {
  const filter: Record<string, unknown> = {};
  if (query.category) filter.categoryId = query.category;
  if (query.active !== undefined) filter.active = query.active;
  if (query.q) filter.name = { $regex: escapeRegex(query.q), $options: "i" };
  return MenuItem.find(filter).sort({ categoryId: 1, sortOrder: 1, name: 1 }).lean<MenuItemLean[]>();
}

async function requireCategory(id: string): Promise<void> {
  const exists = await MenuCategory.exists({ _id: id });
  if (!exists) throw new AppError("VALIDATION_FAILED", "Some details are not valid.", 422, [{ path: "categoryId", message: "Category does not exist." }]);
}

export async function createItem(input: {
  name: string; description?: string; categoryId: string; priceMinor: number; imageUrl?: string;
  active?: boolean; available?: boolean; featured?: boolean; sortOrder?: number;
}): Promise<MenuItemLean> {
  await requireCategory(input.categoryId);
  const created = await MenuItem.create({
    name: input.name,
    description: input.description ?? "",
    categoryId: input.categoryId,
    priceMinor: input.priceMinor,
    imageUrl: input.imageUrl,
    active: input.active ?? true,
    available: input.available ?? true,
    featured: input.featured ?? false,
    sortOrder: input.sortOrder ?? 0,
  });
  return created.toObject() as unknown as MenuItemLean;
}

export async function updateItem(id: string, patch: Record<string, unknown>): Promise<MenuItemLean> {
  if (!isObjectId(id)) throw new AppError("NOT_FOUND", "Menu item not found.", 404);
  if (typeof patch.categoryId === "string") await requireCategory(patch.categoryId);

  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (value === null) unset[key] = 1; // only imageUrl can be null (clears the picture)
    else set[key] = value;
  }
  const update: Record<string, unknown> = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;
  if (!Object.keys(update).length) throw new AppError("VALIDATION_FAILED", "Nothing to update.", 422);

  const updated = await MenuItem.findByIdAndUpdate(id, update, { returnDocument: "after" }).lean<MenuItemLean>();
  if (!updated) throw new AppError("NOT_FOUND", "Menu item not found.", 404);
  return updated;
}

/** Items that appear in an order are archived (kept for history); never-ordered items are deleted. */
export async function deleteItem(id: string): Promise<"archived" | "deleted"> {
  if (!isObjectId(id)) throw new AppError("NOT_FOUND", "Menu item not found.", 404);
  const item = await MenuItem.findById(id, { _id: 1 }).lean<{ _id: Types.ObjectId }>();
  if (!item) throw new AppError("NOT_FOUND", "Menu item not found.", 404);

  const ordered = await Order.exists({ "items.menuItemId": item._id });
  if (ordered) {
    await MenuItem.updateOne({ _id: item._id }, { $set: { active: false } });
    return "archived";
  }
  await MenuItem.deleteOne({ _id: item._id });
  return "deleted";
}

// ---------- admin: categories ----------
export async function listAdminCategories(): Promise<MenuCategoryLean[]> {
  return MenuCategory.find().sort({ sortOrder: 1, name: 1 }).lean<MenuCategoryLean[]>();
}

const slugTaken = () => new AppError("VALIDATION_FAILED", "Some details are not valid.", 422, [{ path: "slug", message: "This slug is already used." }]);

export async function createCategory(input: { name: string; slug?: string; sortOrder?: number; active?: boolean }): Promise<MenuCategoryLean> {
  const slug = input.slug ?? slugify(input.name);
  if (!slug) throw new AppError("VALIDATION_FAILED", "Some details are not valid.", 422, [{ path: "slug", message: "Could not build a slug from the name." }]);
  try {
    const created = await MenuCategory.create({ name: input.name, slug, sortOrder: input.sortOrder ?? 0, active: input.active ?? true });
    return created.toObject() as unknown as MenuCategoryLean;
  } catch (error) {
    if (isDuplicateKeyError(error)) throw slugTaken();
    throw error;
  }
}

export async function updateCategory(id: string, patch: Record<string, unknown>): Promise<MenuCategoryLean> {
  if (!isObjectId(id)) throw new AppError("NOT_FOUND", "Category not found.", 404);
  const set = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
  if (!Object.keys(set).length) throw new AppError("VALIDATION_FAILED", "Nothing to update.", 422);
  try {
    const updated = await MenuCategory.findByIdAndUpdate(id, { $set: set }, { returnDocument: "after" }).lean<MenuCategoryLean>();
    if (!updated) throw new AppError("NOT_FOUND", "Category not found.", 404);
    return updated;
  } catch (error) {
    if (isDuplicateKeyError(error)) throw slugTaken();
    throw error;
  }
}