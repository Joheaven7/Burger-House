"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/AdminUi";
import { ItemFormDialog } from "@/components/admin/menu/ItemFormDialog";
import { Button } from "@/components/ui/Button";
import { Select, Switch } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { errorMessage } from "@/lib/api-fields";
import { formatMoney } from "@/lib/money";
import { adminText } from "@/messages/admin";
import { deleteMenuItem, updateMenuItem } from "@/services/admin";
import type { AdminCategory, AdminMenuItem } from "@/types/admin";

interface ItemsPanelProps {
  items: AdminMenuItem[];
  categories: AdminCategory[];
  currency: string;
  locale: string;
  onItemsChange: (update: (items: AdminMenuItem[]) => AdminMenuItem[]) => void;
}

export function ItemsPanel({ items, categories, currency, locale, onItemsChange }: ItemsPanelProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminMenuItem | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminMenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    return items.filter(
      (item) => (!categoryFilter || item.categoryId === categoryFilter) && (!text || item.name.toLowerCase().includes(text)),
    );
  }, [items, categoryFilter, search]);

  const replaceItem = (saved: AdminMenuItem) => {
    onItemsChange((list) =>
      list.some((item) => item.id === saved.id) ? list.map((item) => (item.id === saved.id ? saved : item)) : [...list, saved],
    );
  };

  const toggleAvailable = async (item: AdminMenuItem, available: boolean) => {
    setTogglingId(item.id);
    setRowError(null);
    try {
      replaceItem(await updateMenuItem(item.id, { available }));
    } catch (error) {
      setRowError(errorMessage(error, adminText.common.unexpected));
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteMenuItem(toDelete.id);
      onItemsChange((list) =>
        result.result === "deleted"
          ? list.filter((item) => item.id !== toDelete.id)
          : list.map((item) => (item.id === toDelete.id ? { ...item, active: false } : item)),
      );
      setToDelete(null);
    } catch (error) {
      setDeleteError(errorMessage(error, adminText.common.unexpected));
    } finally {
      setDeleting(false);
    }
  };

  if (categories.length === 0) {
    return <EmptyState title={adminText.menu.noCategoryTitle} description={adminText.menu.noCategoryText} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-48 flex-1">
          <Input id="menu-search" label={adminText.menu.searchLabel} type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="min-w-48">
          <Select id="menu-category-filter" label={adminText.menu.filterCategory} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="">{adminText.menu.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <Button size="lg" onClick={() => setEditing("new")}>
          {adminText.menu.addItem}
        </Button>
      </div>

      {rowError && (
        <p role="alert" className="font-semibold text-tomato-dark">
          {rowError}
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState title={adminText.menu.emptyTitle} description={adminText.menu.emptyText} />
      ) : (
        <div className="overflow-x-auto rounded-card border border-ink/10 bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">{adminText.menu.title}</caption>
            <thead className="border-b border-ink/10 bg-ink/5">
              <tr>
                {[adminText.menu.colName, adminText.menu.colCategory, adminText.menu.colPrice, adminText.menu.colAvailable, adminText.menu.colStatus, adminText.menu.colActions].map((heading) => (
                  <th key={heading} scope="col" className="px-4 py-3 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {visible.map((item) => (
                <tr key={item.id} className={item.active ? "" : "bg-ink/5 text-muted"}>
                  <td className="px-4 py-3 font-semibold">{item.name}</td>
                  <td className="px-4 py-3">{categoryName.get(item.categoryId) ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatMoney(item.priceMinor, currency, locale)}</td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={item.available}
                      disabled={togglingId === item.id || !item.active}
                      label={adminText.menu.availableLabel(item.name)}
                      onChange={(value) => void toggleAvailable(item, value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {!item.active && <span className="rounded-full border border-ink px-2 py-0.5 text-xs font-semibold">{adminText.menu.archived}</span>}
                      {item.featured && <span className="rounded-full bg-mustard px-2 py-0.5 text-xs font-semibold text-ink">{adminText.menu.featured}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button variant="ghost" onClick={() => setEditing(item)}>
                        {adminText.common.edit}
                        <span className="sr-only"> {item.name}</span>
                      </Button>
                      <Button variant="ghost" onClick={() => { setDeleteError(null); setToDelete(item); }}>
                        {adminText.menu.delete}
                        <span className="sr-only"> {item.name}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ItemFormDialog
        open={editing !== null}
        item={editing === "new" ? null : editing}
        categories={categories}
        currency={currency}
        locale={locale}
        onClose={() => setEditing(null)}
        onSaved={(saved) => {
          replaceItem(saved);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title={adminText.menu.deleteTitle(toDelete?.name ?? "")}
        message={adminText.menu.deleteText}
        confirmLabel={adminText.menu.deleteConfirm}
        loading={deleting}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}