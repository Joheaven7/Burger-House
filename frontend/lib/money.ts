/** An amount in the smallest currency unit, for example 899 = 8.99. Always an integer. */
export type MinorUnits = number;

export function assertMinorUnits(value: number): asserts value is MinorUnits {
  if (!Number.isInteger(value)) {
    throw new Error(`Money must be an integer in minor units, received ${value}`);
  }
}

/** Formats minor units for display, e.g. formatMoney(899, "USD") -> "$8.99". */
export function formatMoney(amountMinor: MinorUnits, currency: string, locale = "en"): string {
  assertMinorUnits(amountMinor);
  const formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** digits);
}