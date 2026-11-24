/** Date and time in the restaurant's timezone, for example "2 Nov 2026, 14:05". */
export function formatDateTime(iso: string, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(iso));
  } catch {
    return iso;
  }
}