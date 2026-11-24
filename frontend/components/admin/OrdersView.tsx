"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pagination, StatusBadge } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Select } from "@/components/ui/Controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminLive } from "@/features/admin/LiveContext";
import { formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { NEXT_STATUSES } from "@/lib/order-status";
import { adminText } from "@/messages/admin";
import { changeOrderStatus, listOrders, type OrderQuery } from "@/services/admin";
import type { AdminOrderSummary, OrderStatus, Pagination as PaginationInfo } from "@/types/admin";

const PAGE_SIZE = 20;
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: adminText.orders.allStatuses },
  { value: "received", label: "Received" },
  { value: "preparing", label: "Preparing" },
  { value: "ready_for_pickup", label: "Ready for Pickup" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SORTS = ["newest", "oldest", "total_desc", "total_asc"] as const;

interface Result {
  key: string;
  orders: AdminOrderSummary[] | null;
  pagination: PaginationInfo | null;
  failed: boolean;
}

export function OrdersView() {
  const router = useRouter();
  const params = useSearchParams();
  const { stats, refresh } = useAdminLive();

  // The filters live in the URL search params so they survive reload and are shareable
  const status = params.get("status") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? "newest";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const [search, setSearch] = useState(q);
  const [result, setResult] = useState<Result | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page"); // reset to page 1 on new filter
      router.replace(`/admin/orders?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  // Debounced search when typing
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() !== q) setParam("q", search.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search, q, setParam]);

  // Reload when filters change or when live stats change
  const liveKey = stats ? `${stats.ordersToday}-${stats.pendingNow}` : "";
  const requestKey = JSON.stringify({ status, from, to, q, sort, page, liveKey });

  useEffect(() => {
    const controller = new AbortController();
    const filters = JSON.parse(requestKey) as { status: string; from: string; to: string; q: string; sort: string; page: number };
    const query: OrderQuery = {
      status: (filters.status || undefined) as OrderStatus | undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      q: filters.q || undefined,
      sort: filters.sort as OrderQuery["sort"],
      page: filters.page,
      pageSize: PAGE_SIZE,
    };
    listOrders(query, controller.signal)
      .then((data) => setResult({ key: requestKey, orders: data.orders, pagination: data.pagination, failed: false }))
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult((previous) => ({ key: requestKey, orders: previous?.orders ?? null, pagination: previous?.pagination ?? null, failed: true }));
      });
    return () => controller.abort();
  }, [requestKey]);

  const hasFilters = Boolean(status || from || to || q || sort !== "newest");
  const updating = result?.key !== requestKey;
  const timezone = stats?.timezone;

  const clearFilters = () => {
    setSearch("");
    router.replace("/admin/orders", { scroll: false });
  };

  // Quick inline status transition
  const handleStatusTransition = async (order: AdminOrderSummary, nextStatus: OrderStatus) => {
    setUpdatingId(order.id);
    setFeedback(null);
    try {
      await changeOrderStatus(order.id, {
        expectedStatus: order.status,
        newStatus: nextStatus,
      });

      // Update local state immediately
      setResult((prev) => {
        if (!prev?.orders) return prev;
        const updated = prev.orders.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o));
        return { ...prev, orders: updated };
      });

      setFeedback({
        message: `${order.orderNumber} updated to ${adminText.status[nextStatus] ?? nextStatus}.`,
        type: "success",
      });
      void refresh();
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : "Failed to update order status.",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-control p-4 text-sm font-semibold shadow-sm transition-all ${
            feedback.type === "success"
              ? "border border-green-500/30 bg-green-50 text-green-800"
              : "border border-red-500/30 bg-red-50 text-red-800"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs uppercase tracking-wider underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setParam("q", search.trim());
        }}
        className="grid gap-4 rounded-card border border-ink/10 bg-surface p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="sm:col-span-2">
          <Input
            id="orders-search"
            label={adminText.orders.searchLabel}
            type="search"
            placeholder={adminText.orders.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          id="orders-status"
          label={adminText.orders.statusLabel}
          value={status}
          onChange={(event) => setParam("status", event.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Input
          id="orders-from"
          label={adminText.orders.fromLabel}
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => setParam("from", event.target.value)}
        />
        <Input
          id="orders-to"
          label={adminText.orders.toLabel}
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => setParam("to", event.target.value)}
        />
        <Select
          id="orders-sort"
          label={adminText.orders.sortLabel}
          value={sort}
          onChange={(event) => setParam("sort", event.target.value)}
        >
          {SORTS.map((value) => (
            <option key={value} value={value}>
              {adminText.orders.sort[value]}
            </option>
          ))}
        </Select>
        {hasFilters && (
          <div className="flex items-end">
            <Button variant="ghost" onClick={clearFilters}>
              {adminText.orders.clearFilters}
            </Button>
          </div>
        )}
      </form>

      {/* Orders List / Table */}
      {result === null ? (
        <div className="space-y-3" aria-hidden="true">
          <Skeleton className="h-12 rounded-control bg-ink/10" />
          <Skeleton className="h-12 rounded-control bg-ink/10" />
          <Skeleton className="h-12 rounded-control bg-ink/10" />
        </div>
      ) : result.failed && !result.orders ? (
        <ErrorState message={adminText.common.loadError} onRetry={() => setParam("page", String(page))} />
      ) : result.orders && result.orders.length === 0 ? (
        <EmptyState title={adminText.orders.emptyTitle} description={adminText.orders.emptyText} />
      ) : (
        result.orders &&
        result.pagination && (
          <div className="space-y-4" aria-busy={updating}>
            {result.failed && (
              <p role="alert" className="font-semibold text-orange-dark">
                {adminText.common.loadError}
              </p>
            )}
            <div className="overflow-x-auto rounded-card border border-ink/10 bg-surface shadow-sm">
              <table className="w-full min-w-[960px] text-left text-sm">
                <caption className="sr-only">{adminText.orders.tableLabel}</caption>
                <thead className="border-b border-ink/10 bg-ink/5">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-ink">
                      {adminText.orders.colOrder}
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-ink">
                      {adminText.orders.colCustomer}
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-ink">
                      {adminText.orders.colPhone}
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-ink">
                      {adminText.orders.colProducts}
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-ink">
                      {adminText.orders.colType}
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-ink">
                      {adminText.orders.colTotal}
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-ink">
                      {adminText.orders.colPayment}
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-ink">
                      {adminText.orders.colStatus}
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-semibold text-ink">
                      {adminText.orders.colCreated}
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right font-semibold text-ink">
                      {adminText.orders.colActions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {result.orders.map((order) => {
                    const isBusy = updatingId === order.id;
                    const possibleNext = NEXT_STATUSES[order.status] ?? [];
                    const nextForward = possibleNext.find((s) => s !== "cancelled" && s !== "pending");

                    // Products display: concise line snapshots
                    const productsSummary = order.items && order.items.length > 0
                      ? order.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")
                      : `${order.itemCount} items`;

                    return (
                      <tr key={order.id} className="transition-colors hover:bg-ink/[0.02]">
                        {/* Order ID */}
                        <td className="px-4 py-3.5 font-semibold">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono text-orange hover:text-orange-dark hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3.5 font-medium text-ink">{order.customerName}</td>

                        {/* Phone */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {order.phone ? (
                            <a
                              href={`tel:${order.phone}`}
                              className="font-mono text-xs text-muted hover:text-ink hover:underline"
                            >
                              {order.phone}
                            </a>
                          ) : (
                            <span className="text-muted/60">—</span>
                          )}
                        </td>

                        {/* Ordered Products with Quantities */}
                        <td className="px-4 py-3.5 max-w-[220px]">
                          <p className="truncate text-xs text-ink/80" title={productsSummary}>
                            {productsSummary}
                          </p>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5">
                          <Badge variant={order.orderType === "delivery" ? "gold" : "neutral"} size="sm">
                            {adminText.common.type[order.orderType]}
                          </Badge>
                        </td>

                        {/* Total */}
                        <td className="px-4 py-3.5 whitespace-nowrap font-bold text-ink">
                          {formatMoney(order.totalMinor, order.currency, order.locale)}
                        </td>

                        {/* Payment Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge variant={order.status === "completed" ? "success" : "neutral"} size="sm">
                            {order.status === "completed" ? "Paid" : "Pay on Pickup / Delivery"}
                          </Badge>
                        </td>

                        {/* Order Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Date & Time */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted">
                          {formatDateTime(order.createdAt, timezone)}
                        </td>

                        {/* Quick Update Status & Details Action */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {nextForward && (
                              <Button
                                size="sm"
                                variant={nextForward === "completed" ? "primary" : "secondary"}
                                loading={isBusy}
                                disabled={isBusy || updatingId !== null}
                                onClick={() => handleStatusTransition(order, nextForward)}
                                className="text-xs font-semibold px-2.5 py-1 min-h-8"
                              >
                                {(adminText.actions as Record<string, string>)[nextForward] ?? nextForward}
                              </Button>
                            )}

                            <ButtonLink
                              href={`/admin/orders/${order.id}`}
                              size="sm"
                              variant="ghost"
                              className="text-xs px-2 min-h-8 text-muted hover:text-ink"
                            >
                              {adminText.orders.viewDetails} →
                            </ButtonLink>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={result.pagination.page}
              pageSize={result.pagination.pageSize}
              total={result.pagination.total}
              onPageChange={(next) => setParam("page", String(next))}
            />
          </div>
        )
      )}
    </div>
  );
}
