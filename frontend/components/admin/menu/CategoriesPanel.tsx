"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { errorMessage, fieldErrors } from "@/lib/api-fields";
import { adminText } from "@/messages/admin";
import { createCategory, updateCategory } from "@/services/admin";
import type { AdminCategory } from "@/types/admin";

function CategoryForm({ category, onSaved, onClose }: { category: AdminCategory | null; onSaved: (c: AdminCategory) => void; onClose: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [active, setActive] = useState(category?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const sort = Number(sortOrder);
    const problems: Record<string, string> = {};
    if (!name.trim()) problems.name = "Name is required.";
    if (!Number.isInteger(sort)) problems.sortOrder = adminText.menu.sortInvalid;
    setErrors(problems);
    setFormError(null);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    try {
      const input = { name: name.trim(), sortOrder: sort, active };
      const saved = category
        ? await updateCategory(category.id, { ...input, ...(slug.trim() ? { slug: slug.trim() } : {}) })
        : await createCategory({ ...input, ...(slug.trim() ? { slug: slug.trim() } : {}) });
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
      <Input id="cat-name" label={adminText.menu.categoryName} value={name} error={errors.name} onChange={(event) => setName(event.target.value)} />
      <Input id="cat-slug" label={adminText.menu.slug} hint={adminText.menu.slugHint} value={slug} error={errors.slug} onChange={(event) => setSlug(event.target.value)} />
      <Input id="cat-sort" label={adminText.menu.sortOrder} hint={adminText.menu.sortHint} inputMode="numeric" value={sortOrder} error={errors.sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
      <div className="flex items-center justify-between gap-4">
        <span>{adminText.menu.categoryVisible}</span>
        <Switch checked={active} onChange={setActive} label={adminText.menu.categoryVisible} />
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

interface CategoriesPanelProps {
  categories: AdminCategory[];
  onCategoriesChange: (update: (categories: AdminCategory[]) => AdminCategory[]) => void;
}

export function CategoriesPanel({ categories, onCategoriesChange }: CategoriesPanelProps) {
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const replace = (saved: AdminCategory) => {
    onCategoriesChange((list) => {
      const next = list.some((c) => c.id === saved.id) ? list.map((c) => (c.id === saved.id ? saved : c)) : [...list, saved];
      return [...next].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    });
  };

  const toggle = async (category: AdminCategory, active: boolean) => {
    setTogglingId(category.id);
    setRowError(null);
    try {
      replace(await updateCategory(category.id, { active }));
    } catch (error) {
      setRowError(errorMessage(error, adminText.common.unexpected));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{adminText.menu.categoryHiddenNote}</p>
        <Button size="lg" onClick={() => setEditing("new")}>
          {adminText.menu.addCategory}
        </Button>
      </div>

      {rowError && (
        <p role="alert" className="font-semibold text-tomato-dark">
          {rowError}
        </p>
      )}

      {categories.length === 0 ? (
        <EmptyState title={adminText.menu.categoryEmpty} />
      ) : (
        <div className="overflow-x-auto rounded-card border border-ink/10 bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">{adminText.menu.categoriesTitle}</caption>
            <thead className="border-b border-ink/10 bg-ink/5">
              <tr>
                {[adminText.menu.colName, adminText.menu.colSlug, adminText.menu.colSort, adminText.menu.categoryVisible, adminText.menu.colActions].map((heading) => (
                  <th key={heading} scope="col" className="px-4 py-3 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 font-semibold">{category.name}</td>
                  <td className="px-4 py-3">{category.slug}</td>
                  <td className="px-4 py-3">{category.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={category.active}
                      disabled={togglingId === category.id}
                      label={adminText.menu.categoryActive(category.name)}
                      onChange={(value) => void toggle(category, value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" onClick={() => setEditing(category)}>
                      {adminText.common.edit}
                      <span className="sr-only"> {category.name}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" || editing === null ? adminText.menu.categoryAddTitle : adminText.menu.categoryEditTitle}>
        <CategoryForm
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            replace(saved);
            setEditing(null);
          }}
        />
      </Modal>
    </div>
  );
}