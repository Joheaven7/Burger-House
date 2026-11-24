"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/admin/AdminUi";
import { OrderTicket } from "@/components/admin/OrderTicket";
import { StatusActions } from "@/components/admin/StatusActions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminLive } from "@/features/admin/LiveContext";
import { ApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { adminText } from "@/messages/admin";
import { getOrder } from "@/services/admin";
import type { AdminOrderDetail } from "@/types/admin";

type LoadState = { kind: "ready"; order: AdminOrderDetail } | { kind: "notfound" } | { kind: "failed" } | null;

export function OrderDetailView({ id }: { id: string }) {
  const { stats, refresh } = useAdminLive();
  const [state, setState] = useState<LoadState>(null);
  const [attempt, setAttempt] = useState(0);
  const timezone = stats?.timezone;

  useEffect(() => {
    let cancelled = false;
    getOrder(id)
      .then((order) => {
        if (!cancelled) setState({ kind: "ready", order });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ kind: error instanceof ApiError && error.status === 404 ? "notfound" : "failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const reload = () => {
    setState(null);
    setAttempt((value) => value + 1);
  };

  const back = (
    <Link href="/admin/orders" className="inline-flex min-h-11 items-center font-semibold text-tomato-dark hover:underline print:hidden">
      ← {adminText.detail.back}
    </Link>
  );

  if (state === null) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-10 w-1/2 rounded-control bg-ink/10" />
        <Skeleton className="h-48 rounded-card bg-ink/10" />
      </div>
    );
  }
  if (state.kind === "notfound") {
    return (
      <div className="space-y-4">
        {back}
        <EmptyState title={adminText.detail.notFoundTitle} description={adminText.detail.notFoundText} action={<ButtonLink href="/admin/orders">{adminText.detail.back}</ButtonLink>} />
      </div>
    );
  }
  if (state.kind === "failed") {
    return (
      <div className="space-y-4">
        {back}
        <ErrorState message={adminText.common.loadError} onRetry={reload} />
      </div>
    );
  }

  const order = state.order;
  const money = (amount: number) => formatMoney(amount, order.currency, order.locale);

  return (
    <>
      <div className="space-y-6 print:hidden">
        {back}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-display text-4xl font-bold uppercase">{order.orderNumber}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.status} />
              <span className="text-muted">
                {adminText.detail.createdAt}: {formatDateTime(order.createdAt, timezone)}
              </span>
            </div>
          </div>
          <Button variant="secondary" onClick={() => window.print()}>
            {adminText.detail.print}
          </Button>
        </div>

        <section aria-labelledby="actions-title" className="space-y-3 rounded-card border border-ink/10 bg-surface p-5">
          <h3 id="actions-title" className="font-display text-xl font-bold uppercase">
            {adminText.detail.actionsTitle}
          </h3>
          <StatusActions
            order={order}
            onUpdated={(updated) => {
              setState({ kind: "ready", order: updated });
              void refresh();
            }}
            onConflict={() => {
              reload();
              void refresh();
            }}
          />
          {order.cancellationReason && (
            <p>
              <span className="font-semibold">{adminText.detail.cancelledReason}:</span> {order.cancellationReason}
            </p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="customer-title" className="space-y-3 rounded-card border border-ink/10 bg-surface p-5">
            <h3 id="customer-title" className="font-display text-xl font-bold uppercase">
              {adminText.detail.customer}
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted">{adminText.detail.name}</dt>
                <dd className="font-semibold">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">{adminText.detail.phone}</dt>
                <dd className="font-semibold">
                  <a href={`tel:${order.phone}`} className="text-tomato-dark hover:underline">
                    {order.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">{adminText.detail.type}</dt>
                <dd className="font-semibold">{adminText.common.type[order.orderType]}</dd>
              </div>
              {order.address && (
                <div>
                  <dt className="text-sm text-muted">{adminText.detail.address}</dt>
                  <dd className="whitespace-pre-line font-semibold">{order.address}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-muted">{adminText.detail.note}</dt>
                <dd className="whitespace-pre-line">{order.note ?? adminText.detail.noNote}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="history-title" className="space-y-3 rounded-card border border-ink/10 bg-surface p-5">
            <h3 id="history-title" className="font-display text-xl font-bold uppercase">
              {adminText.detail.history}
            </h3>
            <ol className="space-y-3">
              {order.history.map((entry, index) => (
                <li key={`${entry.createdAt}-${index}`} className="border-l-4 border-ink/20 pl-3">
                  <p className="font-semibold">
                    {adminText.detail.historyLine(entry.fromStatus ? adminText.status[entry.fromStatus] : null, adminText.status[entry.toStatus])}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDateTime(entry.createdAt, timezone)} · {adminText.detail.by} {entry.changedBy ?? adminText.detail.system}
                  </p>
                  {entry.reason && (
                    <p className="text-sm">
                      {adminText.detail.reason}: {entry.reason}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section aria-labelledby="items-title" className="space-y-3 rounded-card border border-ink/10 bg-surface p-5">
          <h3 id="items-title" className="font-display text-xl font-bold uppercase">
            {adminText.detail.items}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-ink/10">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-semibold">{adminText.detail.colItem}</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">{adminText.detail.colQty}</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">{adminText.detail.colUnit}</th>
                  <th scope="col" className="py-2 font-semibold">{adminText.detail.colLine}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {order.items.map((line, index) => (
                  <tr key={`${line.itemId}-${index}`}>
                    <td className="py-2 pr-4">{line.name}</td>
                    <td className="py-2 pr-4">{line.quantity}</td>
                    <td className="py-2 pr-4">{money(line.unitPriceMinor)}</td>
                    <td className="py-2 font-semibold">{money(line.lineTotalMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between gap-4">
              <dt>{adminText.detail.subtotal}</dt>
              <dd className="font-semibold">{money(order.subtotalMinor)}</dd>
            </div>
            {order.orderType === "delivery" && (
              <div className="flex justify-between gap-4">
                <dt>{adminText.detail.deliveryFee}</dt>
                <dd className="font-semibold">{money(order.deliveryFeeMinor)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-ink/15 pt-2 text-lg font-bold">
              <dt>{adminText.detail.total}</dt>
              <dd>{money(order.totalMinor)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <OrderTicket order={order} timezone={timezone} />
    </>
  );
}