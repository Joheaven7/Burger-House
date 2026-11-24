import { formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { adminText } from "@/messages/admin";
import { messages } from "@/messages/en";
import type { AdminOrderDetail } from "@/types/admin";

/** A plain black-and-white ticket for the kitchen. Hidden on screen, the only thing shown when printing (ADM-11). */
export function OrderTicket({ order, timezone }: { order: AdminOrderDetail; timezone?: string }) {
  const money = (amount: number) => formatMoney(amount, order.currency, order.locale);
  return (
    <div className="hidden text-black print:block">
      <p className="text-center text-2xl font-bold uppercase">{messages.siteName}</p>
      <p className="mt-2 text-center text-3xl font-bold">{order.orderNumber}</p>
      <p className="text-center">{formatDateTime(order.createdAt, timezone)}</p>
      <hr className="my-3 border-black" />
      <p className="text-xl font-bold uppercase">{adminText.common.type[order.orderType]}</p>
      <p>{order.customerName}</p>
      <p>{order.phone}</p>
      {order.address && <p>{order.address}</p>}
      {order.note && (
        <p className="mt-2 border border-black p-2">
          {adminText.detail.note}: {order.note}
        </p>
      )}
      <hr className="my-3 border-black" />
      <ul className="space-y-1 text-lg">
        {order.items.map((line, index) => (
          <li key={`${line.itemId}-${index}`} className="flex justify-between gap-4">
            <span>
              {line.quantity} × {line.name}
            </span>
            <span>{money(line.lineTotalMinor)}</span>
          </li>
        ))}
      </ul>
      <hr className="my-3 border-black" />
      {order.deliveryFeeMinor > 0 && (
        <p className="flex justify-between">
          <span>{adminText.detail.deliveryFee}</span>
          <span>{money(order.deliveryFeeMinor)}</span>
        </p>
      )}
      <p className="flex justify-between text-xl font-bold">
        <span>{adminText.detail.total}</span>
        <span>{money(order.totalMinor)}</span>
      </p>
    </div>
  );
}