import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductImage } from "@/components/menu/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/money";
import { messages } from "@/messages/en";
import type { MenuItem } from "@/types/menu";

interface ProductCardProps {
  item: MenuItem;
  currency: string;
  locale: string;
}

export function ProductCard({ item, currency, locale }: ProductCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-ink/10 bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury hover:border-copper/30">
      {/* Product Image & Badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-charcoal/5">
        <ProductImage src={item.imageUrl} alt={item.name} className="h-full w-full" dimmed={!item.available} />

        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5 pointer-events-none">
          {!item.available ? (
            <Badge variant="danger" size="sm" dot>
              {messages.menu.soldOut}
            </Badge>
          ) : item.featured ? (
            <Badge variant="gold" size="sm">
              Chef&apos;s Pick
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-editorial text-xl font-bold leading-snug text-ink group-hover:text-orange-dark transition-colors">
          {/* The ::after makes the entire card surface clickable */}
          <Link href={`/menu/${item.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {item.name}
          </Link>
        </h3>

        <p className="line-clamp-2 text-sm text-muted leading-relaxed">{item.description}</p>

        <div className="mt-auto space-y-3 pt-3 border-t border-ink/5">
          <p className="font-semibold text-lg text-orange-dark">
            {formatMoney(item.priceMinor, currency, locale)}
          </p>

          {/* relative z-10 keeps button above the whole-card clickable area */}
          <div className="relative z-10">
            <AddToCartButton
              itemId={item.id}
              itemName={item.name}
              available={item.available}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
