"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getConfirmationServerSnapshot,
  getConfirmationSnapshot,
  parseConfirmation,
  subscribeConfirmation,
} from "@/features/checkout/confirmationStore";
import { apiRequest } from "@/lib/api-client";
import { formatMoney } from "@/lib/money";
import { useHydrated } from "@/lib/useHydrated";
import { messages } from "@/messages/en";

interface TrackResponse {
  status: string;
  estimateText?: string;
}

export function ConfirmationView() {
  const hydrated = useHydrated();
  const raw = useSyncExternalStore(subscribeConfirmation, getConfirmationSnapshot, getConfirmationServerSnapshot);
  const confirmation = parseConfirmation(raw);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [liveStatus, setLiveStatus] = useState<string>("received");

  useEffect(() => {
    if (confirmation) headingRef.current?.focus();
  }, [confirmation?.orderNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live order status polling
  useEffect(() => {
    if (!confirmation?.orderNumber) return;
    let active = true;

    const poll = async () => {
      try {
        const res = await apiRequest<TrackResponse>(`/orders/track/${encodeURIComponent(confirmation.orderNumber)}`);
        if (active && res?.status) {
          setLiveStatus(res.status);
        }
      } catch {
        // network retry silently
      }
    };

    void poll();
    const timer = setInterval(poll, 7000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [confirmation?.orderNumber]);

  if (!hydrated) {
    return (
      <div className="space-y-6" aria-hidden="true">
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  }

  if (!confirmation) {
    return (
      <EmptyState
        title={messages.confirmation.noOrderTitle}
        description={messages.confirmation.noOrderText}
        action={<ButtonLink href="/menu">{messages.confirmation.backToMenu}</ButtonLink>}
      />
    );
  }

  const money = (amount: number) => formatMoney(amount, confirmation.currency, confirmation.locale);
  const isDelivery = confirmation.orderType === "delivery";
  const typeLabel = isDelivery ? messages.checkout.delivery : messages.checkout.pickup;

  const currentStepIndex = (() => {
    switch (liveStatus) {
      case "received":
      case "pending":
        return 0;
      case "preparing":
        return 1;
      case "ready":
      case "ready_for_pickup":
        return 2;
      case "completed":
        return 3;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  })();

  const isCancelled = liveStatus === "cancelled";

  const steps = [
    { label: messages.confirmation.steps.received, active: currentStepIndex === 0, done: currentStepIndex >= 0 },
    { label: messages.confirmation.steps.preparing, active: currentStepIndex === 1, done: currentStepIndex >= 1 },
    {
      label: isDelivery ? messages.confirmation.steps.readyDelivery : messages.confirmation.steps.readyPickup,
      active: currentStepIndex === 2,
      done: currentStepIndex >= 2,
    },
    { label: messages.confirmation.steps.completed, active: currentStepIndex === 3, done: currentStepIndex >= 3 },
  ];

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-8">
      {/* Order Status & Progress Ticket */}
      <Card surface="light" padding="lg" className="border-ink/10 shadow-luxury space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
          <Badge variant="success" size="md" dot>
            {messages.confirmation.title}
          </Badge>
          <Badge variant="gold" size="sm">
            {typeLabel}
          </Badge>
        </div>

        <div className="space-y-2">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-ink outline-none"
          >
            {messages.confirmation.statement}
          </h1>
          <p className="text-sm text-muted">
            {confirmation.estimateText ?? messages.confirmation.paymentNote}
          </p>
        </div>

        {/* Order Number Showcase */}
        <div className="rounded-card border border-copper/30 bg-copper/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              {messages.confirmation.orderNumber}
            </span>
            <p className="font-editorial text-3xl sm:text-4xl font-bold text-orange-dark tracking-tight">
              {confirmation.orderNumber}
            </p>
          </div>
          <div className="text-xs text-muted max-w-xs">
            Quote this number upon collection or when calling the kitchen.
          </div>
        </div>

        {/* Visual Order Progression Stepper */}
        {isCancelled ? (
          <div className="rounded-control bg-red-50 border border-red-200 text-red-800 p-4 text-sm font-semibold">
            This order has been cancelled. Please contact the restaurant if you have questions.
          </div>
        ) : (
          <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
            Order Status Progression
          </p>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {steps.map((step, idx) => (
              <li
                key={step.label}
                className={`relative flex flex-col items-center gap-2 rounded-control border p-3 text-center transition-all ${
                  step.active
                    ? "border-orange bg-orange/10 font-bold text-orange-dark"
                    : "border-ink/10 bg-surface/50 text-muted opacity-70"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step.active ? "bg-orange text-white" : "bg-ink/10 text-ink/60"
                  }`}
                  aria-hidden="true"
                >
                  {step.done ? "✓" : idx + 1}
                </span>
                <span className="text-xs leading-tight">{step.label}</span>
              </li>
            ))}
          </ol>
        </div>
        )}

        <div className="border-t border-ink/10 pt-4 text-xs text-muted-dark">
          <p>{messages.confirmation.noPayment} {messages.confirmation.paymentNote}</p>
        </div>
      </Card>

      {/* Itemized Order Receipt Card */}
      <Card surface="light" padding="lg" className="border-ink/10 shadow-sm space-y-6">
        <h2 className="font-editorial text-2xl font-bold tracking-tight text-ink border-b border-ink/10 pb-4">
          {messages.confirmation.itemsTitle}
        </h2>

        <ul className="space-y-3 text-sm divide-y divide-ink/5">
          {confirmation.items.map((line) => (
            <li key={line.itemId} className="flex justify-between items-start gap-4 pt-2 first:pt-0">
              <div className="flex items-center gap-2">
                <Badge variant="neutral" size="sm">
                  {line.quantity}×
                </Badge>
                <span className="font-medium text-ink">{line.name}</span>
              </div>
              <span className="font-semibold text-ink shrink-0">{money(line.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>

        <OrderSummary
          currency={confirmation.currency}
          locale={confirmation.locale}
          subtotalMinor={confirmation.subtotalMinor}
          deliveryFeeMinor={isDelivery ? confirmation.deliveryFeeMinor : undefined}
          totalMinor={confirmation.totalMinor}
        />
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 print:hidden">
        <ButtonLink href="/menu" variant="secondary" size="lg">
          ← {messages.confirmation.backToMenu}
        </ButtonLink>
        <Button variant="ghost" size="lg" onClick={handlePrint}>
          🖨️ {messages.confirmation.printReceipt}
        </Button>
      </div>
    </div>
  );
}
