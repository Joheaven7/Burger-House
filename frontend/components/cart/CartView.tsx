"use client";

import Link from "next/link";
import { CartLineRow } from "@/components/cart/CartLineRow";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { QuoteNotices } from "@/components/cart/QuoteNotices";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useCart } from "@/features/cart/CartContext";
import { useQuote } from "@/features/cart/useQuote";
import { siteConfig } from "@/lib/site";
import { messages } from "@/messages/en";

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-3" aria-hidden="true">
      <div className="space-y-4 lg:col-span-2">
        <Skeleton className="h-28 w-full rounded-card" />
        <Skeleton className="h-28 w-full rounded-card" />
      </div>
      <Skeleton className="h-64 w-full rounded-card" />
    </div>
  );
}

export function CartView() {
  const { lines, hydrated, maxQuantityPerLine, setQuantity, removeItem, removeItems } = useCart();
  const { quote, loading, error, refresh } = useQuote(lines, undefined, hydrated);

  if (!hydrated) return <CartSkeleton />;

  if (lines.length === 0) {
    return (
      <EmptyState
        title={messages.cart.emptyTitle}
        description={messages.cart.emptyText}
        action={<ButtonLink href="/menu">{messages.cart.browseMenu}</ButtonLink>}
      />
    );
  }

  if (error && !quote) {
    return (
      <ErrorState title={messages.cart.loadErrorTitle} message={messages.cart.loadErrorText} onRetry={refresh} />
    );
  }

  if (!quote) return <CartSkeleton />;

  // Lines the server can price, with the quantity the customer has right now
  const priced = new Map(quote.lines.map((line) => [line.itemId, line]));
  const rows = lines.flatMap((line) => {
    const known = priced.get(line.itemId);
    return known ? [{ ...known, quantity: line.quantity }] : [];
  });
  const subtotalMinor = rows.reduce((sum, row) => sum + row.unitPriceMinor * row.quantity, 0);

  const unavailableIds = quote.conflicts.map((conflict) => conflict.itemId);
  const canCheckout = !quote.block && !loading;

  return (
    <div className="grid gap-10 lg:grid-cols-3" aria-busy={loading}>
      {/* Items List */}
      <div className="space-y-6 lg:col-span-2">
        <QuoteNotices quote={quote} onRemoveUnavailable={() => removeItems(unavailableIds)} />

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-orange-dark/40 bg-surface p-4 shadow-sm">
            <p className="text-sm font-semibold text-orange-dark">{messages.cart.refreshFailed}</p>
            <Button variant="secondary" size="sm" onClick={refresh}>
              {messages.common.tryAgain}
            </Button>
          </div>
        )}

        <ul aria-label={messages.cart.itemsLabel} className="space-y-4">
          {rows.map((row) => (
            <CartLineRow
              key={row.itemId}
              itemId={row.itemId}
              name={row.name}
              unitPriceMinor={row.unitPriceMinor}
              quantity={row.quantity}
              maxQuantity={maxQuantityPerLine}
              currency={quote.currency}
              locale={quote.locale}
              onQuantityChange={(quantity) => setQuantity(row.itemId, row.name, quantity)}
              onRemove={() => removeItem(row.itemId, row.name)}
            />
          ))}
        </ul>

        <div className="pt-2">
          <Link href="/menu" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-orange-dark transition-colors">
            <span aria-hidden="true">←</span>
            <span>{messages.cart.browseMenu}</span>
          </Link>
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <aside className="h-fit space-y-6">
        <Card surface="light" padding="lg" className="border-ink/10 shadow-luxury space-y-6 lg:sticky lg:top-28">
          <h2 className="font-editorial text-2xl font-bold tracking-tight text-ink border-b border-ink/10 pb-4">
            {messages.cart.summaryTitle}
          </h2>

          <OrderSummary currency={quote.currency} locale={quote.locale} subtotalMinor={subtotalMinor} />

          <p className="text-xs text-muted leading-relaxed">
            {messages.cart.provisional}
          </p>

          {loading && (
            <p className="flex items-center gap-2 text-xs font-semibold text-orange-dark animate-pulse">
              <Spinner label={messages.cart.updating} decorative />
              {messages.cart.updating}
            </p>
          )}

          <div>
            {canCheckout ? (
              <ButtonLink href={siteConfig.orderHref} size="lg" className="w-full">
                {messages.cart.checkout}
              </ButtonLink>
            ) : (
              <Button size="lg" disabled className="w-full">
                {messages.cart.checkout}
              </Button>
            )}
          </div>
        </Card>
      </aside>
    </div>
  );
}
