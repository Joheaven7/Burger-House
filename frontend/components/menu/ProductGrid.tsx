import clsx from "clsx";
import { ProductCard } from "@/components/menu/ProductCard";
import type { MenuItem } from "@/types/menu";

interface ProductGridProps {
  items: MenuItem[];
  currency: string;
  locale: string;
  columns?: 3 | 4;
}

const columnClass = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" } as const;

export function ProductGrid({ items, currency, locale, columns = 3 }: ProductGridProps) {
  return (
    <ul className={clsx("grid gap-6 sm:grid-cols-2", columnClass[columns])}>
      {items.map((item) => (
        <li key={item.id}>
          <ProductCard item={item} currency={currency} locale={locale} />
        </li>
      ))}
    </ul>
  );
}