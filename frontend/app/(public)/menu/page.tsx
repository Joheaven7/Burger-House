import type { Metadata } from "next";
import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { ProductGrid } from "@/components/menu/ProductGrid";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { messages } from "@/messages/en";
import { getCategories, getMenuItems } from "@/services/menu";
import { getPublicSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: messages.nav.menu,
  description: "Browse our handcrafted gourmet burgers, fresh sides, and signature beverages.",
};

interface MenuPageProps {
  searchParams: Promise<{ category?: string | string[] }>;
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const { category } = await searchParams;
  const slug = Array.isArray(category) ? category[0] : category;

  const [categories, items, settings] = await Promise.all([
    getCategories(),
    getMenuItems({ categorySlug: slug }),
    getPublicSettings(),
  ]);

  const activeCategory = categories.find((c) => c.slug === slug);

  return (
    <Container className="space-y-10 py-12 sm:py-16">
      {/* Editorial Menu Header */}
      <header className="space-y-4 max-w-2xl">
        <Badge variant="gold" size="sm" dot>
          Handcrafted Selection
        </Badge>
        <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink">
          {activeCategory ? activeCategory.name : messages.menu.title}
        </h1>
        <p className="text-base sm:text-lg text-muted leading-relaxed">
          {messages.menu.subtitle}
        </p>
      </header>

      {/* Category Tabs */}
      <CategoryTabs categories={categories} activeSlug={slug} />

      {/* Product Grid or Empty State */}
      {items.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Showing {items.length} {items.length === 1 ? "item" : "items"}
          </p>
          <ProductGrid items={items} currency={settings.currency} locale={settings.locale} />
        </div>
      ) : (
        <EmptyState
          title={messages.menu.emptyTitle}
          description={messages.menu.emptyText}
          action={
            <ButtonLink href="/menu" variant="secondary">
              {messages.menu.showAll}
            </ButtonLink>
          }
        />
      )}
    </Container>
  );
}
