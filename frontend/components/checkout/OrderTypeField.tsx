import clsx from "clsx";
import { Badge } from "@/components/ui/Badge";
import { messages } from "@/messages/en";
import type { OrderType } from "@/types/order";

interface OrderTypeFieldProps {
  value: OrderType;
  onChange: (value: OrderType) => void;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFeeText: string;
  deliveryNote?: string;
}

const optionClass =
  "relative flex cursor-pointer flex-col gap-2 rounded-card border p-5 transition-all outline-none has-[:checked]:border-orange has-[:checked]:bg-orange/5 has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange/30";

export function OrderTypeField({
  value,
  onChange,
  pickupEnabled,
  deliveryEnabled,
  deliveryFeeText,
  deliveryNote,
}: OrderTypeFieldProps) {
  return (
    <fieldset id="field-orderType" className="space-y-3">
      <legend className="text-sm font-semibold tracking-wide text-ink">
        {messages.checkout.orderTypeLegend}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {pickupEnabled && (
          <label className={clsx(optionClass, value === "pickup" ? "border-orange" : "border-ink/15 bg-surface")}>
            <input
              type="radio"
              name="orderType"
              value="pickup"
              checked={value === "pickup"}
              onChange={() => onChange("pickup")}
              className="sr-only"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="font-editorial text-lg font-bold text-ink">{messages.checkout.pickup}</span>
              <span
                className={clsx(
                  "h-4 w-4 rounded-full border-2 transition-all flex items-center justify-center",
                  value === "pickup" ? "border-orange bg-orange" : "border-ink/30",
                )}
                aria-hidden="true"
              >
                {value === "pickup" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
            </div>
            <span className="text-xs text-muted leading-relaxed">{messages.checkout.pickupHint}</span>
          </label>
        )}

        {deliveryEnabled && (
          <label className={clsx(optionClass, value === "delivery" ? "border-orange" : "border-ink/15 bg-surface")}>
            <input
              type="radio"
              name="orderType"
              value="delivery"
              checked={value === "delivery"}
              onChange={() => onChange("delivery")}
              className="sr-only"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="font-editorial text-lg font-bold text-ink">{messages.checkout.delivery}</span>
              <span
                className={clsx(
                  "h-4 w-4 rounded-full border-2 transition-all flex items-center justify-center",
                  value === "delivery" ? "border-orange bg-orange" : "border-ink/30",
                )}
                aria-hidden="true"
              >
                {value === "delivery" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="gold" size="sm">
                {deliveryFeeText}
              </Badge>
            </div>
            {deliveryNote && <span className="text-xs text-muted">{deliveryNote}</span>}
          </label>
        )}
      </div>
    </fieldset>
  );
}
