"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Select, Switch } from "@/components/ui/Controls";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { fractionDigits, minorToInput, parseMoneyInput } from "@/lib/admin-money";
import { errorMessage, fieldErrors } from "@/lib/api-fields";
import { adminText } from "@/messages/admin";
import { createMenuItem, updateMenuItem, type MenuItemInput } from "@/services/admin";
import type { AdminCategory, AdminMenuItem } from "@/types/admin";

interface ItemFormProps {
  item: AdminMenuItem | null; // null = adding a new item
  categories: AdminCategory[];
  currency: string;
  locale: string;
  onSaved: (item: AdminMenuItem) => void;
  onClose: () => void;
}

// The form is mounted only while the pop-up is open, so every opening starts with fresh values.
function ItemForm({ item, categories, currency, locale, onSaved, onClose }: ItemFormProps) {
  const digits = fractionDigits(currency, locale);
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(item ? minorToInput(item.priceMinor, digits) : "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [sortOrder, setSortOrder] = useState(String(item?.sortOrder ?? 0));
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [available, setAvailable] = useState(item?.available ?? true);
  const [active, setActive] = useState(item?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const problems: Record<string, string> = {};
    const priceMinor = parseMoneyInput(price, digits);
    if (priceMinor === null) problems.priceMinor = adminText.menu.priceInvalid;
    const sort = Number(sortOrder);
    if (!Number.isInteger(sort)) problems.sortOrder = adminText.menu.sortInvalid;
    if (!name.trim()) problems.name = "Name is required.";
    setErrors(problems);
    setFormError(null);
    if (Object.keys(problems).length > 0 || priceMinor === null) return;

    const base = { name: name.trim(), description: description.trim(), categoryId, priceMinor, active, available, featured, sortOrder: sort };
    setSaving(true);
    try {
      const url = imageUrl.trim();
      const saved = item
        ? await updateMenuItem(item.id, { ...base, imageUrl: url || null }) // null removes the picture
        : await createMenuItem({ ...base, imageUrl: url || undefined } satisfies MenuItemInput);
      onSaved(saved);
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      setFormError(Object.keys(fields).length > 0 ? null : errorMessage(error, adminText.common.unexpected));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="font-semibold text-tomato-dark">
          {formError}
        </p>
      )}
      <Input id="item-name" label={adminText.menu.name} value={name} error={errors.name} onChange={(event) => setName(event.target.value)} />
      <Textarea id="item-description" label={adminText.menu.description} rows={3} value={description} error={errors.description} onChange={(event) => setDescription(event.target.value)} />
      <Select id="item-category" label={adminText.menu.category} value={categoryId} error={errors.categoryId} onChange={(event) => setCategoryId(event.target.value)}>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Input
        id="item-price"
        label={adminText.menu.price}
        hint={adminText.menu.priceHint(currency)}
        inputMode="decimal"
        value={price}
        error={errors.priceMinor}
        onChange={(event) => setPrice(event.target.value)}
      />
      <Input id="item-image" label={adminText.menu.imageUrl} hint={adminText.menu.imageHint} type="url" value={imageUrl} error={errors.imageUrl} onChange={(event) => setImageUrl(event.target.value)} />

      {/* Image Preview / Validation Preview */}
      <div className="rounded-card border border-ink/10 bg-cream/30 p-3 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Food Photography Preview
        </span>
        {imageUrl.trim() ? (
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-control border border-ink/10 bg-charcoal/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl.trim()}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const fallback = (e.target as HTMLImageElement).nextElementSibling;
                  if (fallback) fallback.classList.remove("hidden");
                }}
              />
              <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-orange/10 p-1 text-center text-[10px] font-semibold text-orange-dark">
                Invalid Image URL
              </div>
            </div>
            <div className="text-xs space-y-1">
              <p className="font-medium text-ink">Image link entered</p>
              <p className="text-muted">Will display across digital menu and product detail pages.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-1 text-xs text-muted">
            <div className="flex h-12 w-16 items-center justify-center rounded-control border border-dashed border-ink/20 bg-charcoal/5">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-copper/60" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <span>No image URL entered. A culinary craft graphic will be displayed as fallback.</span>
          </div>
        )}
      </div>

      <Input id="item-sort" label={adminText.menu.sortOrder} hint={adminText.menu.sortHint} inputMode="numeric" value={sortOrder} error={errors.sortOrder} onChange={(event) => setSortOrder(event.target.value)} />

      <div className="space-y-3">
        {[
          { label: adminText.menu.featuredLabel, value: featured, set: setFeatured },
          { label: adminText.menu.availableToggle, value: available, set: setAvailable },
          { label: adminText.menu.activeToggle, value: active, set: setActive },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span>{row.label}</span>
            <Switch checked={row.value} onChange={row.set} label={row.label} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          {adminText.common.cancel}
        </Button>
        <Button type="submit" loading={saving}>
          {saving ? adminText.common.saving : adminText.common.save}
        </Button>
      </div>
    </form>
  );
}

export function ItemFormDialog({ open, ...props }: ItemFormProps & { open: boolean }) {
  return (
    <Modal open={open} onClose={props.onClose} title={props.item ? adminText.menu.formEditTitle : adminText.menu.formAddTitle} wide>
      <ItemForm {...props} />
    </Modal>
  );
}