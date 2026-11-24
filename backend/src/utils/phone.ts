import { isSupportedCountry, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/** International format (E.164) such as "+251911234567", or null if the number is not valid. */
export function parsePhone(input: string, defaultCountry: string): string | null {
  const country = isSupportedCountry(defaultCountry) ? (defaultCountry as CountryCode) : undefined;
  const parsed = parsePhoneNumberFromString(input.trim(), country);
  return parsed && parsed.isValid() ? parsed.number : null;
}

export function isCountrySupported(code: string): boolean {
  return isSupportedCountry(code);
}