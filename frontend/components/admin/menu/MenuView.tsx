"use client";

import { useEffect, useState } from "react";
import { CategoriesPanel } from "@/components/admin/menu/CategoriesPanel";
import { ItemsPanel } from "@/components/admin/menu/ItemsPanel";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminText } from "@/messages/admin";
import { getSettings, listCategories, listMenuItems } from "@/services/admin";
import type { AdminCategory, AdminMenuItem } from "@/types/admin";

interface MenuData {
  items: AdminMenuItem[];
  categories: AdminCategory[];
  currency: string;
  locale: string;
}

type Tab = "items" | "categories";

export function MenuView() {
  const [data, setData] = useState<MenuData | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState<Tab>("items");

  useEffect(() => {
    let cancelled = false;
    Promise.all([listMenuItems(), listCategories(), getSettings()])
      .then(([items, categories, settings]) => {
        if (!cancelled) setData({ items, categories, currency: settings.currency, locale: settings.locale });
      })
      .catch(() => {
        if (!cancelled) setData("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (data === null) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-12 rounded-control bg-ink/10" />
        <Skeleton className="h-64 rounded-card bg-ink/10" />
      </div>
    );
  }
  if (data === "failed") {
    return (
      <ErrorState
        message={adminText.common.loadError}
        onRetry={() => {
          setData(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "items", label: adminText.menu.tabItems },
    { id: "categories", label: adminText.menu.tabCategories },
  ];

  return (
    <div className="space-y-6">
      <div role="group" aria-label={adminText.menu.title} className="flex gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`min-h-11 rounded-full border-2 px-5 font-semibold ${tab === item.id ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink hover:border-ink"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "items" ? (
        <ItemsPanel
          items={data.items}
          categories={data.categories}
          currency={data.currency}
          locale={data.locale}
          onItemsChange={(update) => setData((prev) => (prev && prev !== "failed" ? { ...prev, items: update(prev.items) } : prev))}
        />
      ) : (
        <CategoriesPanel
          categories={data.categories}
          onCategoriesChange={(update) => setData((prev) => (prev && prev !== "failed" ? { ...prev, categories: update(prev.categories) } : prev))}
        />
      )}
    </div>
  );
}