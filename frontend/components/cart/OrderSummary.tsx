import { formatMoney } from "@/lib/money";
import { messages } from "@/messages/en";

interface OrderSummaryProps {
  currency: string;
  locale: string;
  subtotalMinor: number;
  deliveryFeeMinor?: number; // omit for pickup or on the cart page
  totalMinor?: number; // omit on the cart page
}

export function OrderSummary({
  currency,
  locale,
  subtotalMinor,
  deliveryFeeMinor,
  totalMinor,
}: OrderSummaryProps) {
  const money = (amount: number) => formatMoney(amount, currency, locale);

  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted">{messages.cart.subtotal}</dt>
        <dd className="font-semibold text-ink">{money(subtotalMinor)}</dd>
      </div>

      {deliveryFeeMinor !== undefined && (
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{messages.cart.deliveryFee}</dt>
          <dd className="font-semibold text-ink">
            {deliveryFeeMinor === 0 ? "Free" : money(deliveryFeeMinor)}
          </dd>
        </div>
      )}

      {totalMinor !== undefined && (
        <div className="flex items-baseline justify-between gap-4 border-t border-ink/10 pt-4">
          <dt className="text-base font-bold text-ink">{messages.cart.total}</dt>
          <dd className="font-editorial text-2xl sm:text-3xl font-bold text-orange-dark">
            {money(totalMinor)}
          </dd>
        </div>
      )}
    </dl>
  );
}
