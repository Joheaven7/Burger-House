import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { AvailabilityBadge } from "@/components/menu/AvailabilityBadge";
import { ProductImage } from "@/components/menu/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { formatMoney } from "@/lib/money";
import { messages } from "@/messages/en";
import { getCategories, getMenuItem } from "@/services/menu";
import { getPublicSettings } from "@/services/settings";

interface ItemPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getMenuItem(id);
  return { title: item ? `${item.name} | ${messages.siteName}` : messages.common.notFoundTitle };
}

export default async function MenuItemPage({ params }: ItemPageProps) {
  const { id } = await params;
  const [item, categories, settings] = await Promise.all([getMenuItem(id), getCategories(), getPublicSettings()]);

  if (!item) notFound();

  const category = categories.find((c) => c.id === item.categoryId);

  return (
    <Container className="space-y-8 py-10 sm:py-16">
      {/* Back to Menu Navigation */}
      <Link
        href="/menu"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink/70 hover:text-orange-dark transition-colors"
      >
        <span aria-hidden="true">←</span>
        <span>{messages.menu.backToMenu}</span>
      </Link>

      {/* Two-Column Product Presentation */}
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        {/* Left: Product Imagery */}
        <Card surface="light" padding="none" className="overflow-hidden border-ink/10 shadow-luxury">
          <ProductImage
            src={item.imageUrl}
            alt={item.name}
            className="aspect-square w-full object-cover"
            dimmed={!item.available}
          />
        </Card>

        {/* Right: Specifications & Ordering */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <Badge variant="neutral" size="sm">
                  {category.name}
                </Badge>
              )}
              {item.featured && (
                <Badge variant="gold" size="sm">
                  Chef&apos;s Signature
                </Badge>
              )}
              <AvailabilityBadge available={item.available} />
            </div>

            <h1 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-ink">
              {item.name}
            </h1>

            <p className="font-semibold text-3xl text-orange-dark">
              {formatMoney(item.priceMinor, settings.currency, settings.locale)}
            </p>
          </div>

          <p className="max-w-prose text-lg text-muted leading-relaxed">
            {item.description}
          </p>

          {/* Kitchen Craft Assurance */}
          <div className="rounded-card border border-ink/10 bg-cream/60 p-4 text-xs text-muted space-y-1">
            <p className="font-semibold text-ink uppercase tracking-wider">Kitchen Preparation</p>
            <p>Every burger is seared fresh to order with our custom dry-aged beef blend and toasted brioche.</p>
          </div>

          {/* Add to Cart Action */}
          <div className="pt-2">
            <AddToCartButton
              itemId={item.id}
              itemName={item.name}
              available={item.available}
              size="lg"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
