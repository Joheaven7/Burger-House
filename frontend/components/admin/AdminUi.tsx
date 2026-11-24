"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { adminText } from "@/messages/admin";
import type { OrderStatus } from "@/types/admin";

// ---------- order status badge with semantic luxury styling ----------
export function StatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case "received":
    case "pending":
      return (
        <Badge variant="gold" size="sm" dot>
          {adminText.status[status] ?? "Received"}
        </Badge>
      );
    case "preparing":
      return (
        <Badge variant="brand" size="sm" dot>
          {adminText.status[status] ?? "Preparing"}
        </Badge>
      );
    case "ready_for_pickup":
    case "ready":
      return (
        <Badge variant="neutral" size="sm" dot>
          {adminText.status[status] ?? "Ready for Pickup"}
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="success" size="sm" dot>
          {adminText.status[status] ?? "Completed"}
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="danger" size="sm" dot>
          {adminText.status[status] ?? "Cancelled"}
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size="sm">
          {status}
        </Badge>
      );
  }
}

// ---------- an executive KPI card on the overview ----------
export function StatCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <Card surface="light" padding="md" hover className="border-ink/10 shadow-sm flex flex-col justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-2 font-editorial text-3xl sm:text-4xl font-bold text-ink">{value}</p>
      </div>
      {note && <p className="mt-2 text-xs text-muted/80 pt-2 border-t border-ink/5">{note}</p>}
    </Card>
  );
}

// ---------- previous / next pagination ----------
interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-sm text-muted">
        {adminText.orders.countLabel(total)} · {adminText.orders.pageLabel(page, pages)}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {adminText.orders.previous}
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          {adminText.orders.next}
        </Button>
      </div>
    </nav>
  );
}

// ---------- confirmation modal pop-up ----------
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = adminText.common.cancel,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="space-y-4">
        <p className="text-sm sm:text-base text-muted">{message}</p>
        {error && (
          <p role="alert" className="text-sm font-semibold text-orange-dark">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
