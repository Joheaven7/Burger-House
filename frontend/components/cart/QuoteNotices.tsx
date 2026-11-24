import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/money";
import { messages } from "@/messages/en";
import type { Quote, QuoteConflict } from "@/types/order";

function blockText(quote: Quote): string | null {
  const block = quote.block;
  if (!block) return null;
  switch (block.code) {
    case "ORDERING_PAUSED":
      return messages.notices.orderingPaused;
    case "ORDERING_CLOSED":
      return messages.notices.orderingClosed;
    case "ORDER_TYPE_DISABLED":
      return block.orderType ? messages.notices.orderTypeDisabled[block.orderType] : null;
    case "TOO_MANY_ITEMS":
      return messages.notices.tooManyItems(block.maxItemsPerOrder ?? 0);
    case "BELOW_MINIMUM":
      return messages.notices.belowMinimum(formatMoney(block.minimumOrderMinor ?? 0, quote.currency, quote.locale));
    default:
      return null;
  }
}

function conflictText(conflict: QuoteConflict): string {
  if (conflict.reason === "removed" || !conflict.name) return messages.notices.removedItem;
  if (conflict.reason === "unavailable") return messages.notices.soldOutItem(conflict.name);
  return messages.notices.quantityLimit(conflict.name);
}

interface QuoteNoticesProps {
  quote: Quote;
  onRemoveUnavailable?: () => void;
}

export function QuoteNotices({ quote, onRemoveUnavailable }: QuoteNoticesProps) {
  const text = blockText(quote);
  if (!text && quote.conflicts.length === 0) return null;

  return (
    <div role="status" className="space-y-3 rounded-card border border-copper/40 bg-copper/10 p-5 shadow-sm text-ink">
      {text && (
        <div className="flex items-start gap-2.5">
          <span className="text-copper-dark font-bold text-lg leading-none" aria-hidden="true">
            ⚠
          </span>
          <p className="font-semibold text-sm sm:text-base">{text}</p>
        </div>
      )}

      {quote.conflicts.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-copper/20">
          <p className="font-semibold text-sm text-copper-dark">{messages.notices.itemsUnavailable}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {quote.conflicts.map((conflict) => (
              <li key={conflict.itemId}>{conflictText(conflict)}</li>
            ))}
          </ul>
          {onRemoveUnavailable && (
            <div className="pt-1">
              <Button variant="secondary" size="sm" onClick={onRemoveUnavailable}>
                {messages.cart.removeUnavailable}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
