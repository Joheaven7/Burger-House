// Restaurant-local time helpers. All stored timestamps are UTC; "today" and opening hours use the settings timezone.

export interface OpeningHour {
  day: number; // 0 = Sunday ... 6 = Saturday
  open: string; // "HH:MM" 24-hour
  close: string; // "HH:MM"; if earlier than open, the range continues past midnight
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function localParts(date: Date, timeZone: string) {
  const parts = formatter(timeZone).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: WEEKDAYS.indexOf(get("weekday")),
  };
}

function offsetMs(date: Date, timeZone: string): number {
  const p = localParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Converts a wall-clock time in `timeZone` to the matching UTC instant. */
export function zonedTimeToUtc(y: number, m: number, d: number, h: number, min: number, timeZone: string): Date {
  const guess = Date.UTC(y, m - 1, d, h, min, 0);
  let utc = guess - offsetMs(new Date(guess), timeZone);
  utc = guess - offsetMs(new Date(utc), timeZone); // second pass handles daylight-saving edges
  return new Date(utc);
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** "2026-11-02" for the restaurant-local calendar day of `date`. */
export function localDateString(date: Date, timeZone: string): string {
  const p = localParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** UTC range [start, end) covering one restaurant-local calendar day ("YYYY-MM-DD"). */
export function localDayRange(dateString: string, timeZone: string): { start: Date; end: Date } {
  const [y, m, d] = dateString.split("-").map(Number);
  const start = zonedTimeToUtc(y, m, d, 0, 0, timeZone);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const end = zonedTimeToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0, timeZone);
  return { start, end };
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export function isOpenNow(hours: OpeningHour[], now: Date, timeZone: string): boolean {
  const { weekday, hour, minute } = localParts(now, timeZone);
  const minutes = hour * 60 + minute;
  const yesterday = (weekday + 6) % 7;

  for (const range of hours) {
    const open = toMinutes(range.open);
    const close = toMinutes(range.close);
    if (open === close) continue;
    if (open < close) {
      if (range.day === weekday && minutes >= open && minutes < close) return true;
    } else {
      // overnight range, for example 18:00 to 02:00
      if (range.day === weekday && minutes >= open) return true;
      if (range.day === yesterday && minutes < close) return true;
    }
  }
  return false;
}