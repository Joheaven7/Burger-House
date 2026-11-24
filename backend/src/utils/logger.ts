import { env } from "../config/env";

const order = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof order;

function write(level: Level, message: string, fields?: Record<string, unknown>) {
  if (order[level] < order[env.LOG_LEVEL]) return;
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...fields });
  (level === "error" ? console.error : console.log)(line);
}

// Never pass phone numbers, addresses, notes, passwords or tokens in `fields`.
export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => write("debug", message, fields),
  info: (message: string, fields?: Record<string, unknown>) => write("info", message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => write("warn", message, fields),
  error: (message: string, fields?: Record<string, unknown>) => write("error", message, fields),
};