import { Schema, model, type Types } from "mongoose";

export interface MenuCategoryDoc {
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
}
export type MenuCategoryLean = MenuCategoryDoc & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

const categorySchema = new Schema<MenuCategoryDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const MenuCategory = model<MenuCategoryDoc>("MenuCategory", categorySchema);

export interface MenuItemDoc {
  name: string;
  description: string;
  categoryId: Types.ObjectId;
  priceMinor: number; // integer minor units
  imageUrl?: string;
  active: boolean; // false = archived (hidden everywhere, kept for old orders)
  available: boolean; // false = sold out today (still listed, cannot be ordered)
  featured: boolean;
  sortOrder: number;
}
export type MenuItemLean = MenuItemDoc & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

const itemSchema = new Schema<MenuItemDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", maxlength: 300 },
    categoryId: { type: Schema.Types.ObjectId, ref: "MenuCategory", required: true },
    priceMinor: { type: Number, required: true, min: 0, validate: Number.isInteger },
    imageUrl: { type: String },
    active: { type: Boolean, default: true },
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);
itemSchema.index({ categoryId: 1, active: 1, sortOrder: 1 });
export const MenuItem = model<MenuItemDoc>("MenuItem", itemSchema);