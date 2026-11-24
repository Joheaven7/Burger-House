import Link from "next/link";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/money";
import { messages } from "@/messages/en";

interface CartLineRowProps {
  itemId: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
  maxQuantity: number;
  currency: string;
  locale: string;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLineRow({
  itemId,
  name,
  unitPriceMinor,
  quantity,
  maxQuantity,
  currency,
  locale,
  onQuantityChange,
  onRemove,
}: CartLineRowProps) {
  return (
    <li className="flex flex-col gap-4 rounded-card border border-ink/10 bg-surface p-5 shadow-sm transition-all hover:border-ink/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <Link
          href={`/menu/${itemId}`}
          className="font-editorial text-xl font-bold text-ink hover:text-orange-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/30 rounded"
        >
          {name}
        </Link>
        <p className="text-sm text-muted">
          {formatMoney(unitPriceMinor, currency, locale)} <span className="text-xs text-muted/70">{messages.cart.each}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-5">
        <QuantityStepper name={name} quantity={quantity} max={maxQuantity} onChange={onQuantityChange} />
        <p className="min-w-24 text-right font-semibold text-base sm:text-lg text-ink">
          {formatMoney(unitPriceMinor * quantity, currency, locale)}
        </p>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          {messages.cart.remove}
          <span className="sr-only"> {name}</span>
        </Button>
      </div>
    </li>
  );
}
