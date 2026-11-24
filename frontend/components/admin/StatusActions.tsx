"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { ApiError } from "@/lib/api-error";
import { errorMessage } from "@/lib/api-fields";
import { NEXT_STATUSES } from "@/lib/order-status";
import { adminText } from "@/messages/admin";
import { changeOrderStatus } from "@/services/admin";
import type { AdminOrderDetail, OrderStatus } from "@/types/admin";

interface StatusActionsProps {
  order: AdminOrderDetail;
  onUpdated: (order: AdminOrderDetail) => void;
  onConflict: () => void;
}

export function StatusActions({ order, onUpdated, onConflict }: StatusActionsProps) {
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [confirm, setConfirm] = useState<OrderStatus | null>(null);

  const next = NEXT_STATUSES[order.status];

  const apply = async (newStatus: OrderStatus, cancelReason?: string) => {
    setBusy(newStatus);
    setError(null);
    try {
      // expectedStatus = the status this admin is looking at; the server refuses if someone else changed it first
      const updated = await changeOrderStatus(order.id, { expectedStatus: order.status, newStatus, reason: cancelReason });
      setCancelOpen(false);
      setConfirm(null);
      setReason("");
      onUpdated(updated);
    } catch (caught) {
      setCancelOpen(false);
      setConfirm(null);
      if (caught instanceof ApiError && caught.code === "INVALID_STATUS_TRANSITION") {
        setError(adminText.detail.conflict);
        onConflict();
      } else {
        setError(errorMessage(caught, adminText.common.unexpected));
      }
    } finally {
      setBusy(null);
    }
  };

  if (next.length === 0) {
    return <p className="text-muted">{adminText.detail.finalStatus}</p>;
  }

  const forward = next.filter((status): status is "preparing" | "ready" | "completed" => status !== "cancelled" && status !== "pending");

  const submitCancel = () => {
    if (!reason.trim()) {
      setReasonError(adminText.detail.reasonRequired);
      return;
    }
    setReasonError(undefined);
    void apply("cancelled", reason.trim());
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {forward.map((status) => (
          <Button key={status} size="lg" loading={busy === status} disabled={busy !== null} onClick={() => (status === "completed" ? setConfirm(status) : void apply(status))}>
            {adminText.actions[status]}
          </Button>
        ))}
        {next.includes("cancelled") && (
          <Button variant="secondary" size="lg" disabled={busy !== null} onClick={() => setCancelOpen(true)}>
            {adminText.actions.cancelled}
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="font-semibold text-tomato-dark">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirm === "completed"}
        title={adminText.actions.completed}
        message={`${order.orderNumber}: ${adminText.detail.finalStatus}`}
        confirmLabel={adminText.actions.completed}
        loading={busy === "completed"}
        onConfirm={() => void apply("completed")}
        onCancel={() => setConfirm(null)}
      />

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title={adminText.detail.cancelTitle}>
        <div className="space-y-4">
          <p>{adminText.detail.cancelText}</p>
          <Textarea
            id="cancel-reason"
            label={adminText.detail.reasonLabel}
            rows={3}
            value={reason}
            error={reasonError}
            onChange={(event) => setReason(event.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={busy !== null}>
              {adminText.detail.keepOrder}
            </Button>
            <Button onClick={submitCancel} loading={busy === "cancelled"}>
              {adminText.detail.cancelConfirm}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}