"use client";

import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api-error";
import {
  parsePhone,
  validateCheckout,
  type CheckoutFieldErrors,
  type CheckoutValues,
} from "@/lib/checkout-schema";
import { submitOrder } from "@/services/orders";
import type { PublicSettings } from "@/services/settings";
import type { CartLine, CheckoutRequest, OrderConfirmation, OrderType, Quote } from "@/types/order";

export type SubmitErrorKind =
  | "priceChanged"
  | "unavailable"
  | "ordering"
  | "validation"
  | "rateLimited"
  | "network"
  | "unknown";

export type FormField = "name" | "phone" | "address" | "note";

interface UseCheckoutFormArgs {
  settings: PublicSettings;
  orderType: OrderType;
  lines: CartLine[];
  quote: Quote | null;
  quoteReady: boolean;
  refreshQuote: () => void;
  onSuccess: (confirmation: OrderConfirmation) => void;
}

function classify(error: unknown): SubmitErrorKind {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "MENU_PRICE_CHANGED":
        return "priceChanged";
      case "MENU_ITEM_UNAVAILABLE":
        return "unavailable";
      case "ORDERING_UNAVAILABLE":
        return "ordering";
      case "VALIDATION_FAILED":
        return "validation";
      case "RATE_LIMITED":
        return "rateLimited";
      case "NETWORK_ERROR":
        return "network";
      default:
        return "unknown";
    }
  }
  return "network"; // for example a fetch that never reached the server
}

export function useCheckoutForm({
  settings,
  orderType,
  lines,
  quote,
  quoteReady,
  refreshQuote,
  onSuccess,
}: UseCheckoutFormArgs) {
  const [values, setValues] = useState<Record<FormField, string>>({ name: "", phone: "", address: "", note: "" });
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitErrorKind | null>(null);
  const [summaryFocusTick, setSummaryFocusTick] = useState(0);
  const idempotency = useRef<{ key: string; payload: string } | null>(null);

  const allErrors = useMemo<CheckoutFieldErrors>(
    () => validateCheckout({ ...values, orderType } as CheckoutValues, settings.defaultPhoneCountry),
    [values, orderType, settings.defaultPhoneCountry],
  );

  // Errors only appear once the person touched a field or tried to submit
  const visibleErrors = useMemo<CheckoutFieldErrors>(() => {
    const visible: CheckoutFieldErrors = {};
    for (const field of Object.keys(allErrors) as (keyof CheckoutValues)[]) {
      if (attempted || touched[field as FormField]) visible[field] = allErrors[field];
    }
    return visible;
  }, [allErrors, attempted, touched]);

  const setField = useCallback((field: FormField, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
  }, []);

  const markTouched = useCallback((field: FormField) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return; // blocks double clicks

    setAttempted(true);
    if (Object.keys(allErrors).length > 0) {
      setSummaryFocusTick((tick) => tick + 1);
      return;
    }
    if (!quote || !quoteReady || quote.block) return;

    const phone = parsePhone(values.phone, settings.defaultPhoneCountry);
    if (!phone) return;

    const request: CheckoutRequest = {
      items: lines,
      orderType,
      customerName: values.name.trim(),
      phone,
      address: orderType === "delivery" ? values.address.trim() : undefined, // pickup sends no address
      note: values.note.trim() || undefined,
      expectedTotalMinor: quote.totalMinor,
    };

    // Same data = same key (a retry can never create a second order). Changed data = new key.
    const payload = JSON.stringify(request);
    let entry = idempotency.current;
    if (!entry || entry.payload !== payload) {
      entry = { key: crypto.randomUUID(), payload };
      idempotency.current = entry;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const confirmation = await submitOrder(request, entry.key);
      onSuccess(confirmation);
    } catch (error) {
      const kind = classify(error);
      if (kind === "priceChanged" || kind === "unavailable" || kind === "ordering") refreshQuote();
      setSubmitError(kind);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    setField,
    markTouched,
    visibleErrors,
    submitting,
    submitError,
    summaryFocusTick,
    handleSubmit,
  };
}