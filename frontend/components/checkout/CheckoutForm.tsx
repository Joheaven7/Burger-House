"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { QuoteNotices } from "@/components/cart/QuoteNotices";
import { OrderTypeField } from "@/components/checkout/OrderTypeField";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input, Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useCart } from "@/features/cart/CartContext";
import { useQuote } from "@/features/cart/useQuote";
import { saveConfirmation } from "@/features/checkout/confirmationStore";
import { useCheckoutForm } from "@/features/checkout/useCheckoutForm";
import { formatMoney } from "@/lib/money";
import { messages } from "@/messages/en";
import type { PublicSettings } from "@/services/settings";
import type { OrderType } from "@/types/order";

function CheckoutSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-3" aria-hidden="true">
      <div className="space-y-6 lg:col-span-2">
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
      <Skeleton className="h-72 w-full rounded-card" />
    </div>
  );
}

const ERROR_FIELD_ORDER = ["name", "phone", "orderType", "address", "note"] as const;

export function CheckoutForm({ settings }: { settings: PublicSettings }) {
  const router = useRouter();
  const { lines, hydrated, clear, removeItems } = useCart();
  const [orderType, setOrderType] = useState<OrderType>(settings.pickupEnabled ? "pickup" : "delivery");
  const [done, setDone] = useState(false);

  const { quote, loading, error, refresh } = useQuote(lines, orderType, hydrated && !done);
  const quoteReady = quote !== null && !loading && !error;

  const form = useCheckoutForm({
    settings,
    orderType,
    lines,
    quote,
    quoteReady,
    refreshQuote: refresh,
    onSuccess: (confirmation) => {
      saveConfirmation(confirmation);
      setDone(true);
      clear();
      router.push("/order/confirmation");
    },
  });

  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (form.summaryFocusTick > 0) summaryRef.current?.focus();
  }, [form.summaryFocusTick]);

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Spinner label={messages.checkout.redirecting} />
        <p className="font-semibold text-ink text-lg">{messages.checkout.redirecting}</p>
      </div>
    );
  }

  if (!hydrated) return <CheckoutSkeleton />;

  if (lines.length === 0) {
    return (
      <EmptyState
        title={messages.cart.emptyTitle}
        description={messages.cart.emptyText}
        action={<ButtonLink href="/menu">{messages.cart.browseMenu}</ButtonLink>}
      />
    );
  }

  if (!settings.pickupEnabled && !settings.deliveryEnabled) {
    return (
      <EmptyState title={messages.checkout.noOrderTypesTitle} description={messages.checkout.noOrderTypesText} />
    );
  }

  if (error && !quote) {
    return <ErrorState title={messages.cart.loadErrorTitle} message={messages.cart.loadErrorText} onRetry={refresh} />;
  }

  if (!quote) return <CheckoutSkeleton />;

  const errors = form.visibleErrors;
  const errorEntries = ERROR_FIELD_ORDER.filter((field) => errors[field]);
  const canSubmit = quoteReady && !quote.block;
  const unavailableIds = quote.conflicts.map((conflict) => conflict.itemId);

  return (
    <form onSubmit={form.handleSubmit} noValidate className="grid gap-10 lg:grid-cols-3">
      {/* Form Fields Column */}
      <div className="space-y-6 lg:col-span-2">
        <QuoteNotices quote={quote} onRemoveUnavailable={() => removeItems(unavailableIds)} />

        {errorEntries.length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="rounded-card border border-orange-dark bg-surface p-5 shadow-sm outline-none focus:ring-2 focus:ring-orange/30"
          >
            <p className="font-semibold text-orange-dark">{messages.checkout.errorSummaryTitle}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {errorEntries.map((field) => (
                <li key={field}>
                  <a href={`#field-${field}`} className="font-semibold underline hover:text-orange-dark">
                    {messages.checkout.fieldLabels[field]}
                  </a>
                  : {errors[field]}
                </li>
              ))}
            </ul>
          </div>
        )}

        {form.submitError && (
          <div role="alert" className="rounded-card border border-orange-dark bg-surface p-5 shadow-sm">
            <p className="font-semibold text-orange-dark">{messages.checkout.submitErrors[form.submitError]}</p>
          </div>
        )}

        {/* Customer Details Card */}
        <Card surface="light" padding="lg" className="border-ink/10 shadow-sm space-y-6">
          <h2 className="font-editorial text-2xl font-bold tracking-tight text-ink border-b border-ink/10 pb-3">
            {messages.checkout.detailsTitle}
          </h2>

          <Input
            id="field-name"
            label={messages.checkout.name}
            autoComplete="name"
            value={form.values.name}
            error={errors.name}
            onChange={(event) => form.setField("name", event.target.value)}
            onBlur={() => form.markTouched("name")}
          />

          <Input
            id="field-phone"
            label={messages.checkout.phone}
            hint={messages.checkout.phoneHint}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.values.phone}
            error={errors.phone}
            onChange={(event) => form.setField("phone", event.target.value)}
            onBlur={() => form.markTouched("phone")}
          />

          <OrderTypeField
            value={orderType}
            onChange={setOrderType}
            pickupEnabled={settings.pickupEnabled}
            deliveryEnabled={settings.deliveryEnabled}
            deliveryFeeText={messages.checkout.deliveryFeeLabel(
              formatMoney(settings.deliveryFeeMinor, settings.currency, settings.locale),
            )}
            deliveryNote={settings.deliveryNote}
          />

          {orderType === "delivery" && (
            <Textarea
              id="field-address"
              label={messages.checkout.address}
              hint={messages.checkout.addressHint}
              autoComplete="street-address"
              rows={3}
              value={form.values.address}
              error={errors.address}
              onChange={(event) => form.setField("address", event.target.value)}
              onBlur={() => form.markTouched("address")}
            />
          )}
        </Card>

        {/* Special Instructions Card */}
        <Card surface="light" padding="lg" className="border-ink/10 shadow-sm space-y-4">
          <h2 className="font-editorial text-xl font-bold text-ink">
            {messages.checkout.note}
          </h2>
          <Textarea
            id="field-note"
            label={messages.checkout.note}
            hint={messages.checkout.noteHint}
            rows={3}
            value={form.values.note}
            error={errors.note}
            onChange={(event) => form.setField("note", event.target.value)}
            onBlur={() => form.markTouched("note")}
          />
        </Card>
      </div>

      {/* Order Summary & Submit Sidebar */}
      <aside className="h-fit space-y-6">
        <Card surface="light" padding="lg" className="border-ink/10 shadow-luxury space-y-6 lg:sticky lg:top-28">
          <h2 className="font-editorial text-2xl font-bold tracking-tight text-ink border-b border-ink/10 pb-4">
            {messages.checkout.summaryTitle}
          </h2>

          <ul className="space-y-3 text-sm divide-y divide-ink/5">
            {quote.lines.map((line) => (
              <li key={line.itemId} className="flex justify-between items-start gap-3 pt-2 first:pt-0">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">
                    {line.quantity}×
                  </Badge>
                  <span className="font-medium text-ink">{line.name}</span>
                </div>
                <span className="font-semibold text-ink shrink-0">
                  {formatMoney(line.lineTotalMinor, quote.currency, quote.locale)}
                </span>
              </li>
            ))}
          </ul>

          <OrderSummary
            currency={quote.currency}
            locale={quote.locale}
            subtotalMinor={quote.subtotalMinor}
            deliveryFeeMinor={orderType === "delivery" ? quote.deliveryFeeMinor : undefined}
            totalMinor={quote.totalMinor}
          />

          <div className="pt-2 space-y-3">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={form.submitting}
              disabled={!canSubmit}
            >
              {form.submitting ? messages.checkout.placing : messages.checkout.placeOrder}
            </Button>

            <ButtonLink href="/cart" variant="ghost" className="w-full text-center">
              {messages.cart.editCart}
            </ButtonLink>
          </div>
        </Card>
      </aside>
    </form>
  );
}
