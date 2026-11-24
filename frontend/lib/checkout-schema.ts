import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { z } from "zod";
import { messages } from "@/messages/en";
import type { OrderType } from "@/types/order";

const e = messages.checkout.errors;

export interface CheckoutValues {
  name: string;
  phone: string;
  orderType: OrderType;
  address: string;
  note: string;
}

export type CheckoutFieldErrors = Partial<Record<keyof CheckoutValues, string>>;

function hasControlChars(value: string, allowNewlines: boolean): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const isControl = code < 32 || code === 127;
    const isAllowedWhitespace = allowNewlines && (code === 9 || code === 10 || code === 13);
    if (isControl && !isAllowedWhitespace) return true;
  }
  return false;
}

/** Returns the phone in international format (E.164), or null if it is not valid. */
export function parsePhone(input: string, defaultCountry: string): string | null {
  const parsed = parsePhoneNumberFromString(input.trim(), defaultCountry as CountryCode);
  return parsed && parsed.isValid() ? parsed.number : null;
}

export function buildCheckoutSchema(defaultCountry: string) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, e.nameRequired)
        .max(80, e.nameTooLong)
        .refine((v) => !hasControlChars(v, false), e.invalidChars),
      phone: z
        .string()
        .trim()
        .min(1, e.phoneRequired)
        .refine((v) => parsePhone(v, defaultCountry) !== null, e.phoneInvalid),
      orderType: z.enum(["pickup", "delivery"]),
      address: z
        .string()
        .trim()
        .max(250, e.addressTooLong)
        .refine((v) => !hasControlChars(v, true), e.invalidChars),
      note: z
        .string()
        .trim()
        .max(300, e.noteTooLong)
        .refine((v) => !hasControlChars(v, true), e.invalidChars),
    })
    .superRefine((value, ctx) => {
      if (value.orderType === "delivery" && value.address.length === 0) {
        ctx.addIssue({ code: "custom", path: ["address"], message: e.addressRequired });
      }
    });
}

/** Returns one message per invalid field (empty object = everything is valid). */
export function validateCheckout(values: CheckoutValues, defaultCountry: string): CheckoutFieldErrors {
  const result = buildCheckoutSchema(defaultCountry).safeParse(values);
  if (result.success) return {};

  const errors: CheckoutFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CheckoutValues | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}