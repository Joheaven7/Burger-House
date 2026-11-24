/** How many decimal places a currency uses (ETB = 2, JPY = 0). Falls back to 2 for unknown codes. */
export function fractionDigits(currency: string, locale = "en"): number {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** 28000 -> "280.00" for a text box. */
export function minorToInput(minor: number, digits: number): string {
  return (minor / 10 ** digits).toFixed(digits);
}

/** "280.5" -> 28050. Returns null when the text is not a valid amount. Only whole minor units are produced. */
export function parseMoneyInput(text: string, digits: number): number | null {
  const cleaned = text.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  if (fraction.length > digits || whole.length > 10) return null;
  const minor = Number(whole + fraction.padEnd(digits, "0"));
  return Number.isSafeInteger(minor) ? minor : null;
}