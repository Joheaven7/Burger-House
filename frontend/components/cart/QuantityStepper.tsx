import { messages } from "@/messages/en";

interface QuantityStepperProps {
  name: string;
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
}

const buttonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-control border border-ink/20 bg-surface text-lg font-semibold text-ink transition-all hover:border-orange hover:text-orange-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ink/20 disabled:hover:text-ink disabled:active:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-orange/30";

export function QuantityStepper({ name, quantity, max, onChange }: QuantityStepperProps) {
  return (
    <div role="group" aria-label={messages.cart.quantityOf(name)} className="inline-flex items-center gap-2">
      <button
        type="button"
        className={buttonClass}
        aria-label={messages.cart.decrease(name)}
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
      >
        <span aria-hidden="true">−</span>
      </button>
      <span className="min-w-8 text-center text-base font-bold text-ink">{quantity}</span>
      <button
        type="button"
        className={buttonClass}
        aria-label={messages.cart.increase(name)}
        disabled={quantity >= max}
        onClick={() => onChange(quantity + 1)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
