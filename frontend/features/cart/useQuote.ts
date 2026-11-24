"use client";

import { useCallback, useEffect, useState } from "react";
import { quoteOrder } from "@/services/orders";
import type { CartLine, OrderType, Quote, QuoteInput } from "@/types/order";

interface QuoteResult {
  requestKey: string;
  quote: Quote | null;
  failed: boolean;
}

export function useQuote(lines: CartLine[], orderType: OrderType | undefined, enabled: boolean) {
  const [reloadTick, setReloadTick] = useState(0);
  const [result, setResult] = useState<QuoteResult | null>(null);

  const inputKey = JSON.stringify({ lines, orderType });
  const requestKey = `${inputKey}#${reloadTick}`;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const input = JSON.parse(inputKey) as QuoteInput;

    quoteOrder(input)
      .then((quote) => {
        if (!cancelled) setResult({ requestKey, quote, failed: false });
      })
      .catch(() => {
        if (!cancelled) setResult((previous) => ({ requestKey, quote: previous?.quote ?? null, failed: true }));
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, inputKey, requestKey]);

  const isCurrent = result !== null && result.requestKey === requestKey;
  const failed = result !== null && result.requestKey === requestKey && result.failed;
  const refresh = useCallback(() => setReloadTick((tick) => tick + 1), []);

  return {
    quote: result?.quote ?? null, // the latest known prices (may be one update behind)
    loading: enabled && !isCurrent,
    error: failed,
    refresh,
  };
}