"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatCard, StatusBadge } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Controls";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminLive } from "@/features/admin/LiveContext";
import { formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { adminText } from "@/messages/admin";
import { getSettings, listOrders, updateSettings } from "@/services/admin";
import type { AdminOrderSummary } from "@/types/admin";

export function OverviewView() {
  const { stats, error, refresh } = useAdminLive();
  const [paused, setPaused] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState(false);
  const [recent, setRecent] = useState<AdminOrderSummary[] | null>(null);

  // The pause switch needs the current setting
  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((settings) => {
        if (!cancelled) setPaused(settings.ordersPaused);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // The recent-orders list reloads whenever the live numbers change (a new order arrived, a status changed)
  const liveKey = stats ? `${stats.ordersToday}-${stats.pendingNow}-${stats.revenueMinor}` : "";
  useEffect(() => {
    if (!liveKey) return;
    const controller = new AbortController();
    listOrders({ pageSize: 5 }, controller.signal)
      .then((result) => setRecent(result.orders))
      .catch(() => undefined);
    return () => controller.abort();
  }, [liveKey]);

  const handleToggle = async (next: boolean) => {
    setToggling(true);
    setToggleError(false);
    try {
      const updated = await updateSettings({ ordersPaused: next });
      setPaused(updated.ordersPaused);
    } catch {
      setToggleError(true);
    } finally {
      setToggling(false);
    }
  };

  if (!stats) {
    if (error) return <ErrorState onRetry={() => void refresh()} />;
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-28 rounded-card bg-ink/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Real-Time Operational KPI Cards */}
      <section aria-label={adminText.overview.title} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label={adminText.overview.totalOrders} value={stats.totalOrdersAllTime ?? stats.ordersToday} />
        <StatCard label={adminText.overview.receivedOrders} value={stats.allTimeByStatus?.received ?? stats.pendingNow} note="Needs preparation" />
        <StatCard label={adminText.overview.preparingOrders} value={stats.allTimeByStatus?.preparing ?? (stats.byStatus.preparing ?? 0)} />
        <StatCard label={adminText.overview.readyOrders} value={stats.allTimeByStatus?.ready ?? (stats.byStatus.ready ?? stats.byStatus.ready_for_pickup ?? 0)} />
        <StatCard label={adminText.overview.completedOrders} value={stats.allTimeByStatus?.completed ?? (stats.byStatus.completed ?? 0)} />
        <StatCard
          label={adminText.overview.revenueToday}
          value={formatMoney(stats.revenueMinor, stats.currency, stats.locale)}
          note={adminText.overview.revenueNote}
        />
      </section>

      {/* Master Kitchen Order Switch */}
      <Card surface="light" padding="lg" className="border-ink/10 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 id="ordering-title" className="font-editorial text-2xl font-bold text-ink">
                {adminText.overview.orderingTitle}
              </h2>
              {paused !== null && (
                <Badge variant={paused ? "danger" : "success"} size="sm" dot>
                  {paused ? "Paused" : "Active"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted">
              {paused === null ? "Loading state…" : paused ? adminText.overview.orderingPaused : adminText.overview.orderingOpen}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-ink">{adminText.overview.pauseLabel}</span>
            <Switch
              checked={paused === true}
              disabled={paused === null || toggling}
              label={adminText.overview.pauseLabel}
              onChange={handleToggle}
            />
          </div>
        </div>

        {toggleError && (
          <p role="alert" className="mt-3 text-sm font-semibold text-orange-dark">
            {adminText.overview.pauseFailed}
          </p>
        )}
      </Card>

      {/* Live Recent Orders Stream */}
      <section aria-labelledby="recent-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="recent-title" className="font-editorial text-2xl font-bold tracking-tight text-ink">
              {adminText.overview.recentTitle}
            </h2>
            <p className="text-xs text-muted">Latest orders placed via guest checkout</p>
          </div>
          <ButtonLink href="/admin/orders" variant="secondary" size="sm">
            {adminText.overview.viewAll} →
          </ButtonLink>
        </div>

        {recent === null ? (
          <Skeleton className="h-36 rounded-card bg-ink/10" />
        ) : recent.length === 0 ? (
          <Card surface="light" padding="lg" className="border-ink/10 text-center text-muted">
            {adminText.overview.noOrders}
          </Card>
        ) : (
          <div className="overflow-hidden rounded-card border border-ink/10 bg-surface shadow-sm">
            <ul className="divide-y divide-ink/5">
              {recent.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6 hover:bg-cream/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-editorial text-lg font-bold text-orange-dark hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted">
                      <span className="font-medium text-ink">{order.customerName}</span> · {formatDateTime(order.createdAt, stats.timezone)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-base text-ink">
                      {formatMoney(order.totalMinor, order.currency, order.locale)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
